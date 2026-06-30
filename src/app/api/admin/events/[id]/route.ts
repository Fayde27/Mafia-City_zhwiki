export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: event, error } = await supabaseAdmin
      .from('Event')
      .select('*, EventCategory(*)')
      .eq('id', params.id)
      .single()
    if (error || !event) return NextResponse.json({ error: '活動不存在' }, { status: 404 })
    return NextResponse.json(event)
  } catch {
    return NextResponse.json({ error: '獲取活動失敗' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { data: event, error } = await supabaseAdmin
      .from('Event')
      .update({
        name: data.name,
        slug: data.slug,
        summary: data.summary || null,
        icon: data.icon || null,
        iconPosition: data.iconPosition || '50% 50%',
        image: data.image || null,
        imagePosition: data.imagePosition || '50% 50%',
        condition: data.condition || null,
        gameplay: data.gameplay || null,
        rewards: data.rewards || null,
        relatedGuides: data.relatedGuides || null,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isFeatured: data.isFeatured,
        isPublished: data.isPublished,
      })
      .eq('id', params.id)
      .select('*, EventCategory(*)')
      .single()

    if (error) throw error
    return NextResponse.json(event)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '更新活動失敗' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin.from('Event').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '刪除活動失敗' }, { status: 500 })
  }
}
