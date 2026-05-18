export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: category, error } = await supabaseAdmin
      .from('ItemCategory').select('*').eq('id', params.id).single()
    if (error || !category) return NextResponse.json({ error: '道具分類不存在' }, { status: 404 })
    return NextResponse.json(category)
  } catch { return NextResponse.json({ error: '獲取道具分類失敗' }, { status: 500 }) }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { name, slug, description, icon, sortOrder } = await request.json()
    const { data: category, error } = await supabaseAdmin
      .from('ItemCategory').update({ name, slug, description, icon, sortOrder })
      .eq('id', params.id).select().single()
    if (error) throw error
    return NextResponse.json(category)
  } catch { return NextResponse.json({ error: '更新道具分類失敗' }, { status: 500 }) }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin.from('ItemCategory').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: '刪除道具分類失敗' }, { status: 500 }) }
}
