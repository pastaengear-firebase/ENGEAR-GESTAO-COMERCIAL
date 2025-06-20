
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// COOKIE_AUTH_FLAG não é mais necessário
// import { COOKIE_AUTH_FLAG } from '@/lib/constants'; 

const PROTECTED_ROUTES_PREFIXES = ['/dashboard', '/inserir-venda', '/dados', '/editar-venda', '/faturamento', '/propostas', '/configuracoes'];
// const PUBLIC_ROUTES = ['/login']; // /login não existe mais

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Se o usuário tentar acessar a raiz, redireciona para /dashboard
  if (pathname === '/' || pathname === '/login') { // Adicionado /login para caso ainda haja links
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Todas as outras rotas (incluindo as que antes eram protegidas) são permitidas
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Rotas que o middleware deve interceptar
    '/',
    '/login', // Mantido para redirecionar caso haja algum acesso direto
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
