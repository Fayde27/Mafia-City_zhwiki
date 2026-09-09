export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 現存模塊（角色/建築/裝備/兵種圖鑑已於 2026-07 移除）
const TABLE_MAP: Record<string, string> = {
  article:      'Article',
  item:         'Item',
  event:        'Event',
  announcement: 'Announcement',
}

export async function POST(request: Request) {
  try {
    const { entityType, entityId } = await request.json()
    const table = TABLE_MAP[entityType]
    if (!table || !entityId) {
      return NextResponse.json({ error: '參數錯誤' }, { status: 400 })
    }

    // 僅 Article 有瀏覽計數
    if (entityType !== 'article') {
      return NextResponse.json({ success: true })
    }

    // views    = 對外展示數，維持原本的隨機 +1~5（注水）
    // realViews = 真實訪問數，固定 +1，只給後台看
    const displayInc = Math.floor(Math.random() * 5) + 1

    // 用 SQL 函數原子遞增：原本「先 select 再 update」在併發下會互相覆蓋而丟計數
    const { data, error } = await supabaseAdmin
      .rpc('increment_article_views', { p_id: entityId, p_display_inc: displayInc })

    if (error) {
      // 函數尚未建立（未執行 2026-09-article-real-views.sql）時退回舊的讀寫方式，
      // 至少不讓前台的瀏覽數停止累加
      const { data: current } = await supabaseAdmin
        .from(table).select('views').eq('id', entityId).single()
      if (!current) return NextResponse.json({ success: true })
      const newViews = (current.views || 0) + displayInc
      await supabaseAdmin.from(table).update({ views: newViews }).eq('id', entityId)
      return NextResponse.json({ views: newViews })
    }

    const row = Array.isArray(data) ? data[0] : data
    return NextResponse.json({ views: row?.views ?? null })
  } catch {
    return NextResponse.json({ error: '操作失敗' }, { status: 500 })
  }
}
