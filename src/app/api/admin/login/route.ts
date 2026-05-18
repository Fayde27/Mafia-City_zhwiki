export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: '用戶名和密碼不能為空' },
        { status: 400 }
      )
    }

    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: '用戶名或密碼錯誤' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: '用戶名或密碼錯誤' },
        { status: 401 }
      )
    }

    const token = await generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '登入失敗，請稍後重試' },
      { status: 500 }
    )
  }
}