
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES_PREFIXES = ['/dashboard', '/inserir-venda', '/dados', '/editar-venda', '/faturamento', '/configuracoes'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticatedCookie = request.cookies.get('isAuthenticated');
  const isAuthenticated = isAuthenticatedCookie?.value === 'true';

  // Log current path and authentication status from cookie
  // console.log(`Middleware: Path: ${pathname}, IsAuthenticatedCookie: ${isAuthenticated}`);

  // User is trying to access a protected route
  if (PROTECTED_ROUTES_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    if (!isAuthenticated) {
      // console.log(`Middleware: Not authenticated for protected route ${pathname}, redirecting to /login.`);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // User is trying to access the login page
  if (pathname === '/login') {
    if (isAuthenticated) {
      // console.log(`Middleware: Authenticated user trying to access /login, redirecting to /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // If not authenticated, allow access to /login
    return NextResponse.next();
  }

  // User is trying to access the root page '/'
  if (pathname === '/') {
    if (isAuthenticated) {
      // console.log(`Middleware: Authenticated user accessing root '/', redirecting to /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      // console.log(`Middleware: Not authenticated for root path '/', redirecting to /login.`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // For any other routes not explicitly handled by the above conditions, allow the request.
  // This assumes that any route not covered is either public or will be handled by page-level logic if necessary.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all protected routes
    '/dashboard/:path*',
    '/inserir-venda/:path*',
    '/dados/:path*',
    '/editar-venda/:path*',
    '/faturamento/:path*',
    '/configuracoes/:path*',
    // Also match /login to handle redirection for authenticated users
    '/login',
    // Match the root path '/' for direct routing by middleware
    '/',
  ],
};
