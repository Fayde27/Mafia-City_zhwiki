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
