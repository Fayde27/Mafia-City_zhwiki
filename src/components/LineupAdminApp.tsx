'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ImageUploadInput from '@/components/ImageUploadInput'
import RichTextEditor from '@/components/RichTextEditor'
import {
  QUALITY_COLOR, QUALITY_LABEL, QUALITY_KEYS, STYLE_KEYS, STYLE_DEFAULT_ICON,
  STAT_KEYS, STAT_DEFAULT_NAME, STAT_DEFAULT_ICON, ROLE_KEYS, BUILTIN_BADGES,
  HERO_EQUIP_SLOTS, heroEquipSlotLabel, PET_MAX,
  parseArr, uid, defaultConfig, badgeStyle,
  type LineupT, type LineupHeroT, type LineupWeaponT, type LineupEmblemT,
  type LineupGenreT, type LineupConfigT, type BadgeT, type LineupSlotT,
  type LineupAttrT, type LineupPetT, type LineupHeroEquipT, type LineupEquipSetT,
} from '@/lib/lineup'

const cardCls = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'
const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none'
const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'
const btnPri = 'px-5 py-2.5 bg-wiki-accent text-black font-bold rounded hover:opacity-90 disabled:opacity-50'
const btnSec = 'px-4 py-2 bg-wiki-gray border border-wiki-border text-wiki-text rounded hover:border-wiki-accent'
const btnDanger = 'px-3 py-1.5 text-sm bg-wiki-gray border border-wiki-border text-red-500 rounded hover:border-red-500'

type Tab = 'lineups' | 'heroes' | 'styleicons' | 'badges' | 'staticons'
  | 'weapons' | 'emblems' | 'attrs' | 'pets' | 'heroequips' | 'equipsets' | 'genres'

// 豪傑 / 英雄 各自的 Tab 組成（兩套獨立後台，互不干擾）
const HAOJIE_TABS: { key: Tab; label: string }[] = [
  { key: 'lineups', label: '陣容搭配' },
  { key: 'heroes', label: '豪傑管理' },
  { key: 'weapons', label: '武器管理' },
  { key: 'emblems', label: '戰徽管理' },
  { key: 'attrs', label: '詞條管理' },
  { key: 'genres', label: '流派管理' },
  { key: 'styleicons', label: '風格圖標' },
  { key: 'staticons', label: '加點圖標' },
  { key: 'badges', label: '標籤管理' },
]
const HERO_TABS: { key: Tab; label: string }[] = [
  { key: 'lineups', label: '陣容搭配' },
  { key: 'heroes', label: '英雄管理' },
  { key: 'pets', label: '戰寵/異獸' },
  { key: 'heroequips', label: '英雄裝備' },
  { key: 'equipsets', label: '套裝管理' },
  { key: 'genres', label: '流派管理' },
  { key: 'styleicons', label: '風格圖標' },
  { key: 'badges', label: '標籤管理' },
]

export default function LineupAdminApp({ kind }: { kind: 'haojie' | 'hero' }) {
  const isHero = kind === 'hero'
  const TABS = isHero ? HERO_TABS : HAOJIE_TABS
  const kindLabel = isHero ? '英雄' : '豪傑'
  const [tab, setTab] = useState<Tab>('lineups')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [msg, setMsg] = useState('')

  const [lineups, setLineups] = useState<LineupT[]>([])
  const [heroes, setHeroes] = useState<LineupHeroT[]>([])
  const [weapons, setWeapons] = useState<LineupWeaponT[]>([])
  const [emblems, setEmblems] = useState<LineupEmblemT[]>([])
  const [genres, setGenres] = useState<LineupGenreT[]>([])
  const [attrs, setAttrs] = useState<LineupAttrT[]>([])
  const [pets, setPets] = useState<LineupPetT[]>([])
  const [heroEquips, setHeroEquips] = useState<LineupHeroEquipT[]>([])
  const [equipSets, setEquipSets] = useState<LineupEquipSetT[]>([])
  const [config, setConfig] = useState<LineupConfigT>(defaultConfig())

  const markDirty = useCallback(() => setDirty(true), [])

  useEffect(() => {
    fetch('/api/admin/lineups')
      .then(r => r.json())
      .then(d => {
        setLineups((d.lineups || []).map((l: any) => ({ ...l, badgeIds: parseArr(l.badgeIds), slots: parseArr(l.slots) })))
        setHeroes(d.heroes || [])
        setWeapons((d.weapons || []).map((w: any) => ({ ...w, attrs: parseArr(w.attrs) })))
        setEmblems((d.emblems || []).map((e: any) => ({ ...e, attrs: parseArr(e.attrs) })))
        setGenres(d.genres || [])
        setAttrs(d.attrs || [])
        setPets((d.pets || []).map((p: any) => ({ ...p, attrs: parseArr(p.attrs) })))
        setHeroEquips((d.heroEquips || []).map((e: any) => ({ ...e, attrs: parseArr(e.attrs) })))
        setEquipSets((d.equipSets || []).map((s: any) => ({ ...s, bonus: parseArr(s.bonus), genreIds: parseArr(s.genreIds) })))
        if (Array.isArray(d.missingTables) && d.missingTables.length) {
          setMsg(`⚠️ 資料表未建立：${d.missingTables.join('、')} — 請先在 Supabase 執行 2026-07-hero-lineup.sql，否則無法保存`)
        }
        const c = d.config && Object.keys(d.config).length ? d.config : defaultConfig()
        // 合併預設，保證圖標槽位齊全
        const dc = defaultConfig()
        setConfig({
          styleNames: { ...dc.styleNames, ...(c.styleNames || {}) },
          styleIcons: STYLE_KEYS.map(s => (c.styleIcons || []).find((x: any) => x.style === s) || { style: s, imgUrl: '' }),
          statNames: { ...dc.statNames, ...(c.statNames || {}) },
          statIcons: STAT_KEYS.map(k => (c.statIcons || []).find((x: any) => x.key === k) || { key: k, imgUrl: '' }),
          badges: (() => {
            const custom = (c.badges || []).filter((b: BadgeT) => !b.builtIn)
            return [...BUILTIN_BADGES, ...custom]
          })(),
          roleLabels: { ...dc.roleLabels, ...(c.roleLabels || {}) },
          pageConfig: { ...dc.pageConfig, ...(c.pageConfig || {}) },
        })
        setLoading(false)
      })
      .catch(() => { setLoading(false); setMsg('載入失敗（資料表可能尚未建立，請先執行 SQL 遷移）') })
  }, [])

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      const payload = {
        lineups: lineups.map((l, i) => ({ ...l, sortOrder: l.sortOrder ?? i, slug: l.slug || l.id })),
        heroes, weapons, emblems, genres, attrs, pets, heroEquips, equipSets, config,
      }
      const res = await fetch('/api/admin/lineups', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await res.json()
      if (res.ok) { setDirty(false); setMsg('✓ 已保存') } else { setMsg('保存失敗：' + (d.error || '')) }
    } catch (e: any) { setMsg('保存失敗：' + (e.message || '')) }
    finally { setSaving(false); setTimeout(() => setMsg(''), 4000) }
  }

  const styleName = (s?: string) => (s && config.styleNames?.[s]) || s || ''
  const statName = (k?: string) => (k && config.statNames?.[k]) || k || ''
  const weaponLabel = (w: LineupWeaponT) => (w.displayName || '') + (w.variantLabel ? ' · ' + w.variantLabel : '') + ' [' + (QUALITY_LABEL[w.quality || 'gold']) + ']'
  const emblemLabel = (e: LineupEmblemT) => (e.displayName || '') + (e.variantLabel ? ' · ' + e.variantLabel : '') + ' [' + (QUALITY_LABEL[e.quality || 'gold']) + ']'

  if (loading) return <div className="p-8 text-wiki-text-muted">載入中...</div>

  return (
    <div className="min-h-screen bg-wiki-bg">
      {/* 頂部欄 */}
      <div className="sticky top-0 z-30 bg-wiki-card border-b border-wiki-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="text-wiki-text-muted hover:text-wiki-accent text-sm">← 後台</Link>
            <h1 className="text-xl font-bold text-wiki-accent">{kindLabel}陣容搭配</h1>
            <Link href={isHero ? '/admin/lineups' : '/admin/hero-lineups'}
              className="text-xs text-wiki-text-muted hover:text-wiki-accent border border-wiki-border rounded px-2 py-1">
              切換到{isHero ? '豪傑' : '英雄'}陣容 →
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-sm text-wiki-text-muted">{msg}</span>}
            {dirty && <span className="text-xs text-orange-500">● 未保存</span>}
            <button className={btnPri} onClick={save} disabled={saving}>{saving ? '保存中...' : '保存全部'}</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 ${tab === t.key ? 'border-wiki-accent text-wiki-accent font-bold' : 'border-transparent text-wiki-text-muted hover:text-wiki-text'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'lineups' && (
          <LineupsTab {...{ kind, lineups, setLineups, heroes, weapons, emblems, genres, attrs, pets, heroEquips, equipSets, config, setConfig, markDirty, styleName, statName, weaponLabel, emblemLabel, save, saving, dirty }} />
        )}
        {tab === 'heroes' && (
          <HeroesTab {...{ kind, heroes, setHeroes, config, markDirty, styleName }} />
        )}
        {tab === 'attrs' && <AttrsTab {...{ attrs, setAttrs, markDirty }} />}
        {tab === 'pets' && <PetsTab {...{ pets, setPets, markDirty }} />}
        {tab === 'heroequips' && <HeroEquipsTab {...{ heroEquips, setHeroEquips, equipSets, markDirty }} />}
        {tab === 'equipsets' && <EquipSetsTab {...{ equipSets, setEquipSets, genres, markDirty }} />}
        {(tab === 'styleicons' || tab === 'badges' || tab === 'staticons') && (
          <ConfigTab section={tab} {...{ config, setConfig, markDirty }} />
        )}
        {tab === 'weapons' && (
          <EquipTab kind="weapon" items={weapons as any} setItems={setWeapons as any} heroes={heroes} markDirty={markDirty} label="武器" />
        )}
        {tab === 'emblems' && (
          <EquipTab kind="emblem" items={emblems as any} setItems={setEmblems as any} heroes={heroes} markDirty={markDirty} label="戰徽" />
        )}
        {tab === 'genres' && (
          <GenresTab {...{ genres, setGenres, markDirty }} />
        )}
      </div>
    </div>
  )
}

