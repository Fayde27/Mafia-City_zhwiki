export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: equipment, error } = await supabaseAdmin.from('Equipment').select('*')
      .eq('id', params.id)
      .single()
    if (!equipment) {
      return NextResponse.json({ error: '裝備不存在' }, { status: 404 })
    }
    return NextResponse.json(equipment)
  } catch (error) {
    return NextResponse.json({ error: '獲取裝備失敗' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { data: equip, error } = await supabaseAdmin.from('Equipment').update({
        name: data.name,
        slug: data.slug,
        summary: data.summary,
        equipType: data.equipType,
        icon: data.icon,
        iconPosition: data.iconPosition,
        image: data.image,
        imagePosition: data.imagePosition,
        rarity: data.rarity,
        type: data.type,
        slot: data.slot,
        attrBias: data.attrBias,
        buffs: data.buffs,
        setId: data.setId || null,
        stats: data.stats,
        acquisition: data.acquisition,
        categoryId: data.categoryId || null,
        sortOrder: data.sortOrder,
        isFeatured: data.isFeatured,
        isPublished: data.isPublished,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(equip)
  } catch (error: any) {
    return NextResponse.json({ error: '更新裝備失敗：' + (error?.message || '未知錯誤') }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin.from('Equipment').delete()
      .eq('id', params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '刪除裝備失敗' }, { status: 500 })
  }
}
