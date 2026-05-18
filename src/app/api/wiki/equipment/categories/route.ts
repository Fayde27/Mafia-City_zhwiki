export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('EquipmentCategory')
      .select('*')
      .order('sortOrder', { ascending: true })

    if (error) throw error

    const withCounts = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count } = await supabaseAdmin
          .from('Equipment')
          .select('*', { count: 'exact', head: true })
          .eq('categoryId', cat.id)
          .eq('isPublished', true)
        return { ...cat, _count: { equipment: count || 0 } }
      })
    )

    return NextResponse.json(withCounts)
  } catch {
    return NextResponse.json({ error: '獲取裝備分類失敗' }, { status: 500 })
  }
}
