export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeLineupConfig } from '@/lib/lineup'

const CONFIG_KEY = 'lineupConfig'

// 公開：返回已發佈陣容 + 渲染所需的角色/武器/戰徽/流派/配置
// 參數：characterKind（haojie/hero）· genreId · heroId（按豪傑反查）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const characterKind = searchParams.get('characterKind') || 'haojie'
    const genreId = searchParams.get('genreId')
    const heroId = searchParams.get('heroId')

    let lq = supabaseAdmin
      .from('Lineup')
      .select('*')
      .eq('isPublished', true)
      .eq('characterKind', characterKind)
    if (genreId) lq = lq.eq('genreId', genreId)

    const [lineupsRes, heroes, weapons, emblems, genres, attrs, pets, heroEquips, equipSets, cfgRow] = await Promise.all([
      lq.order('isPinned', { ascending: false }).order('sortOrder', { ascending: true }),
      supabaseAdmin.from('LineupHero').select('*'),
      supabaseAdmin.from('LineupWeapon').select('*'),
      supabaseAdmin.from('LineupEmblem').select('*'),
      supabaseAdmin.from('LineupGenre').select('*').order('sortOrder', { ascending: true }),
      supabaseAdmin.from('LineupAttr').select('*').order('sortOrder', { ascending: true }),
      supabaseAdmin.from('LineupPet').select('*'),
      supabaseAdmin.from('LineupHeroEquip').select('*'),
      supabaseAdmin.from('LineupEquipSet').select('*'),
      supabaseAdmin.from('SiteConfig').select('value').eq('key', CONFIG_KEY).maybeSingle(),
    ])

    let lineups = lineupsRes.data || []
    // 按豪傑反查：slots 中任一位包含該 heroId
    if (heroId) {
      lineups = lineups.filter((l: any) => {
        let slots: any[] = []
        try { slots = JSON.parse(l.slots || '[]') } catch {}
        return slots.some((s) => s?.heroId === heroId)
      })
    }

    let config: any = {}
    if (cfgRow.data?.value) { try { config = normalizeLineupConfig(JSON.parse(cfgRow.data.value)) } catch {} }

    return NextResponse.json({
      lineups,
      heroes: heroes.data || [],
      weapons: weapons.data || [],
      emblems: emblems.data || [],
      genres: genres.data || [],
      attrs: attrs.data || [],
      pets: pets.data || [],
      heroEquips: heroEquips.data || [],
      equipSets: equipSets.data || [],
      config,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '獲取陣容失敗' }, { status: 500 })
  }
}
