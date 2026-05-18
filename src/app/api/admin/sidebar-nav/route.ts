export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    // 獲取所有頂級項（包括未激活的）
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

    // 為每個頂級項獲取子項（包括未激活的）
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
    return NextResponse.json({ error: '獲取導航數據失敗' }, { status: 500 })
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
    return NextResponse.json({ error: '創建導航項失敗' }, { status: 500 })
  }
}
