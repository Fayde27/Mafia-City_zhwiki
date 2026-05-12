export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const tableMap: Record<string, string> = {
  characters: 'CharacterCategory',
  buildings: 'BuildingCategory',
  equipment: 'EquipmentCategory',
  items: 'ItemCategory',
  troops: 'TroopCategory',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'characters'
    const tableName = tableMap[type]

    if (!tableName) {
      return NextResponse.json({ error: '无效的类型' }, { status: 400 })
    }

    const { data: categories, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .order('sortOrder', { ascending: true })

    if (error) throw error
    return NextResponse.json(categories)
  } catch (error) {
    console.error('获取分类失败:', error)
    return NextResponse.json({ error: '获取分类失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'characters'
    const tableName = tableMap[type]

    if (!tableName) {
      return NextResponse.json({ error: '无效的类型' }, { status: 400 })
    }

    const { name, slug, description, icon, sortOrder } = await request.json()
    const { data: category, error } = await supabaseAdmin
      .from(tableName)
      .insert({ name, slug, description, icon, sortOrder: sortOrder || 0 })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('创建分类失败:', error)
    return NextResponse.json({ error: '创建分类失败' }, { status: 500 })
  }
}