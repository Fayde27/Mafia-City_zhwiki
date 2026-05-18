export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: options, error } = await supabaseAdmin
      .from('ItemFilterOption')
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
    const { type, value, categoryId } = await request.json()
    if (!type || !value || !categoryId) {
      return NextResponse.json({ error: '類型、值和分類不能為空' }, { status: 400 })
    }
    const { data: option, error } = await supabaseAdmin
      .from('ItemFilterOption')
      .insert({ type, value, categoryId })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(option, { status: 201 })
  } catch {
    return NextResponse.json({ error: '創建篩選選項失敗' }, { status: 500 })
  }
}