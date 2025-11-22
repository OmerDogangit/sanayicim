import { NextRequest, NextResponse } from 'next/server'; // Import'u değiştirdik
import prisma from '@/lib/prisma';

// ---
// GET: ID'ye GÖRE TEK BİR DÜKKANI GETİR
// ---
// DİKKAT: 'request' tipini 'NextRequest' yaptık.
// 'params' tipini 'Promise' yaptık.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Önce params'ı await ile çözüyoruz (Next.js 15 kuralı)
    const { id } = await params;
    const shopId = Number(id); 

    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Geçersiz Dükkan ID' }, { status: 400 });
    }

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