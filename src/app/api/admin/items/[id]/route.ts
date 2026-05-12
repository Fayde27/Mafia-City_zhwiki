export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: item, error } = await supabaseAdmin.from('Item').select('*')
      .eq('id', params.id)
      .single()
    if (!item) {
      return NextResponse.json({ error: '道具不存在' }, { status: 404 })
    }
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: '获取道具失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { data: item, error } = await supabaseAdmin.from('Item').update({
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        image: data.image,
        rarity: data.rarity,
        type: data.type,
        quality: data.quality,
        stackable: data.stackable,
        effect: data.effect,
        description: data.description,
        usage: data.usage,
        recipe: data.recipe,
        source: data.source,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      })
      .eq('id', params.id )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: '更新道具失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin.from('Item').delete()
      .eq('id', params.id )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除道具失败' }, { status: 500 })
  }
}
