export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')

    let query = supabaseAdmin
      .from('Equipment')
      .select('*, EquipmentCategory(*)')
      .eq('isPublished', true)

    if (category) {
      query = query.eq('EquipmentCategory.slug', category)
    }
    if (slug) {
      query = query.eq('slug', slug)
    }

    const { data: equipment, error } = await query
      .order('sortOrder', { ascending: false })

    if (error) throw error

    const mapped = (equipment || []).map(({ EquipmentCategory, ...rest }: any) => ({
      ...rest,
      category: EquipmentCategory,
    }))

    return NextResponse.json({ equipment: mapped })
  } catch {
    return NextResponse.json({ error: '獲取裝備失敗' }, { status: 500 })
  }
}