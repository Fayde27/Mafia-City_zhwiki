'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import {
  QUALITY_COLOR, STAT_DEFAULT_ICON, STAT_DEFAULT_NAME, STAT_COLOR, STYLE_DEFAULT_ICON,
  HERO_EQUIP_SLOTS, parseArr, badgeStyle,
  type LineupT, type LineupHeroT, type LineupWeaponT, type LineupEmblemT,
  type LineupGenreT, type LineupConfigT, type BadgeT, type LineupSlotT,
  type LineupAttrT, type LineupPetT, type LineupHeroEquipT, type LineupEquipSetT,
} from '@/lib/lineup'

interface DataT {
  lineups: LineupT[]; heroes: LineupHeroT[]; weapons: LineupWeaponT[]
  emblems: LineupEmblemT[]; genres: LineupGenreT[]; config: LineupConfigT
  attrs: LineupAttrT[]; pets: LineupPetT[]
  heroEquips: LineupHeroEquipT[]; equipSets: LineupEquipSetT[]
}

export default function LineupWikiApp({ kind }: { kind: 'haojie' | 'hero' }) {
  const [data, setData] = useState<DataT | null>(null)
  const [loading, setLoading] = useState(true)
  const [genreFilter, setGenreFilter] = useState('')
  const [heroFilter, setHeroFilter] = useState('')
  const isHero = kind === 'hero'
  const kindLabel = isHero ? '英雄' : '豪傑'

  useEffect(() => {
    setLoading(true)
    setHeroFilter('')
    fetch(`/api/wiki/lineups?characterKind=${kind}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [kind])

  const heroMap = useMemo(() => Object.fromEntries((data?.heroes || []).map(h => [h.id, h])), [data])
  const weaponMap = useMemo(() => Object.fromEntries((data?.weapons || []).map(w => [w.id, w])), [data])
  const emblemMap = useMemo(() => Object.fromEntries((data?.emblems || []).map(e => [e.id, e])), [data])
  const genreMap = useMemo(() => Object.fromEntries((data?.genres || []).map(g => [g.id, g])), [data])
  const badgeMap = useMemo(() => Object.fromEntries((data?.config?.badges || []).map(b => [b.id, b])), [data])
  const attrMap = useMemo(() => Object.fromEntries((data?.attrs || []).map(a => [a.id, a])), [data])
  const petMap = useMemo(() => Object.fromEntries((data?.pets || []).map(p => [p.id, p])), [data])
  const equipMap = useMemo(() => Object.fromEntries((data?.heroEquips || []).map(e => [e.id, e])), [data])
  const setMap = useMemo(() => Object.fromEntries((data?.equipSets || []).map(s => [s.id, s])), [data])

  const styleName = (s?: string) => (s && data?.config?.styleNames?.[s]) || s || ''
  const statName = (k?: string) => (k && data?.config?.statNames?.[k]) || (k && STAT_DEFAULT_NAME[k]) || ''
  const statIcon = (k?: string) => (data?.config?.statIcons || []).find(x => x.key === k)?.imgUrl || ''
  const styleIcon = (s?: string) => (data?.config?.styleIcons || []).find(x => x.style === s)?.imgUrl || ''

  const filtered = useMemo(() => {
    let list = data?.lineups || []
    if (genreFilter) list = list.filter(l => l.genreId === genreFilter)
    if (heroFilter) list = list.filter(l => parseArr<LineupSlotT>(l.slots).some(s => s.heroId === heroFilter))
    return list
  }, [data, genreFilter, heroFilter])

  const pageCfg = data?.config?.pageConfig

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{kindLabel}陣容搭配</span>
        </div>

        <div className="text-center mb-8">
          {pageCfg?.eyebrow && <div className="text-xs tracking-[0.3em] text-wiki-accent/70 uppercase mb-1">{pageCfg.eyebrow}</div>}
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">
            {isHero ? (pageCfg?.heroTitle || '英雄陣容搭配') : (pageCfg?.title || '豪傑陣容搭配')}
          </h1>
          {pageCfg?.showTime && pageCfg?.timeText && <div className="text-wiki-text-muted text-sm mt-2 tracking-widest">{pageCfg.timeText}</div>}
        </div>

        {/* 另一個陣容入口（豪傑 / 英雄 為兩個獨立頁面） */}
        <div className="flex justify-center mb-5">
          <Link href={isHero ? '/wiki/lineups' : '/wiki/hero-lineups'}
            className="px-5 py-2 rounded-full text-sm border border-wiki-border text-wiki-text-muted hover:border-wiki-accent hover:text-wiki-accent transition-colors">
            前往{isHero ? '豪傑' : '英雄'}陣容搭配 →
          </Link>
        </div>

        {/* 篩選 */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <button onClick={() => setGenreFilter('')} className={`px-4 py-1.5 rounded-full text-sm border ${!genreFilter ? 'border-wiki-accent bg-wiki-accent/10 text-wiki-accent' : 'border-wiki-border text-wiki-text-muted'}`}>全部流派</button>
          {(data?.genres || []).map(g => (
            <button key={g.id} onClick={() => setGenreFilter(g.id)} className={`px-4 py-1.5 rounded-full text-sm border flex items-center gap-1.5 ${genreFilter === g.id ? 'border-wiki-accent bg-wiki-accent/10 text-wiki-accent' : 'border-wiki-border text-wiki-text-muted'}`}>
              <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />{g.name}
            </button>
          ))}
        </div>
        {/* 按角色反查 */}
        <div className="flex items-center gap-2 justify-center mb-8 flex-wrap">
          <span className="text-sm text-wiki-text-muted">按角色反查：</span>
          <select value={heroFilter} onChange={e => setHeroFilter(e.target.value)} className="bg-wiki-gray border border-wiki-border rounded px-3 py-1.5 text-sm text-wiki-text">
            <option value="">— 全部角色 —</option>
            {(data?.heroes || []).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          {heroFilter && <button onClick={() => setHeroFilter('')} className="text-xs text-wiki-accent">清除</button>}
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : !filtered.length ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-12 text-center text-wiki-text-muted">暫無符合的陣容</div>
        ) : (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            {filtered.map(l => {
              const slots = parseArr<LineupSlotT>(l.slots)
              const genre = genreMap[l.genreId || '']
              const badges: string[] = parseArr(l.badgeIds)
              return (
                <div key={l.id} className="bg-wiki-card border border-wiki-border rounded-xl overflow-hidden relative">
                  {l.bgUrl && <div className="absolute inset-0 opacity-[0.06] bg-cover bg-center" style={{ backgroundImage: `url(${l.bgUrl})` }} />}
                  {/* 頂部欄 */}
                  <div className="relative flex items-center justify-between gap-2 px-4 py-2.5 border-b border-wiki-border">
                    <div className="flex items-center gap-2 flex-wrap">
                      {genre && <span className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-wiki-border text-xs font-bold text-wiki-text"><span className="w-2 h-2 rounded-full" style={{ background: genre.color }} />{genre.name}</span>}
                      {badges.map(bid => {
                        const b = badgeMap[bid]
                        if (!b) return null
                        return b.imgUrl
                          ? <img key={bid} src={b.imgUrl} alt={b.name} className="h-5 max-w-[80px] object-contain" />
                          : <span key={bid} className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={badgeStyle(b)}>{b.name}</span>
                      })}
                    </div>
                    {l.updateText && <span className="text-xs text-wiki-text-muted whitespace-nowrap">更新 {l.updateText}</span>}
                  </div>
                  {/* 3 槽位 */}
                  <div className="relative grid grid-cols-1 sm:grid-cols-3 border-b border-wiki-border">
                    {slots.map((s, idx) => {
                      const hero = heroMap[s.heroId || '']
                      const weapon = weaponMap[s.weaponId || '']
                      const emblem = emblemMap[s.emblemId || '']
                      const roleLabel = data?.config?.roleLabels?.[s.role]
                      return (
                        <div key={s.role} className="border-r border-wiki-border last:border-r-0">
                          {/* 立繪 */}
                          <div className="relative aspect-[3/4] bg-wiki-gray overflow-hidden">
                            {hero?.imgUrl ? <img src={hero.imgUrl} alt={hero.name} className="w-full h-full object-cover" style={{ objectPosition: 'top center' }} /> : <div className="w-full h-full flex items-center justify-center text-wiki-text-muted text-xs">{hero?.name || '未設置'}</div>}
                            {roleLabel && <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-wiki-accent border border-wiki-accent/50">{roleLabel.emoji} {roleLabel.text}</span>}
                            {s.stat && (
                              <span className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-black/70 text-white border" style={{ borderColor: STAT_COLOR[s.stat] + '99', color: STAT_COLOR[s.stat] }}>
                                {statIcon(s.stat) ? <img src={statIcon(s.stat)} className="w-4 h-4 object-contain" alt="" /> : <span>{STAT_DEFAULT_ICON[s.stat]}</span>}
                                {statName(s.stat)}
                              </span>
                            )}
                          </div>
                          {/* 名字條 */}
                          <div className="flex items-center gap-2 px-3 py-2 bg-black/5 border-t-2" style={{ borderColor: QUALITY_COLOR[weapon?.quality || 'gold'] }}>
                            {styleIcon(hero?.style) ? <img src={styleIcon(hero?.style)} className="w-5 h-5 rounded-full object-cover" alt="" /> : <span className="text-sm">{hero?.style ? STYLE_DEFAULT_ICON[hero.style] : ''}</span>}
                            <span className="font-bold text-wiki-text truncate">{hero?.name || '—'}</span>
                          </div>
                          {kind === 'haojie' ? (
                            <>
                              {/* 武器 + 該槽位挑選的武器詞條 */}
                              {weapon && (
                                <div className="flex items-start gap-2 px-3 py-2 border-t border-wiki-border">
                                  <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0 bg-wiki-gray flex items-center justify-center border" style={{ borderColor: QUALITY_COLOR[weapon.quality || 'gold'] }}>
                                    {weapon.imgUrl ? <img src={weapon.imgUrl} className="w-full h-full object-contain" alt="" /> : <span>⚔</span>}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs text-wiki-text-muted">武器</div>
                                    <div className="text-sm font-bold text-wiki-text truncate">{weapon.displayName}</div>
                                    {(s.weaponAttrIds || []).map(id => attrMap[id]).filter(Boolean)
                                      .map((a, i) => <div key={i} className="text-[11px] text-wiki-accent/90 leading-snug">⭐ {a.name}</div>)}
                                  </div>
                                </div>
                              )}
                              {/* 戰徽 + 該槽位挑選的戰徽詞條 */}
                              {emblem && (
                                <div className="flex items-start gap-2 px-3 py-2 border-t border-wiki-border">
                                  <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0 bg-wiki-gray flex items-center justify-center border" style={{ borderColor: QUALITY_COLOR[emblem.quality || 'gold'] }}>
                                    {emblem.imgUrl ? <img src={emblem.imgUrl} className="w-full h-full object-contain" alt="" /> : <span>🛡</span>}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs text-wiki-text-muted">戰徽</div>
                                    <div className="text-sm font-bold text-wiki-text truncate">{emblem.displayName}</div>
                                    <div className="text-[11px] text-wiki-text-muted leading-snug">
                                      {(s.emblemAttrIds || []).map(id => attrMap[id]?.name).filter(Boolean).join(' · ')}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {/* 戰寵 / 異獸 */}
                              {(s.petIds || []).length > 0 && (
                                <div className="px-3 py-2 border-t border-wiki-border">
                                  <div className="text-xs text-wiki-text-muted mb-1.5">戰寵 / 異獸</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(s.petIds || []).map(id => petMap[id]).filter(Boolean).map(p => (
                                      <div key={p.id} className="flex items-center gap-1 px-1.5 py-1 rounded border bg-wiki-gray/50" style={{ borderColor: QUALITY_COLOR[p.quality || 'gold'] + '99' }}>
                                        {p.imgUrl ? <img src={p.imgUrl} className="w-6 h-6 object-contain" alt="" /> : <span className="text-sm">🐾</span>}
                                        <span className="text-[11px] font-bold text-wiki-text">{p.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* 套裝 + 加成 */}
                              {setMap[s.setId || ''] && (
                                <div className="px-3 py-2 border-t border-wiki-border">
                                  <div className="flex items-center gap-2">
                                    {setMap[s.setId!].imgUrl && <img src={setMap[s.setId!].imgUrl} className="w-6 h-6 object-contain" alt="" />}
                                    <div className="text-xs text-wiki-text-muted">套裝</div>
                                    <div className="text-sm font-bold text-wiki-accent truncate">{setMap[s.setId!].name}</div>
                                  </div>
                                  {parseArr<string>(setMap[s.setId!].bonus).map((b, i) => (
                                    <div key={i} className="text-[11px] text-wiki-accent/90 leading-snug">✨ {b}</div>
                                  ))}
                                </div>
                              )}
                              {/* 6 格裝備 */}
                              {(s.equipIds || []).some(Boolean) && (
                                <div className="px-3 py-2 border-t border-wiki-border">
                                  <div className="text-xs text-wiki-text-muted mb-1.5">裝備</div>
                                  <div className="space-y-1">
                                    {HERO_EQUIP_SLOTS.map((sl, i) => {
                                      const eq = equipMap[(s.equipIds || [])[i] || '']
                                      return (
                                        <div key={sl.index} className="flex items-center gap-2">
                                          <span className="text-[10px] text-wiki-text-muted w-8 flex-shrink-0">{sl.label}</span>
                                          {eq ? (
                                            <>
                                              <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-wiki-gray flex items-center justify-center border" style={{ borderColor: QUALITY_COLOR[eq.quality || 'gold'] }}>
                                                {eq.imgUrl ? <img src={eq.imgUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-[10px]">🛡</span>}
                                              </div>
                                              <span className="text-[11px] text-wiki-text truncate">{eq.name}</span>
                                            </>
                                          ) : (
                                            <span className="text-[11px] text-wiki-text-muted/60">—</span>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {/* 底部解說 */}
                  <div className="relative px-4 py-3">
                    <h3 className="text-lg font-bold text-wiki-accent mb-1">{l.title}</h3>
                    {l.description && <div className="text-sm text-wiki-text leading-relaxed prose-wiki" dangerouslySetInnerHTML={{ __html: l.description }} />}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <WikiFooter />
    </div>
  )
}
