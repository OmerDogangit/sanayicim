import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // === DÜZELTME BURADA ===
    // Hata, 'params'ın bir Promise olduğunu söyledi.
    // Önce 'await' ile 'params' objesinin çözülmesini bekliyoruz.
    
    // Not: Bu satır, { params: Promise<{ id: '1' }> } olan bir objeyi bekler.
    // Eğer 'params'ın kendisi promise ise, bu çalışmayacaktır.
    // Ancak hata mesajı "params is a Promise" diyor, bu yüzden params'ı beklemeliyiz.
    
    // GÜNCELLEME: 'params' objesi `{ id: Promise<string> }` değil,
    // 'params' değişkeninin KENDİSİ Promise.
    
    const resolvedParams = await params;
    const shopId = Number(resolvedParams.id); 
    // === DÜZELTME BİTTİ ===


    if (isNaN(shopId)) {
      console.log("Çevirme başarısız, params.id:", resolvedParams.id);
      return NextResponse.json({ error: 'Geçersiz Dükkan ID' }, { status: 400 });
    }

    // O ID'ye sahip dükkanı veritabanında bul
    const shop = await prisma.shop.findUnique({
      where: {
        id: shopId,
      },
      include: {
        // Dükkanın tüm ilişkili verilerini de getir:
        services: true,     // Hizmetleri
        availability: true, // Müsaitlik durumları (henüz eklemedik)
        owner: {
          // Sahibinin sadece güvenli bilgilerini
          select: { name: true, email: true },
        },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Dükkan bulunamadı' }, { status: 404 });
    }

    // Dükkan bulunduysa, tüm bilgilerini JSON olarak döndür
    return NextResponse.json(shop);

  } catch (error) {
    // Hata ayıklama için ID'yi kaldırdık, çünkü params'a güvenemiyoruz
    console.log(`SHOP_ID_GET_ERROR`, error); 
    return NextResponse.json({ error: 'Dükkan bilgisi alınamadı' }, { status: 500 });
  }
}