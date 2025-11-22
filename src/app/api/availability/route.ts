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
// POST: BİR DÜKKANA YENİ MÜSAİTLİK EKLEME
// ---
export async function POST(request: Request) { 
  try {
    // 1. Giriş yapan kullanıcı kim?
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz: Geçerli bir token bulunamadı' }, { status: 401 });
    }

    // 2. Kullanıcının rolü "owner" (dükkan sahibi) mı?
    if ((user as any).role !== 'owner') {
      return NextResponse.json({ error: 'Yetkisiz: Sadece dükkan sahipleri müsaitlik ekleyebilir' }, { status: 403 });
    }

    // 3. Formdan gelen bilgileri al
    const body = await request.json();
    const { 
      shopId, // Hangi dükkana eklenecek?
      date,   // Hangi tarih? (örn: "2025-11-17")
      startTime, // Başlangıç saati (örn: "09:00")
      endTime    // Bitiş saati (örn: "17:00")
    } = body;

    if (!shopId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur (Dükkan ID, Tarih, Başlangıç ve Bitiş Saati)' }, { status: 400 });
    }

    // 4. Bu dükkan gerçekten bu kullanıcıya mı ait? (Güvenlik Kontrolü)
    const shop = await prisma.shop.findUnique({
      where: { id: Number(shopId) },
    });
    if (!shop || shop.ownerId !== (user as any).id) {
      return NextResponse.json({ error: 'Yetkisiz: Bu dükkan size ait değil veya bulunamadı' }, { status: 403 });
    }

    // 5. Veritabanına kaydet
    // Not: Tarih ve saatleri birleştirip ISO formatına çeviriyoruz (örn: "2025-11-17T09:00:00Z")
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);
    
    // Not: schema.prisma'mızda bu alanlar @db.Time ve @db.Date idi.
    // Bu yüzden tarih/saat birleştirmesi yerine ayrı ayrı kaydedelim (AŞAMA 8'e göre)
    
    const availability = await prisma.availability.create({
      data: {
        shopId: Number(shopId),
        date: new Date(date),     // Sadece tarih (örn: 2025-11-17)
        startTime: new Date(`${date}T${startTime}:00`), // Saat (ama tarih bilgisi de içerir)
        endTime: new Date(`${date}T${endTime}:00`),   // Saat (ama tarih bilgisi de içerir)
      },
    });

    return NextResponse.json(availability, { status: 201 });

  } catch (error) {
    console.log("AVAILABILITY_POST_ERROR", error);
    return NextResponse.json({ error: 'Müsaitlik oluşturulamadı' }, { status: 500 });
  }
}