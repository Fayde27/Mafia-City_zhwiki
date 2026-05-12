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
      .eq('isActive', true)
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