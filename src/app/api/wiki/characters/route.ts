export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')
    const search = searchParams.get('search')

    const selectStr = category ? '*, CharacterCategory!inner(*)' : '*, CharacterCategory(*)'

    let query = supabaseAdmin
      .from('Character')
      .select(selectStr)
      .eq('isPublished', true)

    if (category) {
      query = query.eq('CharacterCategory.slug', category)
    }
    if (slug) {
      query = query.eq('slug', slug)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: characters, error } = await query
      .order('sortOrder', { ascending: false })

    if (error) throw error

    const mapped = (characters || []).map(({ CharacterCategory, ...rest }: any) => ({
      ...rest,
      category: CharacterCategory,
    }))

    return NextResponse.json({ characters: mapped })
  } catch (error) {
    return NextResponse.json({ error: '获取角色失败' }, { status: 500 })
  }
}