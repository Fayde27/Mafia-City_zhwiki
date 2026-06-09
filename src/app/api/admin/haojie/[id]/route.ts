export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: haojie, error } = await supabaseAdmin
      .from('Character')
      .select('*, CharacterCategory(*)')
      .eq('id', params.id)
      .single()

    if (error || !haojie) {
      return NextResponse.json({ error: '豪杰不存在' }, { status: 404 })
    }

    return NextResponse.json(haojie)
  } catch (error) {
    return NextResponse.json({ error: '獲取豪杰失敗' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { data: haojie, error } = await supabaseAdmin
      .from('Character')
      .update({
        name: data.name,
        slug: data.slug,
        avatar: data.avatar,
        avatarPosition: data.avatarPosition,
        banner: data.banner,
        bannerPosition: data.bannerPosition,
        rarity: data.rarity,
        traits: data.traits,
        troopType: data.troopType,
        acquisition: data.acquisition,
        story: data.story,
        attributes: data.attributes,
        skills: data.skills,
        fanNumber: data.fanNumber,
        awakenHero: data.awakenHero,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      })
      .eq('id', params.id)
      .select('*, CharacterCategory(*)')
      .single()

    if (error) throw error

    return NextResponse.json(haojie)
  } catch (error) {
    return NextResponse.json({ error: '更新豪杰失敗' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('Character')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '刪除豪杰失敗' }, { status: 500 })
  }
}
