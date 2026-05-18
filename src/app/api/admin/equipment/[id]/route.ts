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
        icon: data.icon,
        iconPosition: data.iconPosition,
        image: data.image,
        imagePosition: data.imagePosition,
        rarity: data.rarity,
        type: data.type,
        slot: data.slot,
        attack: data.attack,
        defense: data.defense,
        hp: data.hp,
        speed: data.speed,
        skill: data.skill,
        description: data.description,
        stats: data.stats,
        enhancement: data.enhancement,
        acquisition: data.acquisition,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      })
      .eq('id', params.id )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(equip)
  } catch (error) {
    return NextResponse.json({ error: '更新裝備失敗' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin.from('Equipment').delete()
      .eq('id', params.id )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '刪除裝備失敗' }, { status: 500 })
  }
}
