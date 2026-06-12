import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // If visiting a portal route and no session cookie is found, redirect to home with auth open
  if (!token && request.nextUrl.pathname.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/?auth=true', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*']
};
