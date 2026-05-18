export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('Submission')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: '获取投稿失败' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, content, gameId, category, status, adminNote } = body

    const { data, error } = await supabaseAdmin
      .from('Submission')
      .update({
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(gameId !== undefined && { gameId }),
        ...(category !== undefined && { category }),
        ...(status !== undefined && { status }),
        ...(adminNote !== undefined && { adminNote }),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: '更新投稿失败' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin
      .from('Submission')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '删除投稿失败' }, { status: 500 })
  }
}
