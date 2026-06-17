export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const equipType = searchParams.get('equipType')
    const slug = searchParams.get('slug')

    let query = supabaseAdmin
      .from('Equipment')
      .select('*, EquipmentCategory(*)')
      .eq('isPublished', true)

    if (category) {
      query = query.eq('EquipmentCategory.slug', category)
    }
    if (equipType) {
      query = query.eq('equipType', equipType)
    }
    if (slug) {
      query = query.eq('slug', slug)
    }

    const { data: equipment, error } = await query
      .order('sortOrder', { ascending: false })

    if (error) throw error

    // 單獨查詢套裝再拼接（不依賴外鍵內嵌）
    const setIds = Array.from(new Set((equipment || []).map((e: any) => e.setId).filter(Boolean)))
    let setsMap: Record<string, any> = {}
    if (setIds.length > 0) {
      const { data: sets } = await supabaseAdmin
        .from('EquipmentSet')
        .select('id, name, slug, setBonus, equipType')
        .in('id', setIds)
      setsMap = Object.fromEntries((sets || []).map((s: any) => [s.id, s]))
    }

    const mapped = (equipment || []).map(({ EquipmentCategory, ...rest }: any) => ({
      ...rest,
      category: EquipmentCategory,
      set: rest.setId ? setsMap[rest.setId] || null : null,
    }))

    return NextResponse.json({ equipment: mapped })
  } catch {
    return NextResponse.json({ error: '獲取裝備失敗' }, { status: 500 })
  }
}
