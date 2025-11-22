import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || "varsayilan-cok-gizli-anahtar-bunu-degistir";

async function verifyToken(token: string) {
  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.log("Token doğrulama hatası:", error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('sanayicim_token')?.value;
  const { pathname } = request.nextUrl; 

  let userPayload = null;
  if (token) {
    userPayload = await verifyToken(token);
  }

  // === KORUMA KURALLARI ===
  if (pathname.startsWith('/dashboard')) {
    if (!userPayload) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith('/dashboard/owner')) {
      if ((userPayload as any).role !== 'owner') {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  // === KİMLİK BİLGİSİNİ SAYFAYA GÖNDERME ===
  const headers = new Headers(request.headers);
  if (userPayload) {
    
    // === DÜZELTME BURADA ===
    // Türkçe karakterleri (UTF-8) güvenli Base64 formatına çevir
    const encodedPayload = Buffer.from(JSON.stringify(userPayload)).toString('base64');
    headers.set('x-user-payload', encodedPayload);
    // === DÜZELTME BİTTİ ===

  }

  return NextResponse.next({
    request: {
      headers: headers,
    },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}