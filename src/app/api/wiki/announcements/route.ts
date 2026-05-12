export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: announcements, error } = await supabaseAdmin
      .from('Announcement')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: false })

    if (error) throw error
    return NextResponse.json(announcements)
  } catch (error) {
    return NextResponse.json({ error: '获取公告失败' }, { status: 500 })
  }
}