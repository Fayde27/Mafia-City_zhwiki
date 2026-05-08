import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) {
      return NextResponse.json({ isAdmin: false })
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key'
    const decoded = jwt.verify(token, secret) as any

    return NextResponse.json({ isAdmin: decoded.role === 'admin' })
  } catch (error) {
    return NextResponse.json({ isAdmin: false })
  }
}
