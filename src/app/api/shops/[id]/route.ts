import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ---
// GET: ID'ye GÖRE TEK BİR DÜKKANI GETİR
// ---
// DİKKAT: TypeScript hatasını aşmak için 'any' kullanıyoruz.
// Bu yöntem, versiyon uyuşmazlıklarını kesin olarak çözer.
export async function GET(request: Request, props: any) {
  try {
    // Props içinden params'ı alıp bekliyoruz (Next.js 15 uyumlu)
    const params = await props.params;
    const shopId = Number(params.id); 

    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Geçersiz Dükkan ID' }, { status: 400 });
    }

    // Veritabanından dükkanı çek
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        services: true,
        availability: true,
        owner: { select: { name: true, email: true } },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Dükkan bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(shop);

  } catch (error) {
    console.log('SHOP_ID_GET_ERROR', error); 
    return NextResponse.json({ error: 'Dükkan bilgisi alınamadı' }, { status: 500 });
  }
}