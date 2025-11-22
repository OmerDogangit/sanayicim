import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

// Gizli anahtar (middleware ve login ile aynı olmalı)
const JWT_SECRET = process.env.JWT_SECRET || "varsayilan-cok-gizli-anahtar-bunu-degistir";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email ve şifre gerekli" }, { status: 400 });
    }

    // 1. Kullanıcıyı email ile bul
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return NextResponse.json({ error: "Geçersiz email veya şifre" }, { status: 401 });
    }

    // 2. Veritabanındaki HASH'lenmiş şifre ile kullanıcının girdiği şifreyi karşılaştır
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json({ error: "Geçersiz email veya şifre" }, { status: 401 });
    }

    // 3. Şifre doğruysa, bir "Token" oluştur
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: "7d", // Token 7 gün geçerli olsun
    });

    // === DÜZELTME BURADA BAŞLIYOR ===

    // 4. Önce cevabı (response) oluştur
    const response = NextResponse.json(tokenPayload);

    // 5. Cookie'yi o cevaba ekle
    response.cookies.set("sanayicim_token", token, {
      httpOnly: true, // Sadece sunucu erişebilsin
      secure: process.env.NODE_ENV === "production", // Sadece HTTPS'te çalış
      path: "/", // Sitenin tamamında geçerli
      maxAge: 60 * 60 * 24 * 7, // 7 gün
    });

    // 6. Cookie'yi içeren cevabı döndür
    return response;

    // === DÜZELTME BURADA BİTTİ ===

  } catch (error) {
    console.log("LOGIN_ERROR", error);
    return NextResponse.json({ error: "Giriş işlemi başarısız oldu" }, { status: 500 });
  }
}