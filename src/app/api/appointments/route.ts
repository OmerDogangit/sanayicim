import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as jose from 'jose'; // Token'ı doğrulamak için

// === YARDIMCI FONKSİYONLAR (Diğer API'lerden) ===
const JWT_SECRET = process.env.JWT_SECRET || "varsayilan-cok-gizli-anahtar-bunu-degistir";

async function verifyToken(token: string) {
  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}

async function getUserFromRequest(request: Request) {
  const cookieStore = request.headers.get('cookie');
  if (!cookieStore) return null;

  const token = cookieStore.split('; ')
                           .find(row => row.startsWith('sanayicim_token='))
                           ?.split('=')[1];

  if (!token) return null;

  const userPayload = await verifyToken(token);
  return userPayload;
}
// ==============================

// ---
// POST: YENİ BİR RANDEVU OLUŞTURMA
// ---
export async function POST(request: Request) { 
  try {
    // 1. Randevu alan kullanıcı kim? (Giriş yapmış olmalı)
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz: Randevu almak için giriş yapmalısınız' }, { status: 401 });
    }

    // 2. Sadece "müşteriler" randevu alabilir
    if ((user as any).role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz: Sadece müşteriler randevu alabilir' }, { status: 403 });
    }

    // 3. Formdan gelen bilgileri al
    const body = await request.json();
    const { 
      shopId,     // Hangi dükkandan
      serviceId,  // Hangi hizmet için
      date,       // Hangi tarihte (örn: "2025-11-17")
      startTime,  // Hangi saatte (örn: "09:00")
      endTime     // Bitiş saati (hizmet süresine göre hesaplanmış)
    } = body;

    if (!shopId || !serviceId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Tüm randevu bilgileri zorunludur' }, { status: 400 });
    }
    
    // ISO formatına çevir
    const isoStartTime = new Date(`${date}T${startTime}:00`);
    const isoEndTime = new Date(`${date}T${endTime}:00`);

    // 4. Çakışma Kontrolü: Bu saatte zaten bir randevu var mı?
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        shopId: Number(shopId),
        date: new Date(date),
        // Yeni randevu, mevcut bir randevunun içine mi taşıyor?
        OR: [
          { // Yeni randevu, mevcutun içinde başlıyor
            startTime: { lt: isoEndTime },
            endTime: { gt: isoStartTime },
          }
        ]
      }
    });

    if (existingAppointment) {
      return NextResponse.json({ error: 'Seçilen zaman dilimi dolu. Lütfen başka bir saat seçin.' }, { status: 409 }); // 409 Conflict
    }

    // 5. Randevuyu oluştur
    const newAppointment = await prisma.appointment.create({
      data: {
        date: new Date(date),
        startTime: isoStartTime,
        endTime: isoEndTime,
        shopId: Number(shopId),
        serviceId: Number(serviceId),
        customerId: (user as any).id, // Randevuyu giriş yapan müşteriye bağla
        status: "pending", // Durum: beklemede
      }
    });

    return NextResponse.json(newAppointment, { status: 201 });

  } catch (error) {
    console.log("APPOINTMENT_POST_ERROR", error);
    return NextResponse.json({ error: 'Randevu oluşturulamadı' }, { status: 500 });
  }
}