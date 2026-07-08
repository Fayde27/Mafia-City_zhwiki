import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname === '/admin/login' ||
    request.nextUrl.pathname === '/api/admin/login'
  ) {
    return NextResponse.next()
  }

  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  const token = request.cookies.get('admin-token')?.value

  if (!token) {
    if (isApiRoute) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'admin') {
    if (isApiRoute) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
