
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES_PREFIXES = ['/dashboard', '/inserir-venda', '/dados', '/editar-venda', '/faturamento', '/configuracoes'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Se tentar acessar a página de login ou a raiz, redireciona para o dashboard
  if (pathname === '/login' || pathname === '/') {
    // console.log(`Middleware (Login Disabled): Path ${pathname} detected, redirecting to /dashboard.`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Para rotas que eram protegidas, permite o acesso direto
  if (PROTECTED_ROUTES_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    // console.log(`Middleware (Login Disabled): Accessing formerly protected route ${pathname}. Allowing.`);
    return NextResponse.next();
  }

  // console.log(`Middleware (Login Disabled): Path ${pathname} not explicitly handled, allowing.`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all formerly protected routes
    '/dashboard/:path*',
    '/inserir-venda/:path*',
    '/dados/:path*',
    '/editar-venda/:path*',
    '/faturamento/:path*',
    '/configuracoes/:path*',
    // Also match /login and / to redirect them
    '/login',
    '/',
  ],
};
