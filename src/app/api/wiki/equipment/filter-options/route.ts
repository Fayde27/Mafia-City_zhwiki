export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const equipType = searchParams.get('equipType')
  if (!equipType) return NextResponse.json([])

  try {
    const { data: options, error } = await supabaseAdmin
      .from('EquipmentFilterOption')
      .select('id, type, value, field, sortOrder')
      .eq('equipType', equipType)
      .order('field', { ascending: true })
      .order('sortOrder', { ascending: true })

    if (error) throw error
    return NextResponse.json(options ?? [])
  } catch {
    return NextResponse.json([])
  }
}
