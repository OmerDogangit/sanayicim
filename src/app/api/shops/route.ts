import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as jose from 'jose'; 

// === YARDIMCI FONKSİYONLAR (Bunlar doğru) ===
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
// GET: TÜM DÜKKANLARI LİSTELE
// ---
export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { createdAt: 'desc' }, 
      include: {
        // === DÜZELTME BURADA ===
        services: true,     // Hizmetleri getir
        availability: true, // Müsaitlikleri de getir (Bunu ekledik)
        // === DÜZELTME BİTTİ ===
        owner: {
          select: { name: true, email: true } 
        }
      }
    });
    return NextResponse.json(shops);
  } catch (error) {
    console.log("SHOPS_GET_ERROR", error);
    return NextResponse.json({ error: 'Dükkanlar listelenemedi' }, { status: 500 });
  }
}

// ---
// POST: YENİ BİR DÜKKAN OLUŞTUR (Bu kısım doğru)
// ---
export async function POST(request: Request) { 
  try {
    // 1. Giriş yapan kullanıcı kim? (Cookie'den oku)
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz: Geçerli bir token bulunamadı' }, { status: 401 });
    }

    // 2. Kullanıcının rolü "owner" mı?
    if ((user as any).role !== 'owner') {
      return NextResponse.json({ error: 'Yetkisiz: Sadece dükkan sahipleri dükkan ekleyebilir' }, { status: 403 });
    }

    // 3. Formdan gelen bilgileri al
    const body = await request.json();
    const { name, description, location } = body;

    if (!name) {
      return NextResponse.json({ error: 'Dükkan adı zorunludur' }, { status: 400 });
    }

    // 4. Dükkanı oluştur
    const newShop = await prisma.shop.create({
      data: {
        name,
        description: description || null,
        location: location || null,
        ownerId: (user as any).id, 
      },
    });

    return NextResponse.json(newShop, { status: 201 });

  } catch (error) {
    console.log("SHOP_POST_ERROR", error);
    return NextResponse.json({ error: 'Dükkan oluşturulamadı' }, { status: 500 });
  }
}