export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const equipType = searchParams.get('equipType')
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('Equipment')
      .select('*, EquipmentCategory(*)', { count: 'exact' })

    if (category) {
      query = query.eq('EquipmentCategory.slug', category)
    }
    if (equipType) {
      query = query.eq('equipType', equipType)
    }

    const draft = searchParams.get('draft')
    if (draft === 'true') query = query.eq('isPublished', false)

    const { data: equipment, error, count: total } = await query
      .order('sortOrder', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      equipment,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '獲取裝備列表失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { data: equip, error } = await supabaseAdmin
      .from('Equipment')
      .insert({
        name: data.name,
        slug: data.slug,
        summary: data.summary,
        equipType: data.equipType || 'leader',
        icon: data.icon,
        iconPosition: data.iconPosition || '50% 50%',
        image: data.image,
        imagePosition: data.imagePosition || '50% 50%',
        rarity: data.rarity || 3,
        type: data.type,
        slot: data.slot,
        attrBias: data.attrBias,
        buffs: data.buffs,
        setId: data.setId || null,
        stats: data.stats,
        acquisition: data.acquisition,
        categoryId: data.categoryId || null,
        sortOrder: data.sortOrder || 0,
        isFeatured: data.isFeatured || false,
        isPublished: data.isPublished || false,
      })
      .select('*, EquipmentCategory(*)')
      .single()

    if (error) throw error
    return NextResponse.json(equip, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: '創建裝備失敗：' + (error?.message || '未知錯誤') }, { status: 500 })
  }
}