/* 詞條多選器（配隊槽位用） */
function AttrPicker({ list, selected, onToggle }: { list: LineupAttrT[]; selected: string[]; onToggle: (id: string) => void }) {
  if (!list.length) return <div className="text-xs text-wiki-text-muted">尚無詞條，請先到「詞條管理」新增</div>
  return (
    <div className="max-h-32 overflow-y-auto space-y-1 border border-wiki-border rounded p-2 bg-wiki-gray/40">
      {list.map(a => {
        const sel = selected.includes(a.id)
        return (
          <label key={a.id} className={`flex items-start gap-2 text-xs cursor-pointer px-1 py-0.5 rounded ${sel ? 'text-wiki-accent' : 'text-wiki-text-muted hover:text-wiki-text'}`}>
            <input type="checkbox" className="mt-0.5 accent-wiki-accent flex-shrink-0" checked={sel} onChange={() => onToggle(a.id)} />
            <span className="leading-snug">{a.name}</span>
          </label>
        )
      })}
    </div>
  )
}

/* ───────────── 陣容 Tab ───────────── */
function LineupsTab({ kind, lineups, setLineups, heroes, weapons, emblems, genres, attrs, pets, heroEquips, equipSets, config, setConfig, markDirty, styleName, statName, weaponLabel, emblemLabel, save, saving, dirty }: any) {
  // 只存 id：編輯中的改動**直接寫回 lineups**，避免「忘記按套用 → 改動丟失」
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing: LineupT | undefined = lineups.find((l: LineupT) => l.id === editingId)
  const editKind: 'haojie' | 'hero' = kind
  const kindHeroes = heroes.filter((h: LineupHeroT) => (h.characterKind || 'haojie') === kind)
  const kindLineups = lineups.filter((l: LineupT) => (l.characterKind || 'haojie') === kind)

  // 全域配置（函數式更新，避免異步/連續修改互相覆蓋）
  const updCfg = (fn: (c: LineupConfigT) => Partial<LineupConfigT>) => {
    setConfig((c: LineupConfigT) => ({ ...c, ...fn(c) }))
    markDirty()
  }
  const setPage = (patch: any) => updCfg(c => ({ pageConfig: { ...c.pageConfig, ...patch } }))
  const setRole = (r: string, patch: any) => updCfg(c => ({ roleLabels: { ...c.roleLabels, [r]: { ...(c.roleLabels as any)[r], ...patch } } }))

  const blankSlots = (): LineupSlotT[] => ROLE_KEYS.map(r => ({
    role: r, weaponAttrIds: [], emblemAttrIds: [], petIds: [], equipIds: Array(6).fill(undefined),
  }))
  const newLineup = (): LineupT => ({ id: uid(), title: '', characterKind: kind, badgeIds: [], slots: blankSlots(), isPublished: true, isPinned: false, sortOrder: lineups.length })

  // 對當前編輯中的陣容做局部更新（函數式，直接寫回 lineups）
  const patch = (fn: (l: LineupT) => Partial<LineupT>) => {
    setLineups((prev: LineupT[]) => prev.map(l => l.id === editingId ? { ...l, ...fn(l) } : l))
    markDirty()
  }
  const set = (fields: Partial<LineupT>) => patch(() => fields)

  const startNew = () => {
    const l = newLineup()
    setLineups((prev: LineupT[]) => [...prev, l])
    markDirty()
    setEditingId(l.id)
  }
  const edit = (l: LineupT) => {
    // 確保 slots/badgeIds 為陣列形態（從 DB 載入時可能是字串）
    setLineups((prev: LineupT[]) => prev.map(x => x.id === l.id
      ? { ...x, badgeIds: parseArr(x.badgeIds), slots: (parseArr(x.slots).length ? parseArr(x.slots) : blankSlots()) as LineupSlotT[] }
      : x))
    setEditingId(l.id)
  }
  const remove = (id: string) => {
    if (!confirm('確定刪除此陣容？')) return
    setLineups((p: LineupT[]) => p.filter(x => x.id !== id))
    markDirty()
    if (editingId === id) setEditingId(null)
  }

  const setSlot = (role: string, p: Partial<LineupSlotT>) => patch(l => ({
    slots: (parseArr<LineupSlotT>(l.slots).length ? parseArr<LineupSlotT>(l.slots) : blankSlots())
      .map(s => s.role === role ? { ...s, ...p } : s),
  }))
  const toggleBadge = (bid: string) => patch(l => {
    const cur: string[] = parseArr(l.badgeIds)
    return { badgeIds: cur.includes(bid) ? cur.filter(x => x !== bid) : [...cur, bid] }
  })
  // 槽位裡的多選（詞條 / 戰寵）
  const toggleSlotList = (role: string, key: 'weaponAttrIds' | 'emblemAttrIds' | 'petIds', id: string, max?: number) =>
    patch(l => ({
      slots: (parseArr<LineupSlotT>(l.slots).length ? parseArr<LineupSlotT>(l.slots) : blankSlots()).map(s => {
        if (s.role !== role) return s
        const cur: string[] = Array.isArray(s[key]) ? (s[key] as string[]) : []
        if (cur.includes(id)) return { ...s, [key]: cur.filter(x => x !== id) }
        if (max && cur.length >= max) return s // 超過上限不再加
        return { ...s, [key]: [...cur, id] }
      }),
    }))
  // 英雄 6 格裝備
  const setSlotEquip = (role: string, idx: number, equipId: string) => patch(l => ({
    slots: (parseArr<LineupSlotT>(l.slots).length ? parseArr<LineupSlotT>(l.slots) : blankSlots()).map(s => {
      if (s.role !== role) return s
      const arr = Array.isArray(s.equipIds) ? [...s.equipIds] : Array(6).fill(undefined)
      arr[idx] = equipId || undefined
      return { ...s, equipIds: arr }
    }),
  }))

  if (editing) {
    const slots: LineupSlotT[] = parseArr<LineupSlotT>(editing.slots).length ? parseArr<LineupSlotT>(editing.slots) : blankSlots()
    const badgeIds: string[] = parseArr(editing.badgeIds)
    return (
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-wiki-text">編輯{editKind === 'hero' ? '英雄' : '豪傑'}陣容</h2>
            <p className="text-xs text-wiki-text-muted mt-1">改動即時記錄，點「保存」寫入資料庫</p>
          </div>
          <div className="flex items-center gap-2">
            {dirty && <span className="text-xs text-orange-500">● 未保存</span>}
            <button className={btnSec} onClick={() => setEditingId(null)}>← 返回列表</button>
            <button className={btnPri} onClick={save} disabled={saving}>{saving ? '保存中...' : '💾 保存'}</button>
          </div>
        </div>

        {/* ▸ 選擇豪傑 & 各自加點（對照線下工具：立繪預覽 + 角色 + 加點） */}
        <div className="text-sm font-bold text-wiki-accent mb-3">▸ 選擇豪傑 &amp; 各自加點</div>
        <div className="flex flex-wrap gap-4 mb-6">
          {ROLE_KEYS.map((role, idx) => {
            const s = slots.find(x => x.role === role)!
            const hero = kindHeroes.find((h: LineupHeroT) => h.id === s.heroId)
            const roleLabel = config.roleLabels?.[role]?.text || (idx === 0 ? '主力' : '輔助' + idx)
            return (
              <div key={role} className="flex flex-col gap-1.5 items-center">
                <div className="text-xs text-wiki-text-muted uppercase tracking-wider">{roleLabel}</div>
                {/* 立繪預覽 */}
                <div className="w-24 h-32 rounded border border-dashed border-wiki-border bg-wiki-gray overflow-hidden flex items-center justify-center text-xs text-wiki-text-muted">
                  {hero?.imgUrl
                    ? <img src={hero.imgUrl} alt={hero.name} className="w-full h-full object-cover" style={{ objectPosition: 'top' }} />
                    : <span>{hero?.name || '未選擇'}</span>}
                </div>
                <select className="w-28 bg-wiki-gray border border-wiki-border px-2 py-1.5 text-xs text-wiki-text focus:border-wiki-accent focus:outline-none"
                  value={s.heroId || ''} onChange={e => setSlot(role, { heroId: e.target.value })}>
                  <option value="">— 選擇 —</option>
                  {kindHeroes.map((h: LineupHeroT) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <select className="w-28 bg-wiki-gray border border-wiki-border px-2 py-1.5 text-xs text-wiki-text focus:border-wiki-accent focus:outline-none"
                  value={s.stat || ''} onChange={e => setSlot(role, { stat: e.target.value })}>
                  <option value="">— 加點 —</option>
                  {STAT_KEYS.map(k => <option key={k} value={k}>{statName(k)}</option>)}
                </select>
              </div>
            )
          })}
        </div>

        {/* ▸ 選擇裝備：每一豎列 = 一個角色 */}
        <div className="text-sm font-bold text-wiki-accent mb-3">
          ▸ {editKind === 'hero' ? '戰寵 · 裝備 · 套裝' : '選擇裝備與詞條'}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {ROLE_KEYS.map((role, idx) => {
            const s = slots.find(x => x.role === role)!
            const hero = kindHeroes.find((h: LineupHeroT) => h.id === s.heroId)
            const prefix = config.roleLabels?.[role]?.text || (idx === 0 ? '主力' : '輔助' + idx)
            const selPets: string[] = Array.isArray(s.petIds) ? s.petIds : []
            const equipIds = Array.isArray(s.equipIds) ? s.equipIds : Array(6).fill(undefined)
            const set = equipSets.find((x: LineupEquipSetT) => x.id === s.setId)
            return (
              <div key={role} className="border border-wiki-border rounded-lg p-4">
                <div className="text-sm font-bold text-wiki-accent mb-3">
                  {prefix}{hero ? <span className="text-wiki-text-muted font-normal">（{hero.name}）</span> : null}
                </div>

                {editKind === 'haojie' ? (
                  <>
                    <label className={labelCls}>武器</label>
                    <select className={inputCls + ' mb-2'} value={s.weaponId || ''} onChange={e => setSlot(role, { weaponId: e.target.value })}>
                      <option value="">— 武器 —</option>
                      {weapons.map((w: LineupWeaponT) => <option key={w.id} value={w.id}>{weaponLabel(w)}</option>)}
                    </select>
                    <label className={labelCls}>武器詞條 <span className="normal-case font-normal text-wiki-text-muted">（可多選）</span></label>
                    <AttrPicker list={attrs.filter((a: LineupAttrT) => (a.kind || 'weapon') === 'weapon')}
                      selected={Array.isArray(s.weaponAttrIds) ? s.weaponAttrIds : []}
                      onToggle={id => toggleSlotList(role, 'weaponAttrIds', id)} />

                    <label className={labelCls + ' mt-3'}>戰徽</label>
                    <select className={inputCls + ' mb-2'} value={s.emblemId || ''} onChange={e => setSlot(role, { emblemId: e.target.value })}>
                      <option value="">— 戰徽 —</option>
                      {emblems.map((em: LineupEmblemT) => <option key={em.id} value={em.id}>{emblemLabel(em)}</option>)}
                    </select>
                    <label className={labelCls}>戰徽詞條 <span className="normal-case font-normal text-wiki-text-muted">（可多選）</span></label>
                    <AttrPicker list={attrs.filter((a: LineupAttrT) => a.kind === 'emblem')}
                      selected={Array.isArray(s.emblemAttrIds) ? s.emblemAttrIds : []}
                      onToggle={id => toggleSlotList(role, 'emblemAttrIds', id)} />
                  </>
                ) : (
                  <>
                    <label className={labelCls}>戰寵 / 異獸 <span className="normal-case font-normal text-wiki-text-muted">（最多 {PET_MAX} 個）</span></label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {pets.map((p: LineupPetT) => {
                        const sel = selPets.includes(p.id)
                        const disabled = !sel && selPets.length >= PET_MAX
                        return (
                          <button key={p.id} type="button" disabled={disabled}
                            onClick={() => toggleSlotList(role, 'petIds', p.id, PET_MAX)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition-colors ${sel ? 'border-wiki-accent bg-wiki-accent/10 text-wiki-accent' : disabled ? 'border-wiki-border text-wiki-text-muted opacity-40 cursor-not-allowed' : 'border-wiki-border text-wiki-text-muted hover:border-wiki-accent/50'}`}>
                            {p.imgUrl && <img src={p.imgUrl} alt="" className="w-5 h-5 object-contain" />}
                            {p.name}
                          </button>
                        )
                      })}
                      {!pets.length && <span className="text-xs text-wiki-text-muted">尚無戰寵，請先到「戰寵/異獸」新增</span>}
                    </div>

                    <label className={labelCls}>套裝</label>
                    <select className={inputCls + ' mb-1'} value={s.setId || ''} onChange={e => setSlot(role, { setId: e.target.value })}>
                      <option value="">— 套裝 —</option>
                      {equipSets.map((x: LineupEquipSetT) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                    {set && parseArr<string>(set.bonus).length > 0 && (
                      <div className="text-[11px] text-wiki-accent mb-3">{parseArr<string>(set.bonus).map((b, i) => <div key={i}>· {b}</div>)}</div>
                    )}

                    <label className={labelCls + ' mt-2'}>裝備 6 格</label>
                    <div className="space-y-1.5">
                      {HERO_EQUIP_SLOTS.map((sl, i) => (
                        <div key={sl.index} className="flex items-center gap-2">
                          <span className="text-xs text-wiki-text-muted w-10 flex-shrink-0">{sl.label}</span>
                          <select className="flex-1 bg-wiki-gray border border-wiki-border px-2 py-1.5 text-xs text-wiki-text focus:border-wiki-accent focus:outline-none"
                            value={equipIds[i] || ''} onChange={e => setSlotEquip(role, i, e.target.value)}>
                            <option value="">— 未設置 —</option>
                            {heroEquips.filter((eq: LineupHeroEquipT) => (eq.slotIndex ?? 1) === sl.index)
                              .map((eq: LineupHeroEquipT) => <option key={eq.id} value={eq.id}>{eq.name} [{QUALITY_LABEL[eq.quality || 'gold']}]</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* ▸ 陣容資訊 */}
        <div className="text-sm font-bold text-wiki-accent mb-3">▸ 陣容資訊</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>陣容標題</label>
            <input className={inputCls} value={editing.title} onChange={e => set({ title: e.target.value })} placeholder="如：飛車流強力組合" />
          </div>
          <div>
            <label className={labelCls}>適配流派</label>
            <select className={inputCls} value={editing.genreId || ''} onChange={e => set({ genreId: e.target.value })}>
              <option value="">— 流派 —</option>
              {genres.map((g: LineupGenreT) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>更新日期文字 <span className="normal-case font-normal text-wiki-text-muted">（右上角展示，如 2026/07）</span></label>
            <input className={inputCls} value={editing.updateText || ''} onChange={e => set({ updateText: e.target.value })} placeholder="選填" />
          </div>
          <div>
            <label className={labelCls}>顯示標籤 <span className="normal-case font-normal text-wiki-text-muted">（可多選）</span></label>
            <div className="flex flex-wrap gap-2 pt-1">
              {(config.badges || []).map((b: BadgeT) => (
                <button key={b.id} type="button" onClick={() => toggleBadge(b.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded border transition-colors ${badgeIds.includes(b.id) ? 'border-wiki-accent bg-wiki-accent/10' : 'border-wiki-border hover:border-wiki-accent/50'}`}>
                  {b.imgUrl
                    ? <img src={b.imgUrl} alt={b.name} className="h-5 max-w-[80px] object-contain" />
                    : <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded" style={badgeStyle(b)}>{b.name}</span>}
                  <span className="text-[10px] text-wiki-text-muted">{b.name}</span>
                </button>
              ))}
              {!(config.badges || []).length && <span className="text-xs text-wiki-text-muted">尚無標籤，請至「標籤管理」新增</span>}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <ImageUploadInput label="背景圖（選填，建議 1920×1080）" value={editing.bgUrl || ''} position="50% 50%"
            onChange={url => set({ bgUrl: url })} onPositionChange={() => {}} previewHeight="h-40" />
        </div>

        <div className="mb-4">
          <label className={labelCls}>陣容介紹（解說）</label>
          <RichTextEditor value={editing.description || ''} onChange={html => set({ description: html })} placeholder="陣容說明、技能聯動、打法建議..." />
        </div>

        <div className="flex flex-wrap gap-6 items-center">
          <label className="flex items-center gap-2 text-wiki-text"><input type="checkbox" checked={!!editing.isPinned} onChange={e => set({ isPinned: e.target.checked })} /> 置頂</label>
          <label className="flex items-center gap-2 text-wiki-text"><input type="checkbox" checked={editing.isPublished !== false} onChange={e => set({ isPublished: e.target.checked })} /> 發佈</label>
          <div className="flex items-center gap-2 text-wiki-text"><span>排序</span><input type="number" className="w-20 bg-wiki-gray border border-wiki-border px-2 py-1" value={editing.sortOrder ?? 0} onChange={e => set({ sortOrder: parseInt(e.target.value) || 0 })} /></div>
        </div>

        {/* 底部保存（免得滾回頂部） */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-wiki-border">
          <button className={btnPri} onClick={save} disabled={saving}>{saving ? '保存中...' : '💾 保存'}</button>
          <button className={btnSec} onClick={() => setEditingId(null)}>← 返回列表</button>
          {dirty && <span className="text-xs text-orange-500">● 有未保存的改動</span>}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 展示頁標題設定 */}
      <div className={cardCls + ' mb-4'}>
        <h3 className="font-bold text-wiki-accent mb-4">▸ 展示頁標題設定</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label className={labelCls}>副標題（小字）</label><input className={inputCls} value={config.pageConfig?.eyebrow || ''} onChange={e => setPage({ eyebrow: e.target.value })} placeholder="MAFIA CITY · TACTICAL GUIDE" /></div>
          {kind === 'hero'
            ? <div><label className={labelCls}>主標題</label><input className={inputCls} value={config.pageConfig?.heroTitle || ''} onChange={e => setPage({ heroTitle: e.target.value })} placeholder="英雄最強陣容" /></div>
            : <div><label className={labelCls}>主標題</label><input className={inputCls} value={config.pageConfig?.title || ''} onChange={e => setPage({ title: e.target.value })} placeholder="豪傑最強陣容" /></div>}
          <div><label className={labelCls}>時間文字</label><input className={inputCls} value={config.pageConfig?.timeText || ''} onChange={e => setPage({ timeText: e.target.value })} placeholder="選填，如 2026 第三賽季" /></div>
          <label className="flex items-center gap-2 text-wiki-text mt-8"><input type="checkbox" checked={!!config.pageConfig?.showTime} onChange={e => setPage({ showTime: e.target.checked })} /> 顯示時間文字</label>
        </div>
      </div>

      {/* 角色標識（全域生效） */}
      <div className={cardCls + ' mb-4'}>
        <h3 className="font-bold text-wiki-accent mb-1">▸ 角色標識（全域生效）</h3>
        <p className="text-xs text-wiki-text-muted mb-4">陣容卡片上「主力 / 輔助」的顯示文字與圖示</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLE_KEYS.map(r => (
            <div key={r} className="flex gap-2">
              <input className="flex-1 bg-wiki-gray border border-wiki-border px-3 py-2 text-wiki-text" value={config.roleLabels?.[r]?.text || ''} onChange={e => setRole(r, { text: e.target.value })} placeholder={r} />
              <input className="w-16 bg-wiki-gray border border-wiki-border px-3 py-2 text-wiki-text text-center" value={config.roleLabels?.[r]?.emoji || ''} onChange={e => setRole(r, { emoji: e.target.value })} placeholder="⚔️" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-wiki-text-muted">共 {kindLineups.length} 套{kind === 'hero' ? '英雄' : '豪傑'}陣容 · 修改後記得點「保存」寫入資料庫</p>
        <button className={btnPri} onClick={startNew}>+ 新增陣容</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {kindLineups.map((l: LineupT) => {
          const g = genres.find((x: LineupGenreT) => x.id === l.genreId)
          return (
            <div key={l.id} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-wiki-text">{l.title || '未命名'} {l.isPinned && <span className="text-xs text-wiki-accent">📌</span>} {l.isPublished === false && <span className="text-xs text-orange-500">草稿</span>}</div>
                <div className="text-sm text-wiki-text-muted">{g?.name || '無流派'}</div>
              </div>
              <div className="flex gap-2">
                <button className={btnSec} onClick={() => edit(l)}>編輯</button>
                <button className={btnDanger} onClick={() => remove(l.id)}>刪除</button>
              </div>
            </div>
          )
        })}
        {!kindLineups.length && (
          <div className="text-wiki-text-muted text-sm">尚無陣容</div>
        )}
      </div>
    </div>
  )
}

/* ───────────── 角色池 Tab ───────────── */
function HeroesTab({ kind, heroes, setHeroes, config, markDirty, styleName }: any) {
  const [editing, setEditing] = useState<LineupHeroT | null>(null)
  const kindHeroes = heroes.filter((h: LineupHeroT) => (h.characterKind || 'haojie') === kind)
  const start = () => setEditing({ id: uid(), name: '', style: '迅捷', imgUrl: '', characterKind: kind })
  const commit = () => {
    if (!editing || !editing.name) return
    setHeroes((p: LineupHeroT[]) => { const i = p.findIndex(x => x.id === editing.id); if (i >= 0) { const c = [...p]; c[i] = editing; return c } return [...p, editing] })
    markDirty(); setEditing(null)
  }
  const remove = (id: string) => { if (!confirm('刪除此角色？')) return; setHeroes((p: LineupHeroT[]) => p.filter(x => x.id !== id)); markDirty() }

  return (
    <div>
      {editing ? (
        <div className={cardCls + ' mb-6'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>角色名稱</label>
              <input className={inputCls} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              <label className={labelCls + ' mt-4'}>風格</label>
              <select className={inputCls} value={editing.style} onChange={e => setEditing({ ...editing, style: e.target.value })}>
                {STYLE_KEYS.map(s => <option key={s} value={s}>{styleName(s)}</option>)}
              </select>
            </div>
            <ImageUploadInput label="半身像（推薦 2:3）" value={editing.imgUrl || ''} position="50% 50%" onChange={url => setEditing({ ...editing, imgUrl: url })} onPositionChange={() => {}} previewHeight="h-48" />
          </div>
          <div className="flex gap-2 mt-4"><button className={btnPri} onClick={commit}>套用</button><button className={btnSec} onClick={() => setEditing(null)}>取消</button></div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-sm text-wiki-text-muted">共 {kindHeroes.length} 個{kind === 'hero' ? '英雄' : '豪傑'}</p>
          <button className={btnPri} onClick={start}>+ 新增{kind === 'hero' ? '英雄' : '豪傑'}</button>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {kindHeroes.map((h: LineupHeroT) => (
          <div key={h.id} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-2">
            <div className="aspect-[2/3] bg-wiki-gray rounded overflow-hidden mb-2">
              {h.imgUrl ? <img src={h.imgUrl} alt={h.name} className="w-full h-full object-cover" style={{ objectPosition: 'top' }} /> : <div className="w-full h-full flex items-center justify-center text-wiki-text-muted text-xs">無圖</div>}
            </div>
            <div className="text-sm font-bold text-wiki-text truncate">{h.name}</div>
            <div className="text-xs text-wiki-text-muted">{styleName(h.style)}</div>
            <div className="flex gap-1 mt-2">
              <button className="flex-1 text-xs py-1 bg-wiki-gray border border-wiki-border rounded hover:border-wiki-accent" onClick={() => setEditing(h)}>編輯</button>
              <button className="text-xs py-1 px-2 bg-wiki-gray border border-wiki-border rounded text-red-500 hover:border-red-500" onClick={() => remove(h.id)}>×</button>
            </div>
          </div>
        ))}
        {!kindHeroes.length && (
          <div className="text-wiki-text-muted text-sm">尚無{kind === 'hero' ? '英雄' : '豪傑'}</div>
        )}
      </div>
    </div>
  )
}

/* ───────────── 武器 / 戰徽 通用 Tab ───────────── */
function EquipTab({ kind, items, setItems, heroes, markDirty, label }: any) {
  const [editing, setEditing] = useState<any | null>(null)
  const isWeapon = kind === 'weapon'
  const parents = items.filter((x: any) => !x.parentId)

  const start = () => setEditing({ id: uid(), parentId: null, displayName: '', variantLabel: '', quality: 'gold', isExclusive: false, exclusiveHeroId: null, imgUrl: '', attrs: [] })
  const commit = () => {
    if (!editing || !editing.displayName) return
    setItems((p: any[]) => { const i = p.findIndex(x => x.id === editing.id); if (i >= 0) { const c = [...p]; c[i] = editing; return c } return [...p, editing] })
    markDirty(); setEditing(null)
  }
  const remove = (id: string) => { if (!confirm('刪除？（其變體也會受影響）')) return; setItems((p: any[]) => p.filter(x => x.id !== id && x.parentId !== id)); markDirty() }

  return (
    <div>
      {editing ? (
        <div className={cardCls + ' mb-6'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>類型</label>
              <div className="flex gap-2 mb-3">
                <button type="button" className={`px-4 py-2 rounded border text-sm ${!editing.parentId ? 'border-wiki-accent bg-wiki-accent/10 text-wiki-accent' : 'border-wiki-border text-wiki-text-muted'}`} onClick={() => setEditing({ ...editing, parentId: null, variantLabel: '' })}>父類</button>
                <button type="button" className={`px-4 py-2 rounded border text-sm ${editing.parentId !== null && editing.parentId !== undefined ? 'border-wiki-accent bg-wiki-accent/10 text-wiki-accent' : 'border-wiki-border text-wiki-text-muted'}`} onClick={() => setEditing({ ...editing, parentId: parents[0]?.id || '' })}>變體</button>
              </div>
              {editing.parentId !== null && editing.parentId !== undefined && (
                <>
                  <label className={labelCls}>父類</label>
                  <select className={inputCls + ' mb-3'} value={editing.parentId || ''} onChange={e => { const p = parents.find((x: any) => x.id === e.target.value); setEditing({ ...editing, parentId: e.target.value, displayName: editing.displayName || p?.displayName || '', quality: p?.quality || editing.quality }) }}>
                    <option value="">— 選擇父類 —</option>
                    {parents.map((p: any) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                  </select>
                  <label className={labelCls}>變體標籤</label>
                  <input className={inputCls + ' mb-3'} value={editing.variantLabel || ''} onChange={e => setEditing({ ...editing, variantLabel: e.target.value })} placeholder="如：橙品 / 專屬版" />
                </>
              )}
              <label className={labelCls}>名稱</label>
              <input className={inputCls + ' mb-3'} value={editing.displayName} onChange={e => setEditing({ ...editing, displayName: e.target.value })} />
              <label className={labelCls}>品質</label>
              <select className={inputCls} value={editing.quality} onChange={e => setEditing({ ...editing, quality: e.target.value })}>
                {QUALITY_KEYS.map(q => <option key={q} value={q}>{QUALITY_LABEL[q]}</option>)}
              </select>
              {isWeapon && (
                <div className="mt-3">
                  <label className="flex items-center gap-2 text-wiki-text mb-2"><input type="checkbox" checked={!!editing.isExclusive} onChange={e => setEditing({ ...editing, isExclusive: e.target.checked })} /> 專屬武器</label>
                  {editing.isExclusive && (
                    <select className={inputCls} value={editing.exclusiveHeroId || ''} onChange={e => setEditing({ ...editing, exclusiveHeroId: e.target.value })}>
                      <option value="">— 專屬角色 —</option>
                      {heroes.map((h: LineupHeroT) => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  )}
                </div>
              )}
            </div>
            <div>
              <ImageUploadInput label="圖標" value={editing.imgUrl || ''} position="50% 50%" onChange={url => setEditing({ ...editing, imgUrl: url })} onPositionChange={() => {}} compact objectFit="contain" />
              <p className="text-xs text-wiki-text-muted mt-4 leading-relaxed">
                💡 詞條已與{label}解綁：請到「詞條管理」維護詞條庫，配隊時在每個槽位單獨挑選。
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4"><button className={btnPri} onClick={commit}>套用</button><button className={btnSec} onClick={() => setEditing(null)}>取消</button></div>
        </div>
      ) : (
        <button className={btnPri + ' mb-4'} onClick={start}>+ 新增{label}</button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((it: any) => {
          const qc = QUALITY_COLOR[it.quality || 'gold']
          const parent = it.parentId ? items.find((x: any) => x.id === it.parentId) : null
          return (
            <div key={it.id} className="bg-wiki-gray-light border rounded-lg p-3 flex items-center gap-3" style={{ borderColor: qc + '55' }}>
              <div className="w-12 h-12 rounded bg-wiki-gray overflow-hidden flex-shrink-0 flex items-center justify-center">
                {it.imgUrl ? <img src={it.imgUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">{isWeapon ? '⚔' : '🛡'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-wiki-text truncate">{it.displayName}{it.variantLabel ? ' · ' + it.variantLabel : ''}</div>
                <div className="text-xs text-wiki-text-muted">{QUALITY_LABEL[it.quality || 'gold']}{parent ? ' · 變體(' + parent.displayName + ')' : ''}{it.isExclusive ? ' · 專屬' : ''}</div>
              </div>
              <button className={btnSec} onClick={() => setEditing({ ...it, attrs: parseArr(it.attrs) })}>編輯</button>
              <button className={btnDanger} onClick={() => remove(it.id)}>刪</button>
            </div>
          )
        })}
        {!items.length && <div className="text-wiki-text-muted text-sm">尚無{label}</div>}
      </div>
    </div>
  )
}

/* ───────────── 詞條管理 Tab（與武器/戰徽解綁的獨立詞條庫） ───────────── */
function AttrsTab({ attrs, setAttrs, markDirty }: any) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'weapon' | 'emblem'>('weapon')
  const KINDS = [{ key: 'weapon', label: '武器詞條' }, { key: 'emblem', label: '戰徽詞條' }]

  const add = () => {
    if (!name.trim()) return
    setAttrs((p: LineupAttrT[]) => [...p, { id: uid(), name: name.trim(), kind, sortOrder: p.length }])
    markDirty(); setName('')
  }
  const rename = (id: string, v: string) => { setAttrs((p: LineupAttrT[]) => p.map(a => a.id === id ? { ...a, name: v } : a)); markDirty() }
  const remove = (id: string) => { if (!confirm('刪除此詞條？（已選用它的陣容會自動忽略）')) return; setAttrs((p: LineupAttrT[]) => p.filter(a => a.id !== id)); markDirty() }

  return (
    <div className={cardCls}>
      <h3 className="font-bold text-wiki-accent mb-1">詞條管理</h3>
      <p className="text-xs text-wiki-text-muted mb-4">詞條已與武器/戰徽解綁 —— 在此維護詞條庫，配隊時每個槽位單獨挑選武器與詞條。</p>

      <div className="flex flex-wrap gap-2 items-end mb-6 pb-4 border-b border-wiki-border">
        <div>
          <label className={labelCls}>詞條類型</label>
          <select className={inputCls} value={kind} onChange={e => setKind(e.target.value as any)}>
            {KINDS.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[240px]">
          <label className={labelCls}>詞條內容</label>
          <input className={inputCls} value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add() }}
            placeholder={kind === 'weapon' ? '如：隊伍內每有一位智謀豪傑，技術+7' : '如：豪傑技術'} />
        </div>
        <button className={btnPri} onClick={add}>+ 新增詞條</button>
      </div>

      {KINDS.map(k => {
        const list = attrs.filter((a: LineupAttrT) => (a.kind || 'weapon') === k.key)
        return (
          <div key={k.key} className="mb-5">
            <h4 className="text-sm font-bold text-wiki-text mb-2">{k.label}<span className="text-wiki-text-muted font-normal">（{list.length}）</span></h4>
            <div className="space-y-2">
              {list.map((a: LineupAttrT) => (
                <div key={a.id} className="flex gap-2">
                  <input className="flex-1 bg-wiki-gray border border-wiki-border px-3 py-2 text-wiki-text text-sm" value={a.name} onChange={e => rename(a.id, e.target.value)} />
                  <button className={btnDanger} onClick={() => remove(a.id)}>刪</button>
                </div>
              ))}
              {!list.length && <div className="text-xs text-wiki-text-muted">尚無{k.label}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ───────────── 戰寵 / 異獸 Tab ───────────── */
function PetsTab({ pets, setPets, markDirty }: any) {
  const [editing, setEditing] = useState<any | null>(null)
  const start = () => setEditing({ id: uid(), name: '', kind: 'pet', quality: 'gold', imgUrl: '', attrs: [] })
  const commit = () => {
    if (!editing || !editing.name) return
    setPets((p: LineupPetT[]) => { const i = p.findIndex(x => x.id === editing.id); if (i >= 0) { const c = [...p]; c[i] = editing; return c } return [...p, editing] })
    markDirty(); setEditing(null)
  }
  const remove = (id: string) => { if (!confirm('刪除？')) return; setPets((p: LineupPetT[]) => p.filter(x => x.id !== id)); markDirty() }
  const setA = (i: number, v: string) => setEditing((e: any) => ({ ...e, attrs: e.attrs.map((a: string, idx: number) => idx === i ? v : a) }))
  const addA = () => setEditing((e: any) => ({ ...e, attrs: [...(e.attrs || []), ''] }))
  const delA = (i: number) => setEditing((e: any) => ({ ...e, attrs: e.attrs.filter((_: any, idx: number) => idx !== i) }))

  return (
    <div>
      {editing ? (
        <div className={cardCls + ' mb-6'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <label className={labelCls}>名稱</label>
              <input className={inputCls + ' mb-3'} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="如：赤炎虎" />
              <label className={labelCls}>類型</label>
              <select className={inputCls + ' mb-3'} value={editing.kind} onChange={e => setEditing({ ...editing, kind: e.target.value })}>
                <option value="pet">戰寵</option>
                <option value="beast">異獸</option>
              </select>
              <label className={labelCls}>品質</label>
              <select className={inputCls} value={editing.quality} onChange={e => setEditing({ ...editing, quality: e.target.value })}>
                {QUALITY_KEYS.map(q => <option key={q} value={q}>{QUALITY_LABEL[q]}</option>)}
              </select>
            </div>
            <div>
              <ImageUploadInput label="圖片" value={editing.imgUrl || ''} position="50% 50%" onChange={url => setEditing({ ...editing, imgUrl: url })} onPositionChange={() => {}} compact objectFit="contain" />
              <label className={labelCls + ' mt-4'}>技能 / 加成說明</label>
              {(editing.attrs || []).map((a: string, i: number) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input className="flex-1 bg-wiki-gray border border-wiki-border px-3 py-2 text-wiki-text text-sm" value={a} onChange={e => setA(i, e.target.value)} placeholder="如：出征部隊攻擊 +8%" />
                  <button className={btnDanger} onClick={() => delA(i)}>×</button>
                </div>
              ))}
              <button className={btnSec} onClick={addA}>+ 新增一條</button>
            </div>
          </div>
          <div className="flex gap-2 mt-4"><button className={btnPri} onClick={commit}>套用</button><button className={btnSec} onClick={() => setEditing(null)}>取消</button></div>
        </div>
      ) : (
        <button className={btnPri + ' mb-4'} onClick={start}>+ 新增戰寵/異獸</button>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {pets.map((p: LineupPetT) => (
          <div key={p.id} className="bg-wiki-gray-light border rounded-lg p-2" style={{ borderColor: (QUALITY_COLOR[p.quality || 'gold']) + '55' }}>
            <div className="aspect-square bg-wiki-gray rounded overflow-hidden mb-2 flex items-center justify-center">
              {p.imgUrl ? <img src={p.imgUrl} alt={p.name} className="w-full h-full object-contain" /> : <span className="text-2xl">🐾</span>}
            </div>
            <div className="text-sm font-bold text-wiki-text truncate">{p.name}</div>
            <div className="text-xs text-wiki-text-muted">{p.kind === 'beast' ? '異獸' : '戰寵'} · {QUALITY_LABEL[p.quality || 'gold']}</div>
            <div className="flex gap-1 mt-2">
              <button className="flex-1 text-xs py-1 bg-wiki-gray border border-wiki-border rounded hover:border-wiki-accent" onClick={() => setEditing({ ...p, attrs: parseArr(p.attrs) })}>編輯</button>
              <button className="text-xs py-1 px-2 bg-wiki-gray border border-wiki-border rounded text-red-500 hover:border-red-500" onClick={() => remove(p.id)}>×</button>
            </div>
          </div>
        ))}
        {!pets.length && <div className="text-wiki-text-muted text-sm">尚無戰寵/異獸</div>}
      </div>
    </div>
  )
}

/* ───────────── 英雄裝備 Tab（6 部位） ───────────── */
function HeroEquipsTab({ heroEquips, setHeroEquips, equipSets, markDirty }: any) {
  const [editing, setEditing] = useState<any | null>(null)
  const start = () => setEditing({ id: uid(), name: '', slotIndex: 1, quality: 'gold', imgUrl: '', setId: '', attrs: [] })
  const commit = () => {
    if (!editing || !editing.name) return
    setHeroEquips((p: LineupHeroEquipT[]) => { const i = p.findIndex(x => x.id === editing.id); if (i >= 0) { const c = [...p]; c[i] = editing; return c } return [...p, editing] })
    markDirty(); setEditing(null)
  }
  const remove = (id: string) => { if (!confirm('刪除？')) return; setHeroEquips((p: LineupHeroEquipT[]) => p.filter(x => x.id !== id)); markDirty() }
  const setA = (i: number, v: string) => setEditing((e: any) => ({ ...e, attrs: e.attrs.map((a: string, idx: number) => idx === i ? v : a) }))
  const addA = () => setEditing((e: any) => ({ ...e, attrs: [...(e.attrs || []), ''] }))
  const delA = (i: number) => setEditing((e: any) => ({ ...e, attrs: e.attrs.filter((_: any, idx: number) => idx !== i) }))

  return (
    <div>
      {editing ? (
        <div className={cardCls + ' mb-6'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <label className={labelCls}>裝備名稱</label>
              <input className={inputCls + ' mb-3'} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              <label className={labelCls}>部位</label>
              <select className={inputCls + ' mb-3'} value={editing.slotIndex} onChange={e => setEditing({ ...editing, slotIndex: parseInt(e.target.value) })}>
                {HERO_EQUIP_SLOTS.map(s => <option key={s.index} value={s.index}>{s.index}. {s.label}</option>)}
              </select>
              <label className={labelCls}>品質</label>
              <select className={inputCls + ' mb-3'} value={editing.quality} onChange={e => setEditing({ ...editing, quality: e.target.value })}>
                {QUALITY_KEYS.map(q => <option key={q} value={q}>{QUALITY_LABEL[q]}</option>)}
              </select>
              <label className={labelCls}>所屬套裝（選填）</label>
              <select className={inputCls} value={editing.setId || ''} onChange={e => setEditing({ ...editing, setId: e.target.value })}>
                <option value="">— 無套裝 —</option>
                {equipSets.map((s: LineupEquipSetT) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <ImageUploadInput label="圖標" value={editing.imgUrl || ''} position="50% 50%" onChange={url => setEditing({ ...editing, imgUrl: url })} onPositionChange={() => {}} compact objectFit="contain" />
              <label className={labelCls + ' mt-4'}>屬性 / 詞條</label>
              {(editing.attrs || []).map((a: string, i: number) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input className="flex-1 bg-wiki-gray border border-wiki-border px-3 py-2 text-wiki-text text-sm" value={a} onChange={e => setA(i, e.target.value)} placeholder="如：攻擊 +120" />
                  <button className={btnDanger} onClick={() => delA(i)}>×</button>
                </div>
              ))}
              <button className={btnSec} onClick={addA}>+ 新增一條</button>
            </div>
          </div>
          <div className="flex gap-2 mt-4"><button className={btnPri} onClick={commit}>套用</button><button className={btnSec} onClick={() => setEditing(null)}>取消</button></div>
        </div>
      ) : (
        <button className={btnPri + ' mb-4'} onClick={start}>+ 新增英雄裝備</button>
      )}
      {HERO_EQUIP_SLOTS.map(slot => {
        const list = heroEquips.filter((e: LineupHeroEquipT) => (e.slotIndex ?? 1) === slot.index)
        return (
          <div key={slot.index} className="mb-5">
            <h4 className="text-sm font-bold text-wiki-text mb-2">{slot.index}. {slot.label}<span className="text-wiki-text-muted font-normal">（{list.length}）</span></h4>
            <div className="flex flex-wrap gap-2">
              {list.map((e: LineupHeroEquipT) => {
                const set = equipSets.find((s: LineupEquipSetT) => s.id === e.setId)
                return (
                  <div key={e.id} className="flex items-center gap-2 bg-wiki-gray-light border rounded-lg p-2" style={{ borderColor: (QUALITY_COLOR[e.quality || 'gold']) + '55' }}>
                    <div className="w-9 h-9 rounded bg-wiki-gray overflow-hidden flex items-center justify-center flex-shrink-0">
                      {e.imgUrl ? <img src={e.imgUrl} alt={e.name} className="w-full h-full object-contain" /> : <span>🛡</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-wiki-text truncate">{e.name}</div>
                      <div className="text-xs text-wiki-text-muted">{QUALITY_LABEL[e.quality || 'gold']}{set ? ' · ' + set.name : ''}</div>
                    </div>
                    <button className={btnSec} onClick={() => setEditing({ ...e, attrs: parseArr(e.attrs) })}>編輯</button>
                    <button className={btnDanger} onClick={() => remove(e.id)}>刪</button>
                  </div>
                )
              })}
              {!list.length && <div className="text-xs text-wiki-text-muted">尚無</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ───────────── 套裝 Tab（加成 + 適配流派） ───────────── */
function EquipSetsTab({ equipSets, setEquipSets, genres, markDirty }: any) {
  const [editing, setEditing] = useState<any | null>(null)
  const start = () => setEditing({ id: uid(), name: '', imgUrl: '', bonus: [], genreIds: [] })
  const commit = () => {
    if (!editing || !editing.name) return
    setEquipSets((p: LineupEquipSetT[]) => { const i = p.findIndex(x => x.id === editing.id); if (i >= 0) { const c = [...p]; c[i] = editing; return c } return [...p, editing] })
    markDirty(); setEditing(null)
  }
  const remove = (id: string) => { if (!confirm('刪除此套裝？')) return; setEquipSets((p: LineupEquipSetT[]) => p.filter(x => x.id !== id)); markDirty() }
  const setB = (i: number, v: string) => setEditing((e: any) => ({ ...e, bonus: e.bonus.map((b: string, idx: number) => idx === i ? v : b) }))
  const addB = () => setEditing((e: any) => ({ ...e, bonus: [...(e.bonus || []), ''] }))
  const delB = (i: number) => setEditing((e: any) => ({ ...e, bonus: e.bonus.filter((_: any, idx: number) => idx !== i) }))
  const toggleGenre = (gid: string) => setEditing((e: any) => {
    const cur: string[] = parseArr(e.genreIds)
    return { ...e, genreIds: cur.includes(gid) ? cur.filter(x => x !== gid) : [...cur, gid] }
  })

  return (
    <div>
      {editing ? (
        <div className={cardCls + ' mb-6'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <label className={labelCls}>套裝名稱</label>
              <input className={inputCls + ' mb-3'} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="如：狂暴之怒" />
              <label className={labelCls}>適配流派 <span className="normal-case font-normal text-wiki-text-muted">（可多選）</span></label>
              <div className="flex flex-wrap gap-2">
                {genres.map((g: LineupGenreT) => {
                  const sel = parseArr<string>(editing.genreIds).includes(g.id)
                  return (
                    <button key={g.id} type="button" onClick={() => toggleGenre(g.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${sel ? 'border-wiki-accent bg-wiki-accent/10 text-wiki-accent' : 'border-wiki-border text-wiki-text-muted'}`}>
                      <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />{g.name}
                    </button>
                  )
                })}
                {!genres.length && <span className="text-xs text-wiki-text-muted">尚無流派，請先到「流派管理」新增</span>}
              </div>
            </div>
            <div>
              <ImageUploadInput label="套裝圖標（選填）" value={editing.imgUrl || ''} position="50% 50%" onChange={url => setEditing({ ...editing, imgUrl: url })} onPositionChange={() => {}} compact objectFit="contain" />
              <label className={labelCls + ' mt-4'}>套裝額外加成</label>
              {(editing.bonus || []).map((b: string, i: number) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input className="flex-1 bg-wiki-gray border border-wiki-border px-3 py-2 text-wiki-text text-sm" value={b} onChange={e => setB(i, e.target.value)} placeholder="如：集滿 4 件：暴擊率 +10%" />
                  <button className={btnDanger} onClick={() => delB(i)}>×</button>
                </div>
              ))}
              <button className={btnSec} onClick={addB}>+ 新增加成</button>
            </div>
          </div>
          <div className="flex gap-2 mt-4"><button className={btnPri} onClick={commit}>套用</button><button className={btnSec} onClick={() => setEditing(null)}>取消</button></div>
        </div>
      ) : (
        <button className={btnPri + ' mb-4'} onClick={start}>+ 新增套裝</button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {equipSets.map((s: LineupEquipSetT) => (
          <div key={s.id} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded bg-wiki-gray overflow-hidden flex items-center justify-center flex-shrink-0">
                {s.imgUrl ? <img src={s.imgUrl} alt={s.name} className="w-full h-full object-contain" /> : <span>✨</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-wiki-text truncate">{s.name}</div>
                <div className="text-xs text-wiki-text-muted truncate">
                  適配：{parseArr<string>(s.genreIds).map(id => genres.find((g: LineupGenreT) => g.id === id)?.name).filter(Boolean).join('、') || '未設定'}
                </div>
              </div>
              <button className={btnSec} onClick={() => setEditing({ ...s, bonus: parseArr(s.bonus), genreIds: parseArr(s.genreIds) })}>編輯</button>
              <button className={btnDanger} onClick={() => remove(s.id)}>刪</button>
            </div>
            {parseArr<string>(s.bonus).map((b, i) => <div key={i} className="text-xs text-wiki-accent">· {b}</div>)}
          </div>
        ))}
        {!equipSets.length && <div className="text-wiki-text-muted text-sm">尚無套裝</div>}
      </div>
    </div>
  )
}

/* ───────────── 流派 Tab ───────────── */
function GenresTab({ genres, setGenres, markDirty }: any) {
  const [editing, setEditing] = useState<LineupGenreT | null>(null)
  const start = () => setEditing({ id: uid(), name: '', color: '#C9A227', imgUrl: '' })
  const commit = () => {
    if (!editing || !editing.name) return
    setGenres((p: LineupGenreT[]) => { const i = p.findIndex(x => x.id === editing.id); if (i >= 0) { const c = [...p]; c[i] = editing; return c } return [...p, editing] })
    markDirty(); setEditing(null)
  }
  const remove = (id: string) => { if (!confirm('刪除此流派？')) return; setGenres((p: LineupGenreT[]) => p.filter(x => x.id !== id)); markDirty() }
  return (
    <div>
      {editing ? (
        <div className={cardCls + ' mb-6'}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div><label className={labelCls}>流派名稱</label><input className={inputCls} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="如：飛車黨" /></div>
            <div><label className={labelCls}>代表色</label><input type="color" className="w-full h-12 bg-wiki-gray border border-wiki-border" value={editing.color} onChange={e => setEditing({ ...editing, color: e.target.value })} /></div>
            <ImageUploadInput label="流派圖標（選填）" value={editing.imgUrl || ''} position="50% 50%" onChange={url => setEditing({ ...editing, imgUrl: url })} onPositionChange={() => {}} compact objectFit="contain" />
          </div>
          <div className="flex gap-2 mt-4"><button className={btnPri} onClick={commit}>套用</button><button className={btnSec} onClick={() => setEditing(null)}>取消</button></div>
        </div>
      ) : (
        <button className={btnPri + ' mb-4'} onClick={start}>+ 新增流派</button>
      )}
      <div className="flex flex-wrap gap-3">
        {genres.map((g: LineupGenreT) => (
          <div key={g.id} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-3 flex items-center gap-3">
            <span className="w-4 h-4 rounded-full" style={{ background: g.color }} />
            <span className="font-bold text-wiki-text">{g.name}</span>
            <button className={btnSec} onClick={() => setEditing(g)}>編輯</button>
            <button className={btnDanger} onClick={() => remove(g.id)}>刪</button>
          </div>
        ))}
        {!genres.length && <div className="text-wiki-text-muted text-sm">尚無流派</div>}
      </div>
    </div>
  )
}

/* ───────────── 配置 Tab ───────────── */
function ConfigTab({ section, config, setConfig, markDirty }: any) {
  // ⚠️ 必須用函數式更新：圖片上傳是異步回調，若基於閉包裡的舊 config 計算，
  // 連續上傳多張時後一次會覆蓋前一次，導致已上傳的圖片消失。
  const upd = (fn: (c: LineupConfigT) => Partial<LineupConfigT>) => {
    setConfig((c: LineupConfigT) => ({ ...c, ...fn(c) }))
    markDirty()
  }
  const [newBadge, setNewBadge] = useState<BadgeT>({ id: '', name: '', color: '#C9A227', bg: '#1A1408', imgUrl: '' })

  const setStyleName = (k: string, v: string) => upd(c => ({ styleNames: { ...c.styleNames, [k]: v } }))
  const setStyleIcon = (s: string, url: string) => upd(c => ({ styleIcons: (c.styleIcons || []).map((x: any) => x.style === s ? { ...x, imgUrl: url } : x) }))
  const setStatName = (k: string, v: string) => upd(c => ({ statNames: { ...c.statNames, [k]: v } }))
  const setStatIcon = (k: string, url: string) => upd(c => ({ statIcons: (c.statIcons || []).map((x: any) => x.key === k ? { ...x, imgUrl: url } : x) }))
  const setBadgeImg = (id: string, url: string) => upd(c => ({ badges: (c.badges || []).map(b => b.id === id ? { ...b, imgUrl: url } : b) }))
  const addBadge = () => { if (!newBadge.name) return; upd(c => ({ badges: [...(c.badges || []), { ...newBadge, id: uid(), builtIn: false }] })); setNewBadge({ id: '', name: '', color: '#C9A227', bg: '#1A1408', imgUrl: '' }) }
  const delBadge = (id: string) => upd(c => ({ badges: (c.badges || []).filter((b: BadgeT) => b.id !== id) }))

  // 風格圖標
  if (section === 'styleicons') {
    return (
      <div className={cardCls}>
        <h3 className="font-bold text-wiki-accent mb-1">風格圖標</h3>
        <p className="text-xs text-wiki-text-muted mb-4">為 4 種風格各自設定顯示名稱與圖標（推薦 80×80 圓形透明 PNG），豪傑會自動套用。</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STYLE_KEYS.map(s => {
            const si = (config.styleIcons || []).find((x: any) => x.style === s)
            return (
              <div key={s}>
                <label className={labelCls}>{s} <span className="normal-case font-normal text-wiki-text-muted">顯示名</span></label>
                <input className={inputCls + ' mb-2'} value={config.styleNames?.[s] || ''} onChange={e => setStyleName(s, e.target.value)} placeholder={s} />
                <ImageUploadInput label={'圖標 ' + STYLE_DEFAULT_ICON[s]} value={si?.imgUrl || ''} position="50% 50%" onChange={url => setStyleIcon(s, url)} onPositionChange={() => {}} compact objectFit="contain" />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 加點圖標
  if (section === 'staticons') {
    return (
      <div className={cardCls}>
        <h3 className="font-bold text-wiki-accent mb-1">加點圖標</h3>
        <p className="text-xs text-wiki-text-muted mb-4">5 條加點軸的顯示名稱與圖標（推薦 60×60 透明 PNG）。</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {STAT_KEYS.map(k => {
            const si = (config.statIcons || []).find((x: any) => x.key === k)
            return (
              <div key={k}>
                <label className={labelCls}>{STAT_DEFAULT_NAME[k]} <span className="normal-case font-normal text-wiki-text-muted">顯示名</span></label>
                <input className={inputCls + ' mb-2'} value={config.statNames?.[k] || ''} onChange={e => setStatName(k, e.target.value)} placeholder={STAT_DEFAULT_NAME[k]} />
                <ImageUploadInput label={'圖標 ' + STAT_DEFAULT_ICON[k]} value={si?.imgUrl || ''} position="50% 50%" onChange={url => setStatIcon(k, url)} onPositionChange={() => {}} compact objectFit="contain" />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 標籤管理
  return (
    <div className={cardCls}>
      <h3 className="font-bold text-wiki-accent mb-1">標籤管理</h3>
      <p className="text-xs text-wiki-text-muted mb-4">HOT / NEW / 推薦 為內建樣式，不可刪除。自訂標籤可設定文字色、底色，或上傳圖片（有圖片時優先顯示圖片，推薦高度 22px）。</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {(config.badges || []).map((b: BadgeT) => (
          <div key={b.id} className="border border-wiki-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {b.imgUrl
                  ? <img src={b.imgUrl} alt={b.name} className="h-5 max-w-[80px] object-contain" />
                  : <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded" style={badgeStyle(b)}>{b.name}</span>}
                <span className="text-sm text-wiki-text">{b.name}</span>
              </div>
              {b.builtIn
                ? <span className="text-[10px] text-wiki-accent border border-wiki-accent px-1.5 py-0.5 rounded">內建</span>
                : <button className={btnDanger} onClick={() => delBadge(b.id)}>刪除</button>}
            </div>
            {!b.builtIn && (
              <ImageUploadInput label="標籤圖片（選填）" value={b.imgUrl || ''} position="50% 50%" onChange={url => setBadgeImg(b.id, url)} onPositionChange={() => {}} compact objectFit="contain" />
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-wiki-border pt-4">
        <h4 className="text-sm font-bold text-wiki-text mb-3">新增自訂標籤</h4>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className={labelCls}>標籤名</label>
            <input className={inputCls} value={newBadge.name} onChange={e => setNewBadge({ ...newBadge, name: e.target.value })} placeholder="如：限時" />
          </div>
          <div>
            <label className={labelCls}>文字色</label>
            <input type="color" className="w-20 h-12 bg-wiki-gray border border-wiki-border" value={newBadge.color} onChange={e => setNewBadge({ ...newBadge, color: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>底色</label>
            <input type="color" className="w-20 h-12 bg-wiki-gray border border-wiki-border" value={newBadge.bg} onChange={e => setNewBadge({ ...newBadge, bg: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>預覽</label>
            <span className="inline-block text-[10px] font-bold tracking-widest px-2 py-1 rounded" style={badgeStyle({ ...newBadge, id: 'preview' })}>{newBadge.name || '標籤'}</span>
          </div>
          <button className={btnPri} onClick={addBadge}>+ 新增標籤</button>
        </div>
      </div>
    </div>
  )
}
