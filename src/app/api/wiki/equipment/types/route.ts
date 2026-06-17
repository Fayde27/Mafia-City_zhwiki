export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const TYPES = [
  { equipType: 'haojie_weapon',   label: '豪杰武器', icon: '🔫', description: '豪杰專用武器，按兵種分類加成' },
  { equipType: 'haojie_warbadge', label: '豪杰戰徽', icon: '🎖️', description: '豪杰戰徽，提供多維屬性加成' },
  { equipType: 'leader',          label: '首領裝備', icon: '👑', description: '首領各部位裝備與套裝' },
  { equipType: 'hero',            label: '英雄裝備', icon: '🛡️', description: '英雄各部位裝備與套裝' },
]

export async function GET() {
  try {
    const result = await Promise.all(
      TYPES.map(async (t) => {
        const { count } = await supabaseAdmin
          .from('Equipment')
          .select('*', { count: 'exact', head: true })
          .eq('equipType', t.equipType)
          .eq('isPublished', true)
        return { ...t, count: count || 0 }
      })
    )
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: '獲取裝備類型失敗' }, { status: 500 })
  }
}
