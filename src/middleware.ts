// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware configurado para permitir todas as requisições para fins de teste.
export function middleware(request: NextRequest) {
  // console.log(`Middleware (TEST MODE): Allowing request to ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

export const config = {
  // O matcher garante que o middleware execute para estas rotas,
  // mas a lógica interna agora é um passthrough.
  // Adicionado '/' e '/login' para garantir que essas páginas também sejam processadas
  // pelo middleware (que agora está em modo passthrough) e que o roteamento
  // do Next.js e os redirecionamentos nas próprias páginas funcionem corretamente.
  matcher: ['/dashboard/:path*', '/inserir-venda/:path*', '/dados/:path*', '/editar-venda/:path*', '/login', '/'],
};
