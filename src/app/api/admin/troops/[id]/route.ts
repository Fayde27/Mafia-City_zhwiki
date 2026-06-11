export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: troop, error } = await supabaseAdmin.from('Troop').select('*')
      .eq('id', params.id)
      .single()
    if (!troop) {
      return NextResponse.json({ error: '兵種不存在' }, { status: 404 })
    }
    return NextResponse.json(troop)
  } catch (error) {
    return NextResponse.json({ error: '獲取兵種失敗' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { data: troop, error } = await supabaseAdmin.from('Troop').update({
        name: data.name,
        slug: data.slug,
        summary: data.summary,
        icon: data.icon,
        iconPosition: data.iconPosition,
        image: data.image,
        imagePosition: data.imagePosition,
        troopType: data.troopType,
        rarity: data.rarity,
        combatPower: data.combatPower,
        attack: data.attack,
        defense: data.defense,
        hp: data.hp,
        speed: data.speed,
        load: data.load,
        attackRange: data.attackRange,
        cashCost: data.cashCost,
        talent: data.talent,
        counter: data.counter,
        weakness: data.weakness,
        description: data.description,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isFeatured: data.isFeatured,
        isPublished: data.isPublished,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(troop)
  } catch (error) {
    return NextResponse.json({ error: '更新兵種失敗' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin.from('Troop').delete()
      .eq('id', params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '刪除兵種失敗' }, { status: 500 })
  }
}
