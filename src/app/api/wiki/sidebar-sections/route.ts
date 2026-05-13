export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: sections, error } = await supabaseAdmin
      .from('SidebarSection')
      .select('*')
      .eq('isActive', true)
      .order('sortOrder', { ascending: false })

    if (error) throw error
    return NextResponse.json(sections || [])
  } catch (error) {
    return NextResponse.json({ error: '获取侧边栏分类失败' }, { status: 500 })
  }
}
