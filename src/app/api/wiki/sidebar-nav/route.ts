export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    // 获取所有激活的顶级项
    let topQuery = supabaseAdmin
      .from('SidebarNav')
      .select('*')
      .eq('isActive', true)
      .is('parentId', null)
      .order('sortOrder', { ascending: false })

    if (section) {
      topQuery = topQuery.eq('section', section)
    }

    const { data: topItems, error: topError } = await topQuery
    if (topError) throw topError

    // 为每个顶级项获取子项
    const withChildren = await Promise.all(
      (topItems || []).map(async (item) => {
        const { data: children } = await supabaseAdmin
          .from('SidebarNav')
          .select('*')
          .eq('parentId', item.id)
          .eq('isActive', true)
          .order('sortOrder', { ascending: false })
        return { ...item, children: children || [] }
      })
    )

    return NextResponse.json(withChildren)
  } catch (error) {
    return NextResponse.json({ error: '获取导航数据失败' }, { status: 500 })
  }
}
