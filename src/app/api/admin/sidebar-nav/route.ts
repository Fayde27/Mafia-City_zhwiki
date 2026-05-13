export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    // 获取所有顶级项（包括未激活的）
    let topQuery = supabaseAdmin
      .from('SidebarNav')
      .select('*')
      .is('parentId', null)
      .order('sortOrder', { ascending: false })

    if (section) {
      topQuery = topQuery.eq('section', section)
    }

    const { data: topItems, error: topError } = await topQuery
    if (topError) throw topError

    // 为每个顶级项获取子项（包括未激活的）
    const withChildren = await Promise.all(
      (topItems || []).map(async (item) => {
        const { data: children } = await supabaseAdmin
          .from('SidebarNav')
          .select('*')
          .eq('parentId', item.id)
          .order('sortOrder', { ascending: false })
        return { ...item, children: children || [] }
      })
    )

    return NextResponse.json(withChildren)
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
        href: data.href || '',
        parentId: data.parentId || null,
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
