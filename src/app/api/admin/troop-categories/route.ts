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
        return { ...cat, _count: { troops: count || 0 } }
      })
    )
    return NextResponse.json(withCounts)
  } catch (error) {
    return NextResponse.json({ error: '获取兵种分类失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, slug, description, icon, sortOrder } = await request.json()
    const { data: category, error } = await supabaseAdmin
      .from('TroopCategory')
      .insert({ name, slug, description, icon, sortOrder: sortOrder || 0 })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建兵种分类失败' }, { status: 500 })
  }
}
