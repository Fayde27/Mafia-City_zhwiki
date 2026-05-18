export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    // 獲取所有激活的頂級項
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

    // 為每個頂級項獲取子項
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
    return NextResponse.json({ error: '獲取導航數據失敗' }, { status: 500 })
  }
}
