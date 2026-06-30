export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const TABLE_MAP: Record<string, string> = {
  article:      'Article',
  character:    'Character',
  building:     'Building',
  equipment:    'Equipment',
  item:         'Item',
  troop:        'Troop',
  announcement: 'Announcement',
  event:        'Event',
}

export async function POST(request: Request) {
  try {
    const { entityType, entityId } = await request.json()
    const table = TABLE_MAP[entityType]
    if (!table || !entityId) {
      return NextResponse.json({ error: '參數錯誤' }, { status: 400 })
    }

    const { data: current } = await supabaseAdmin
      .from(table)
      .select('likes')
      .eq('id', entityId)
      .single()

    if (!current) return NextResponse.json({ error: '找不到內容' }, { status: 404 })

    const newLikes = (current.likes || 0) + 1
    await supabaseAdmin
      .from(table)
      .update({ likes: newLikes })
      .eq('id', entityId)

    return NextResponse.json({ likes: newLikes })
  } catch {
    return NextResponse.json({ error: '操作失敗' }, { status: 500 })
  }
}
