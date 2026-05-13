export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: sections, error } = await supabaseAdmin
      .from('SidebarSection')
      .select('*')
      .order('sortOrder', { ascending: false })

    if (error) throw error
    return NextResponse.json(sections || [])
  } catch (error) {
    return NextResponse.json({ error: '获取侧边栏分类失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { data: section, error } = await supabaseAdmin
      .from('SidebarSection')
      .insert({
        name: data.name,
        slug: data.slug,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== false,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(section, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建分类失败' }, { status: 500 })
  }
}
