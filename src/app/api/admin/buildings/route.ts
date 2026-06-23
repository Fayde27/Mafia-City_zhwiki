export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const from = (page - 1) * limit
    const to = from + limit - 1

    const buildingType = searchParams.get('buildingType')

    let query = supabaseAdmin
      .from('Building')
      .select('*, BuildingCategory(*)', { count: 'exact' })

    if (category) {
      query = query.eq('BuildingCategory.slug', category)
    }

    if (buildingType) {
      query = query.eq('buildingType', buildingType)
    }

    const draft = searchParams.get('draft')
    if (draft === 'true') query = query.eq('isPublished', false)

    const { data: buildings, error, count: total } = await query
      .order('sortOrder', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      buildings,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '獲取建築列表失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { data: building, error } = await supabaseAdmin
      .from('Building')
      .insert({
        buildingType: data.buildingType || 'inner',
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        iconPosition: data.iconPosition,
        image: data.image,
        imagePosition: data.imagePosition,
        rarity: data.rarity || 3,
        type: data.type,
        function: data.function,
        level: data.level || 1,
        maxLevel: data.maxLevel || 10,
        cost: data.cost,
        production: data.production,
        description: data.description,
        details: data.details,
        upgradeInfo: data.upgradeInfo,
        // 新增字段
        unlockCondition: data.unlockCondition,
        summary: data.summary,
        isFeatured: data.isFeatured || false,
        publishedAt: data.publishedAt || null,
        upgradeLevels: data.upgradeLevels,
        categoryId: data.categoryId || null,
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished || false,
      })
      .select('*, BuildingCategory(*)')
      .single()

    if (error) throw error
    return NextResponse.json(building, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: '創建建築失敗：' + (error?.message || '未知錯誤') }, { status: 500 })
  }
}