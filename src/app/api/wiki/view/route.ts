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
}

export async function POST(request: Request) {
  try {
    const { entityType, entityId } = await request.json()
    const table = TABLE_MAP[entityType]
    if (!table || !entityId) {
      return NextResponse.json({ error: '參數錯誤' }, { status: 400 })
    }

    // 先取當前 views，再隨機增加 5~10（僅 Article 有 views 欄位）
    if (entityType !== 'article') {
      return NextResponse.json({ success: true })
    }

    const { data: current } = await supabaseAdmin
      .from(table)
      .select('views')
      .eq('id', entityId)
      .single()

    if (!current) return NextResponse.json({ success: true })

    const increment = Math.floor(Math.random() * 5) + 1  // 隨機 1~5
    const newViews = (current.views || 0) + increment

    await supabaseAdmin
      .from(table)
      .update({ views: newViews })
      .eq('id', entityId)

    return NextResponse.json({ views: newViews })
  } catch {
    return NextResponse.json({ error: '操作失敗' }, { status: 500 })
  }
}
