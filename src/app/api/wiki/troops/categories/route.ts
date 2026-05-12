export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('TroopCategory')
      .select('*')
      .order('sortOrder', { ascending: true })

    if (error) throw error

    const withCounts = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count } = await supabaseAdmin
          .from('Troop')
          .select('*', { count: 'exact', head: true })
          .eq('categoryId', cat.id)
          .eq('isPublished', true)
        return { ...cat, _count: { troops: count || 0 } }
      })
    )

    return NextResponse.json(withCounts)
  } catch {
    return NextResponse.json({ error: '获取兵种分类失败' }, { status: 500 })
  }
}
