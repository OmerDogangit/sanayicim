import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ---
// GET: ID'ye GÖRE TEK BİR DÜKKANI GETİR
// ---
// DÜZELTME: { params }: { params: Promise<{ id: string }> }
// "Promise" kelimesine dikkat!
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Params'ı await ile çözüyoruz
    const resolvedParams = await params;
    const shopId = Number(resolvedParams.id); 

    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Geçersiz Dükkan ID' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: {
        id: shopId,
      },
      include: {
        services: true,
        availability: true,
        owner: {
          select: { name: true, email: true },
        },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Dükkan bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(shop);

  } catch (error) {
    console.log(`SHOP_ID_GET_ERROR`, error); 
    return NextResponse.json({ error: 'Dükkan bilgisi alınamadı' }, { status: 500 });
  }
}