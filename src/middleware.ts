// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LOCAL_STORAGE_AUTH_KEY } from '@/lib/constants'; // This won't work in middleware

// Middleware runs on the server, can't access localStorage.
// Auth state needs to be stored in cookies for middleware access.
// For this exercise, we'll simplify and assume client-side routing handles protection primarily.
// A proper middleware would check an HttpOnly cookie.

// This is a simplified middleware. For robust auth, use httpOnly cookies.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Try to get auth status from a cookie (simulated)
  // In a real app, login would set an HttpOnly cookie.
  const isAuthenticatedCookie = request.cookies.get('isAuthenticated'); 

  const isAuthenticated = isAuthenticatedCookie?.value === 'true';

  const isAuthPage = pathname === '/login';

  if (isAuthPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/inserir-venda/:path*', '/dados/:path*', '/login'],
};
