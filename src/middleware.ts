
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_AUTH_FLAG } from '@/lib/constants'; // Importar a chave do cookie

const PROTECTED_ROUTES_PREFIXES = ['/dashboard', '/inserir-venda', '/dados', '/editar-venda', '/faturamento', '/propostas', '/configuracoes'];
const PUBLIC_ROUTES = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authFlagCookie = request.cookies.get(COOKIE_AUTH_FLAG)?.value;
  const isAuthenticated = authFlagCookie === 'true';

  // Se está autenticado
  if (isAuthenticated) {
    // Se tentar acessar /login ou a raiz /, redireciona para /dashboard
    if (PUBLIC_ROUTES.includes(pathname) || pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Permite acesso às outras rotas (incluindo as protegidas)
    return NextResponse.next();
  }

  // Se NÃO está autenticado
  if (!isAuthenticated) {
    // Se tentar acessar uma rota protegida, redireciona para /login
    if (PROTECTED_ROUTES_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Se tentar acessar a raiz /, redireciona para /login
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url));
    }
    // Permite acesso a /login ou outras rotas públicas não listadas explicitamente
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todas as rotas que precisam de lógica de autenticação
    '/',
    '/login',
    '/dashboard/:path*',
    '/inserir-venda/:path*',
    '/dados/:path*',
    '/editar-venda/:path*',
    '/faturamento/:path*',
    '/propostas/:path*',
    '/configuracoes/:path*',
    // Evitar que o middleware rode em rotas de API, assets (_next), etc.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
