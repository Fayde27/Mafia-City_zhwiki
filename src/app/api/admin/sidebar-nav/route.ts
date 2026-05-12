export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    let query = supabaseAdmin
      .from('SidebarNav')
      .select('*')
      .order('sortOrder', { ascending: false })

    if (section) {
      query = query.eq('section', section)
    }

    const { data: items, error } = await query

    if (error) throw error
    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json({ error: '获取导航数据失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { data: item, error } = await supabaseAdmin
      .from('SidebarNav')
      .insert({
        section: data.section,
        label: data.label,
        icon: data.icon || null,
        href: data.href,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== false,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: '创建导航项失败' }, { status: 500 })
  }
}