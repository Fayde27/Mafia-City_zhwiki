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
    return NextResponse.json({ error: '获取筛选选项失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { type, value } = await request.json()
    if (!type || !value) {
      return NextResponse.json({ error: '类型和值不能为空' }, { status: 400 })
    }
    const { data: option, error } = await supabaseAdmin
      .from('EquipmentFilterOption')
      .insert({ type, value })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(option, { status: 201 })
  } catch {
    return NextResponse.json({ error: '创建筛选选项失败' }, { status: 500 })
  }
}