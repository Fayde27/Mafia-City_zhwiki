import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // 判断是管理端还是玩家端
  const isAdminDomain = hostname.startsWith('admin.') || hostname.includes('localhost:3000/admin')
  const isPlayerDomain = hostname.startsWith('wiki.') || hostname.includes('localhost:3000/wiki') || !hostname.includes('.')
  
  // 管理端路由处理
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 检查认证（除了登录页）
    if (!request.nextUrl.pathname.startsWith('/admin/login')) {
      const token = request.cookies.get('admin-token')?.value
      if (!token) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
