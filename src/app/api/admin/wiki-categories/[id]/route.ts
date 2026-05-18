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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'characters'
    const tableName = tableMap[type]

    if (!tableName) {
      return NextResponse.json({ error: '無效的類型' }, { status: 400 })
    }

    const { name, slug, description, icon, sortOrder } = await request.json()
    const { data: category, error } = await supabaseAdmin
      .from(tableName)
      .update({ name, slug, description, icon, sortOrder })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(category)
  } catch (error) {
    console.error('更新分類失敗:', error)
    return NextResponse.json({ error: '更新分類失敗' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'characters'
    const tableName = tableMap[type]

    if (!tableName) {
      return NextResponse.json({ error: '無效的類型' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from(tableName)
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('刪除分類失敗:', error)
    return NextResponse.json({ error: '刪除分類失敗' }, { status: 500 })
  }
}