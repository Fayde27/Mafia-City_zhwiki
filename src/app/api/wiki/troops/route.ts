export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')

    let query = supabaseAdmin
      .from('Troop')
      .select('*, TroopCategory(*)')
      .eq('isPublished', true)

    if (category) {
      query = query.eq('TroopCategory.slug', category)
    }
    if (slug) {
      query = query.eq('slug', slug)
    }

    const { data: troops, error } = await query
      .order('sortOrder', { ascending: false })

    if (error) throw error

    const mapped = (troops || []).map(({ TroopCategory, ...rest }: any) => ({
      ...rest,
      category: TroopCategory,
    }))

    return NextResponse.json({ troops: mapped })
  } catch {
    return NextResponse.json({ error: '获取兵种失败' }, { status: 500 })
  }
}