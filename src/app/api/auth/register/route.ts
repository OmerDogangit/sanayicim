import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma"; // Az önce oluşturduğumuz prisma.ts dosyasını çağırıyoruz

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
    }

    // Email daha önce alınmış mı?
    const exist = await prisma.user.findUnique({
      where: { email: email },
    });

    if (exist) {
      return NextResponse.json({ error: "Email zaten kullanılıyor" }, { status: 400 });
    }

    // Şifreyi hash'le (güvenli hale getir)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı veritabanında oluştur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
      },
    });

    // Başarılı olursa kullanıcıyı (şifresiz) geri döndür
    return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });

  } catch (error) {
    console.log("REGISTER_ERROR", error);
    return NextResponse.json({ error: "Kayıt işlemi başarısız oldu" }, { status: 500 });
  }
}