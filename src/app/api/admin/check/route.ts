export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token) {
      return NextResponse.json({ isAdmin: false })
    }

    const decoded = await verifyToken(token)

    return NextResponse.json({ isAdmin: decoded?.role === 'admin' })
  } catch (error) {
    return NextResponse.json({ isAdmin: false })
  }
}