export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')

    let query = supabaseAdmin
      .from('Building')
      .select('*, BuildingCategory(*)')
      .eq('isPublished', true)

    if (category) {
      query = query.eq('BuildingCategory.slug', category)
    }
    if (slug) {
      query = query.eq('slug', slug)
    }

    const { data: buildings, error } = await query
      .order('sortOrder', { ascending: false })

    if (error) throw error

    const mapped = (buildings || []).map(({ BuildingCategory, ...rest }: any) => ({
      ...rest,
      category: BuildingCategory,
    }))

    return NextResponse.json({ buildings: mapped })
  } catch {
    return NextResponse.json({ error: '獲取建築失敗' }, { status: 500 })
  }
}