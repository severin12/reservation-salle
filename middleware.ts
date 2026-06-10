import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from './lib/auth';

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

const protectedPrefixes = ['/', '/rooms', '/reservations', '/admin'];

function isProtectedPath(pathname: string) {
  if (pathname === '/') return true;
  return protectedPrefixes.some((path) => path !== '/' && pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('reservation-token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyJwt(token);

    if (pathname.startsWith('/admin') && payload.role !== 'Admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('reservation-token', '', { path: '/', maxAge: 0 });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/rooms/:path*',
    '/reservations/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
};
