export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const equipType = searchParams.get('equipType')

    let query = supabaseAdmin.from('EquipmentSet').select('*')
    if (equipType) query = query.eq('equipType', equipType)

    const { data: sets, error } = await query.order('sortOrder', { ascending: true })
    if (error) throw error

    const withCounts = await Promise.all(
      (sets || []).map(async (set) => {
        const { count } = await supabaseAdmin
          .from('Equipment')
          .select('*', { count: 'exact', head: true })
          .eq('setId', set.id)
        return { ...set, _count: { pieces: count || 0 } }
      })
    )
    return NextResponse.json(withCounts)
  } catch (error) {
    return NextResponse.json({ error: '獲取套裝列表失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { data: set, error } = await supabaseAdmin
      .from('EquipmentSet')
      .insert({
        name: data.name,
        slug: data.slug,
        equipType: data.equipType || 'hero',
        icon: data.icon,
        iconPosition: data.iconPosition || '50% 50%',
        setBonus: data.setBonus,
        description: data.description,
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished ?? true,
      })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(set, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '創建套裝失敗' }, { status: 500 })
  }
}
