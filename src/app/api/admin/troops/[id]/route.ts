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
      return NextResponse.json({ error: '兵种不存在' }, { status: 404 })
    }
    return NextResponse.json(troop)
  } catch (error) {
    return NextResponse.json({ error: '获取兵种失败' }, { status: 500 })
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
        icon: data.icon,
        iconPosition: data.iconPosition,
        image: data.image,
        imagePosition: data.imagePosition,
        rarity: data.rarity,
        type: data.type,
        attack: data.attack,
        defense: data.defense,
        hp: data.hp,
        speed: data.speed,
        counter: data.counter,
        weakness: data.weakness,
        description: data.description,
        stats: data.stats,
        skills: data.skills,
        training: data.training,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      })
      .eq('id', params.id )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(troop)
  } catch (error) {
    return NextResponse.json({ error: '更新兵种失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin.from('Troop').delete()
      .eq('id', params.id )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除兵种失败' }, { status: 500 })
  }
}
