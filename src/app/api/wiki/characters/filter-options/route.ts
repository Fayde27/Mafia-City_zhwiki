export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categorySlug = searchParams.get('categorySlug')
  if (!categorySlug) return NextResponse.json([])

  try {
    const { data: cat } = await supabaseAdmin
      .from('CharacterCategory')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (!cat) return NextResponse.json([])

    const { data: options, error } = await supabaseAdmin
      .from('CharacterFilterOption')
      .select('id, type, value, field, sortOrder')
      .eq('categoryId', cat.id)
      .order('type', { ascending: true })
      .order('sortOrder', { ascending: true })

    if (error) throw error
    return NextResponse.json(options ?? [])
  } catch {
    return NextResponse.json([])
  }
}
