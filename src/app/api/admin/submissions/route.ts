export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('Submission')
      .select('*', { count: 'exact' })

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      submissions: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch {
    return NextResponse.json({ error: '获取投稿列表失败' }, { status: 500 })
  }
}
