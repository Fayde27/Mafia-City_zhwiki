export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { data: announcements, error } = await supabaseAdmin
      .from('Announcement')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) throw error
    return NextResponse.json(announcements)
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data: announcement, error } = await supabaseAdmin
      .from('Announcement')
      .insert({
        title: body.title,
        content: body.content,
        banner: body.banner || null,
        type: body.type || 'info',
        isActive: body.isActive !== false,
        sortOrder: body.sortOrder || 0,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(announcement)
  } catch (error) {
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}