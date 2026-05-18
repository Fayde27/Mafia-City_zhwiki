export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('CharacterCategory')
      .select('*')
      .order('sortOrder', { ascending: true })

    if (error) throw error

    const withCounts = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count } = await supabaseAdmin
          .from('Character')
          .select('*', { count: 'exact', head: true })
          .eq('categoryId', cat.id)
          .eq('isPublished', true)
        return { ...cat, _count: { characters: count || 0 } }
      })
    )

    return NextResponse.json(withCounts)
  } catch (error) {
    return NextResponse.json({ error: '獲取角色分類失敗' }, { status: 500 })
  }
}
