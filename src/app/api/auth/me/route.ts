import { NextResponse } from 'next/server';
// "cookies" import'unu sildik, çünkü o hata veriyordu.
import * as jose from 'jose'; 

// Gizli anahtar (middleware ve login ile aynı olmalı)
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

// Bu API'ye GET isteği geldiğinde...
export async function GET(request: Request) { // 'request' objesini kullanacağız
  try {
    
    // === DÜZELTME BURADA BAŞLIYOR ===

    // 1. "cookies()" yerine, 'request'in header'ından cookie'leri al
    const cookieStore = request.headers.get('cookie');
    
    if (!cookieStore) {
      return NextResponse.json({ error: 'Yetkisiz (cookie store bulunamadı)' }, { status: 401 });
    }

    // 2. Gelen "cookie1=değer1; cookie2=değer2" metninden kendi token'ımızı bul
    const token = cookieStore.split('; ')
                             .find(row => row.startsWith('sanayicim_token='))
                             ?.split('=')[1];

    if (!token) {
      // Token yoksa, kullanıcı giriş yapmamış demektir
      return NextResponse.json({ error: 'Yetkisiz (token bulunamadı)' }, { status: 401 });
    }
    
    // === DÜZELTME BURADA BİTTİ ===


    // 3. Token'ı doğrula
    const userPayload = await verifyToken(token);

    if (!userPayload) {
      // Token geçersizse
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    // 4. Token geçerliyse, kullanıcı bilgilerini döndür
    return NextResponse.json(userPayload);

  } catch (error) {
    console.log("ME_API_ERROR", error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}