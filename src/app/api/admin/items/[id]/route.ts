export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: item, error } = await supabaseAdmin
      .from('Item')
      .select('*, ItemCategory(*)')
      .eq('id', params.id)
      .single()
    if (error || !item) return NextResponse.json({ error: '道具不存在' }, { status: 404 })
    return NextResponse.json(item)
  } catch {
    return NextResponse.json({ error: '獲取道具失敗' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { data: item, error } = await supabaseAdmin
      .from('Item')
      .update({
        name: data.name,
        slug: data.slug,
        summary: data.summary || null,
        icon: data.icon || null,
        iconPosition: data.iconPosition || '50% 50%',
        image: data.image || null,
        imagePosition: data.imagePosition || '50% 50%',
        source: data.source || null,
        isExchange: data.isExchange || false,
        exchangeContent: data.exchangeContent || null,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isFeatured: data.isFeatured,
        isPublished: data.isPublished,
        // 保留舊字段
        rarity: data.rarity,
        type: data.type || null,
        quality: data.quality || null,
        stackable: data.stackable,
        effect: data.effect || null,
        description: data.description || null,
        usage: data.usage || null,
        recipe: data.recipe || null,
      })
      .eq('id', params.id)
      .select('*, ItemCategory(*)')
      .single()

    if (error) throw error
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '更新道具失敗' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin.from('Item').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '刪除道具失敗' }, { status: 500 })
  }
}
