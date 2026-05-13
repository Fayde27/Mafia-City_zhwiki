export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: building, error } = await supabaseAdmin.from('Building').select('*')
      .eq('id', params.id)
      .single()
    if (!building) {
      return NextResponse.json({ error: '建筑不存在' }, { status: 404 })
    }
    return NextResponse.json(building)
  } catch (error) {
    return NextResponse.json({ error: '获取建筑失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { data: building, error } = await supabaseAdmin.from('Building').update({
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        iconPosition: data.iconPosition,
        image: data.image,
        imagePosition: data.imagePosition,
        rarity: data.rarity,
        type: data.type,
        function: data.function,
        level: data.level,
        maxLevel: data.maxLevel,
        cost: data.cost,
        production: data.production,
        description: data.description,
        details: data.details,
        upgradeInfo: data.upgradeInfo,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      })
      .eq('id', params.id )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(building)
  } catch (error) {
    return NextResponse.json({ error: '更新建筑失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin.from('Building').delete()
      .eq('id', params.id )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除建筑失败' }, { status: 500 })
  }
}
