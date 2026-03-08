import { NextResponse } from 'next/server';

// Redirect legacy favicon.ico requests to the SVG icon.
export function GET(request: Request) {
  return NextResponse.redirect(new URL('/favicon.svg', request.url), 307);
}
