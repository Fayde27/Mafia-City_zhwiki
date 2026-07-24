export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 全域配置存 SiteConfig，key = 'lineupConfig'（JSON 字串）
const CONFIG_KEY = 'lineupConfig'

// GET：一次性返回整個陣容資料集（後台單頁編輯用）
export async function GET() {
  try {
    const [lineups, heroes, weapons, emblems, genres, cfgRow] = await Promise.all([
      supabaseAdmin.from('Lineup').select('*').order('sortOrder', { ascending: true }),
      supabaseAdmin.from('LineupHero').select('*').order('sortOrder', { ascending: true }),
      supabaseAdmin.from('LineupWeapon').select('*').order('sortOrder', { ascending: true }),
      supabaseAdmin.from('LineupEmblem').select('*').order('sortOrder', { ascending: true }),
      supabaseAdmin.from('LineupGenre').select('*').order('sortOrder', { ascending: true }),
      supabaseAdmin.from('SiteConfig').select('value').eq('key', CONFIG_KEY).maybeSingle(),
    ])

    let config: any = {}
    if (cfgRow.data?.value) {
      try { config = JSON.parse(cfgRow.data.value) } catch { config = {} }
    }

    return NextResponse.json({
      lineups: lineups.data || [],
      heroes: heroes.data || [],
      weapons: weapons.data || [],
      emblems: emblems.data || [],
      genres: genres.data || [],
      config,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '獲取陣容資料失敗' }, { status: 500 })
  }
}

// PUT：整組替換（刪舊插新，符合單頁保存模型）
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const now = new Date().toISOString()

    const lineups = (body.lineups || []).map((l: any, i: number) => ({
      id: l.id,
      title: l.title || '未命名',
      slug: l.slug || l.id,
      characterKind: l.characterKind || 'haojie',
      genreId: l.genreId || null,
      bgUrl: l.bgUrl || null,
      badgeIds: JSON.stringify(l.badgeIds || []),
      description: l.description || null,
      slots: JSON.stringify(l.slots || []),
      updateText: l.updateText || null,
      isPinned: !!l.isPinned,
      isPublished: l.isPublished !== false, // 預設發佈
      sortOrder: l.sortOrder ?? i,
      updatedAt: now,
    }))
    const heroes = (body.heroes || []).map((h: any, i: number) => ({
      id: h.id, name: h.name, style: h.style || null, imgUrl: h.imgUrl || null,
      characterKind: h.characterKind || 'haojie', sortOrder: h.sortOrder ?? i, updatedAt: now,
    }))
    const weapons = (body.weapons || []).map((w: any, i: number) => ({
      id: w.id, parentId: w.parentId || null, displayName: w.displayName || w.name || '未命名',
      variantLabel: w.variantLabel || null, quality: w.quality || 'gold', isExclusive: !!w.isExclusive,
      exclusiveHeroId: w.exclusiveHeroId || null, imgUrl: w.imgUrl || null,
      attrs: JSON.stringify(w.attrs || []), sortOrder: w.sortOrder ?? i, updatedAt: now,
    }))
    const emblems = (body.emblems || []).map((e: any, i: number) => ({
      id: e.id, parentId: e.parentId || null, displayName: e.displayName || e.name || '未命名',
      variantLabel: e.variantLabel || null, quality: e.quality || 'gold', imgUrl: e.imgUrl || null,
      attrs: JSON.stringify(e.attrs || []), sortOrder: e.sortOrder ?? i, updatedAt: now,
    }))
    const genres = (body.genres || []).map((g: any, i: number) => ({
      id: g.id, name: g.name, color: g.color || '#C9A227', imgUrl: g.imgUrl || null,
      sortOrder: g.sortOrder ?? i, updatedAt: now,
    }))

    // 刪舊插新
    const tables = ['Lineup', 'LineupHero', 'LineupWeapon', 'LineupEmblem', 'LineupGenre']
    for (const t of tables) {
      const del = await supabaseAdmin.from(t).delete().not('id', 'is', null)
      if (del.error) throw del.error
    }
    if (lineups.length) { const r = await supabaseAdmin.from('Lineup').insert(lineups); if (r.error) throw r.error }
    if (heroes.length)  { const r = await supabaseAdmin.from('LineupHero').insert(heroes); if (r.error) throw r.error }
    if (weapons.length) { const r = await supabaseAdmin.from('LineupWeapon').insert(weapons); if (r.error) throw r.error }
    if (emblems.length) { const r = await supabaseAdmin.from('LineupEmblem').insert(emblems); if (r.error) throw r.error }
    if (genres.length)  { const r = await supabaseAdmin.from('LineupGenre').insert(genres); if (r.error) throw r.error }

    // 配置
    if (body.config !== undefined) {
      const r = await supabaseAdmin.from('SiteConfig').upsert(
        { key: CONFIG_KEY, value: JSON.stringify(body.config || {}), updatedAt: now },
        { onConflict: 'key' }
      )
      if (r.error) throw r.error
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '保存陣容資料失敗' }, { status: 500 })
  }
}
