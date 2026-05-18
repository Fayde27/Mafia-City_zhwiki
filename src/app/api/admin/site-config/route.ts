export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('SiteConfig')
      .select('key, value')

    if (error) throw error

    const config: Record<string, string> = {}
    for (const row of data || []) {
      config[row.key] = row.value || ''
    }

    return NextResponse.json(config)
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const updates: Record<string, string> = await request.json()

    const upserts = Object.entries(updates).map(([key, value]) => ({
      key,
      value,
      updatedAt: new Date().toISOString(),
    }))

    const { error } = await supabaseAdmin
      .from('SiteConfig')
      .upsert(upserts, { onConflict: 'key' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '保存失敗' }, { status: 500 })
  }
}
