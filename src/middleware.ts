import { NextRequest, NextResponse } from 'next/server'
import { includes } from 'lodash'

import { withAuth } from 'next-auth/middleware'

const isAdminRoute = (pathname: string) => {
  return pathname.startsWith('/api/admin')
}

const isUserRoute = (pathname: string) => {
  return pathname.startsWith('/api/users')
}
export default withAuth(
  // `withAuth` augments your `Request` with the user's token.

  function middleware(req: NextRequest) {
    console.log('middleware', req.user)
    const { role } = req.nextauth.token
    const { pathname } = req.nextUrl

    if (isUserRoute(pathname) && !includes(['user', 'admin'], role)) {
      return NextResponse.redirect(new URL('/api/auth/unauthorized', req.url))
    }

    if (isAdminRoute(pathname) && role !== 'admin') {
      return NextResponse.redirect(new URL('/api/auth/unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) =>
        token?.role === 'admin' || token?.role === 'user',
    },
  },
)

export const config = {
  matcher: ['/api/users/:path*', '/api/admin/:path*'],
}
