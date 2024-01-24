import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

const isAdminRoute = (pathname: string) => pathname.startsWith('/api/admin');

const isUserRoute = (pathname: string) => pathname.startsWith('/api/users');

const isTeamRoute = (pathname: string) => pathname.startsWith('/api/team');

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.

  (req: NextRequest) => {
    const { role } = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if ((isUserRoute(pathname) || isTeamRoute(pathname)) && role !== 'user') {
      return NextResponse.redirect(new URL('/api/auth/unauthorized', req.url));
    }

    if (isAdminRoute(pathname) && role !== 'admin') {
      return NextResponse.redirect(new URL('/api/auth/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) =>
        token?.role === 'admin' || token?.role === 'user',
    },
  },
);

export const config = {
  matcher: ['/api/users/:path*', '/api/admin/:path*'],
};
