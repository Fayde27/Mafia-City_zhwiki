export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: character, error } = await supabaseAdmin
      .from('Character')
      .select('*, CharacterCategory(*)')
      .eq('id', params.id)
      .single()

    if (error || !character) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 })
    }
    return NextResponse.json(character)
  } catch (error) {
    return NextResponse.json({ error: '获取角色失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { data: character, error } = await supabaseAdmin
      .from('Character')
      .update({
        name: data.name,
        slug: data.slug,
        title: data.title,
        avatar: data.avatar,
        avatarPosition: data.avatarPosition,
        banner: data.banner,
        bannerPosition: data.bannerPosition,
        rarity: data.rarity,
        role: data.role,
        weapon: data.weapon,
        coreBonus: data.coreBonus,
        acquisition: data.acquisition,
        description: data.description,
        attributes: data.attributes,
        skills: data.skills,
        rumors: data.rumors,
        teamComp: data.teamComp,
        troopRec: data.troopRec,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      })
      .eq('id', params.id)
      .select('*, CharacterCategory(*)')
      .single()

    if (error) throw error
    return NextResponse.json(character)
  } catch (error) {
    return NextResponse.json({ error: '更新角色失败' }, { status: 500 })
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
    return NextResponse.json({ error: '删除角色失败' }, { status: 500 })
  }
}