export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: options, error } = await supabaseAdmin
      .from('EquipmentFilterOption')
      .select('*')
      .order('sortOrder', { ascending: true })

    if (error) throw error
    return NextResponse.json(options)
  } catch {
    return NextResponse.json({ error: '獲取篩選選項失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { type, value, field, equipType, categoryId } = await request.json()
    if (!type || !value || !field || !equipType) {
      return NextResponse.json({ error: '類型、值、字段和裝備類型不能為空' }, { status: 400 })
    }
    const { data: option, error } = await supabaseAdmin
      .from('EquipmentFilterOption')
      .insert({ type, value, field, equipType, categoryId: categoryId ?? null })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(option, { status: 201 })
  } catch {
    return NextResponse.json({ error: '創建篩選選項失敗' }, { status: 500 })
  }
}