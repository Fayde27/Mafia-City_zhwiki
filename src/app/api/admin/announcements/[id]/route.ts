export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: announcement, error } = await supabaseAdmin
      .from('Announcement')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !announcement) {
      return NextResponse.json({ error: '公告不存在' }, { status: 404 })
    }
    return NextResponse.json(announcement)
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { data: announcement, error } = await supabaseAdmin
      .from('Announcement')
      .update({
        title: body.title,
        content: body.content,
        banner: body.banner || null,
        type: body.type,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(announcement)
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin
      .from('Announcement')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}