export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sanitizeSearch, clampLimit } from '@/lib/sanitize'

// 聚合站內搜索：供富文本「插入內鏈」的條目選擇器使用
// 參數：q（關鍵字）· type（可選，限定單一實體）· limit（每類上限）
// 返回：統一形狀 { type, id, name, url, category, icon }

type EntityType = 'article' | 'character' | 'building' | 'item' | 'equipment' | 'troop'

const TYPE_LABELS: Record<EntityType, string> = {
  article: '文章',
  character: '角色',
  building: '建築',
  item: '道具',
  equipment: '裝備',
  troop: '兵種',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = sanitizeSearch(searchParams.get('q'))
    const type = searchParams.get('type') as EntityType | null
    const limit = clampLimit(searchParams.get('limit'), 10, 20)

    if (!q) return NextResponse.json({ results: [] })

    const like = `%${q}%`
    const want = (t: EntityType) => !type || type === t

    const tasks: PromiseLike<any[]>[] = []

    // 文章 /wiki/article/[slug]
    if (want('article')) {
      tasks.push(
        supabaseAdmin
          .from('Article')
          .select('id, title, slug, coverImage')
          .eq('isPublished', true)
          .ilike('title', like)
          .order('sortOrder', { ascending: false })
          .limit(limit)
          .then(({ data }) =>
            (data || []).map((a: any) => ({
              type: 'article' as const,
              id: a.id,
              name: a.title,
              url: `/wiki/article/${a.slug}`,
              category: TYPE_LABELS.article,
              icon: a.coverImage || '',
            }))
          )
      )
    }

    // 角色 /wiki/characters/[categorySlug]/[slug]
    if (want('character')) {
      tasks.push(
        supabaseAdmin
          .from('Character')
          .select('id, name, slug, image, CharacterCategory(slug, name)')
          .eq('isPublished', true)
          .ilike('name', like)
          .order('sortOrder', { ascending: false })
          .limit(limit)
          .then(({ data }) =>
            (data || [])
              .filter((c: any) => c.CharacterCategory?.slug)
              .map((c: any) => ({
                type: 'character' as const,
                id: c.id,
                name: c.name,
                url: `/wiki/characters/${c.CharacterCategory.slug}/${c.slug}`,
                category: c.CharacterCategory?.name || TYPE_LABELS.character,
                icon: c.image || '',
              }))
          )
      )
    }

    // 建築 /wiki/buildings/[categorySlug]/[slug]
    if (want('building')) {
      tasks.push(
        supabaseAdmin
          .from('Building')
          .select('id, name, slug, icon, BuildingCategory(slug, name)')
          .eq('isPublished', true)
          .ilike('name', like)
          .order('sortOrder', { ascending: false })
          .limit(limit)
          .then(({ data }) =>
            (data || [])
              .filter((b: any) => b.BuildingCategory?.slug)
              .map((b: any) => ({
                type: 'building' as const,
                id: b.id,
                name: b.name,
                url: `/wiki/buildings/${b.BuildingCategory.slug}/${b.slug}`,
                category: b.BuildingCategory?.name || TYPE_LABELS.building,
                icon: b.icon || '',
              }))
          )
      )
    }

    // 道具 /wiki/items/[categorySlug]/[slug]
    if (want('item')) {
      tasks.push(
        supabaseAdmin
          .from('Item')
          .select('id, name, slug, icon, ItemCategory(slug, name)')
          .eq('isPublished', true)
          .ilike('name', like)
          .order('sortOrder', { ascending: false })
          .limit(limit)
          .then(({ data }) =>
            (data || [])
              .filter((i: any) => i.ItemCategory?.slug)
              .map((i: any) => ({
                type: 'item' as const,
                id: i.id,
                name: i.name,
                url: `/wiki/items/${i.ItemCategory.slug}/${i.slug}`,
                category: i.ItemCategory?.name || TYPE_LABELS.item,
                icon: i.icon || '',
              }))
          )
      )
    }

    // 裝備 /wiki/equipment/[equipType]/[slug]
    if (want('equipment')) {
      tasks.push(
        supabaseAdmin
          .from('Equipment')
          .select('id, name, slug, icon, equipType')
          .eq('isPublished', true)
          .ilike('name', like)
          .order('sortOrder', { ascending: false })
          .limit(limit)
          .then(({ data }) =>
            (data || [])
              .filter((e: any) => e.equipType)
              .map((e: any) => ({
                type: 'equipment' as const,
                id: e.id,
                name: e.name,
                url: `/wiki/equipment/${e.equipType}/${e.slug}`,
                category: TYPE_LABELS.equipment,
                icon: e.icon || '',
              }))
          )
      )
    }

    // 兵種 /wiki/troops/[categorySlug]/[slug]
    if (want('troop')) {
      tasks.push(
        supabaseAdmin
          .from('Troop')
          .select('id, name, slug, icon, TroopCategory(slug, name)')
          .eq('isPublished', true)
          .ilike('name', like)
          .order('sortOrder', { ascending: false })
          .limit(limit)
          .then(({ data }) =>
            (data || [])
              .filter((t: any) => t.TroopCategory?.slug)
              .map((t: any) => ({
                type: 'troop' as const,
                id: t.id,
                name: t.name,
                url: `/wiki/troops/${t.TroopCategory.slug}/${t.slug}`,
                category: t.TroopCategory?.name || TYPE_LABELS.troop,
                icon: t.icon || '',
              }))
          )
      )
    }

    const settled = await Promise.all(tasks)
    const results = settled.flat()

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: '搜索失敗' }, { status: 500 })
  }
}
