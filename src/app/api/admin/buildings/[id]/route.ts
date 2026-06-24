export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: building, error } = await supabaseAdmin
      .from('Building')
      .select('*, BuildingCategory(*)')
      .eq('id', params.id)
      .single()
    if (!building) return NextResponse.json({ error: '建築不存在' }, { status: 404 })
    if (error) throw error
    return NextResponse.json(building)
  } catch {
    return NextResponse.json({ error: '獲取建築失敗' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { data: building, error } = await supabaseAdmin
      .from('Building')
      .update({
        buildingType: data.buildingType,
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
        // 新增字段
        unlockCondition: data.unlockCondition,
        summary: data.summary,
        affiliation: data.affiliation,
        isFeatured: data.isFeatured,
        publishedAt: data.publishedAt || null,
        upgradeLevels: data.upgradeLevels,
        categoryId: data.categoryId || null,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(building)
  } catch (error: any) {
    return NextResponse.json({ error: '更新建築失敗：' + (error?.message || '未知錯誤') }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin.from('Building').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '刪除建築失敗' }, { status: 500 })
  }
}
