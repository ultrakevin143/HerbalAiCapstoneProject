import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths requiring user authentication
  const protectedPaths = ['/chat', '/forums', '/suggest', '/admin', '/messenger'];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected) {
    const refreshToken = request.cookies.get('refreshToken')?.value;
    const accessToken = request.cookies.get('accessToken')?.value;

    // If neither token is present, redirect to signin
    if (!refreshToken && !accessToken) {
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/chat/:path*',
    '/forums/:path*',
    '/suggest/:path*',
    '/admin/:path*',
    '/messenger/:path*',
  ],
};
