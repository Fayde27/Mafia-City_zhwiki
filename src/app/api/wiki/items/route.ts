export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')

    let query = supabaseAdmin
      .from('Item')
      .select('*, ItemCategory(*)')
      .eq('isPublished', true)

    if (category) {
      query = query.eq('ItemCategory.slug', category)
    }
    if (slug) {
      query = query.eq('slug', slug)
    }

    const { data: items, error } = await query
      .order('sortOrder', { ascending: false })

    if (error) throw error

    const mapped = (items || []).map(({ ItemCategory, ...rest }: any) => ({
      ...rest,
      category: ItemCategory,
    }))

    return NextResponse.json({ items: mapped })
  } catch {
    return NextResponse.json({ error: '獲取道具失敗' }, { status: 500 })
  }
}