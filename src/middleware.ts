// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// O AccessGuard no lado do cliente cuidará da proteção das rotas internas.
// O middleware principalmente redireciona para a página de acesso inicial.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Se o usuário tentar acessar a raiz ou a antiga /login, redireciona para /access
  if (pathname === '/' || pathname === '/login') {
    return NextResponse.redirect(new URL('/access', request.url));
  }

  // Permite todas as outras solicitações.
  // O AccessGuard dentro de (app)/layout.tsx protegerá as rotas da aplicação.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login', // Mantido para redirecionar acessos diretos legados
    // O matcher original: '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // alterado para excluir /access explicitamente da lógica do middleware que poderia
    // redirecionar se '/' fosse interpretado erroneamente.
    // As rotas internas como /dashboard são permitidas aqui,
    // e o AccessGuard cuidará delas.
    '/((?!api|_next/static|_next/image|favicon.ico|access|_next/data).*)',
  ],
};
