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
    // Matcher esvaziado para desativar completamente o middleware.
    // Esta é uma medida drástica para evitar que qualquer função de servidor
    // seja detectada pelo processo de publicação do Firebase, que estava
    // exigindo um plano pago incorretamente.
  ],
};
