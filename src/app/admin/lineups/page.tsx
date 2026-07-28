'use client'

export const runtime = 'edge'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ImageUploadInput from '@/components/ImageUploadInput'
import RichTextEditor from '@/components/RichTextEditor'
import {
  QUALITY_COLOR, QUALITY_LABEL, QUALITY_KEYS, STYLE_KEYS, STYLE_DEFAULT_ICON,
  STAT_KEYS, STAT_DEFAULT_NAME, STAT_DEFAULT_ICON, ROLE_KEYS, BUILTIN_BADGES,
  parseArr, uid, defaultConfig, badgeStyle,
  type LineupT, type LineupHeroT, type LineupWeaponT, type LineupEmblemT,
  type LineupGenreT, type LineupConfigT, type BadgeT, type LineupSlotT,
} from '@/lib/lineup'

const cardCls = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'
const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none'
const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'
const btnPri = 'px-5 py-2.5 bg-wiki-accent text-black font-bold rounded hover:opacity-90 disabled:opacity-50'
const btnSec = 'px-4 py-2 bg-wiki-gray border border-wiki-border text-wiki-text rounded hover:border-wiki-accent'
const btnDanger = 'px-3 py-1.5 text-sm bg-wiki-gray border border-wiki-border text-red-500 rounded hover:border-red-500'

type Tab = 'lineups' | 'heroes' | 'styleicons' | 'badges' | 'staticons' | 'weapons' | 'emblems' | 'genres'

// 對照線下工具的側邊欄 8 項
const TABS: { key: Tab; label: string }[] = [
  { key: 'lineups', label: '陣容搭配' },
  { key: 'heroes', label: '豪傑管理' },
  { key: 'styleicons', label: '風格圖標' },
  { key: 'badges', label: '標籤管理' },
  { key: 'staticons', label: '加點圖標' },
  { key: 'weapons', label: '武器管理' },
  { key: 'emblems', label: '戰徽管理' },
  { key: 'genres', label: '流派管理' },
]

export default function LineupsAdminPage() {
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
        heroes, weapons, emblems, genres, config,
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
            <h1 className="text-xl font-bold text-wiki-accent">陣容搭配（豪傑）</h1>
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
          <LineupsTab {...{ lineups, setLineups, heroes, weapons, emblems, genres, config, setConfig, markDirty, styleName, statName, weaponLabel, emblemLabel }} />
        )}
        {tab === 'heroes' && (
          <HeroesTab {...{ heroes, setHeroes, config, markDirty, styleName }} />
        )}
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

/* ───────────── 陣容 Tab ───────────── */
function LineupsTab({ lineups, setLineups, heroes, weapons, emblems, genres, config, setConfig, markDirty, styleName, statName, weaponLabel, emblemLabel }: any) {
  const [editing, setEditing] = useState<LineupT | null>(null)

  // 全域配置（函數式更新，避免異步/連續修改互相覆蓋）
  const updCfg = (fn: (c: LineupConfigT) => Partial<LineupConfigT>) => {
    setConfig((c: LineupConfigT) => ({ ...c, ...fn(c) }))
    markDirty()
  }
  const setPage = (patch: any) => updCfg(c => ({ pageConfig: { ...c.pageConfig, ...patch } }))
  const setRole = (r: string, patch: any) => updCfg(c => ({ roleLabels: { ...c.roleLabels, [r]: { ...(c.roleLabels as any)[r], ...patch } } }))

  const blankSlots = (): LineupSlotT[] => ROLE_KEYS.map(r => ({ role: r }))
  const newLineup = (): LineupT => ({ id: uid(), title: '', characterKind: 'haojie', badgeIds: [], slots: blankSlots(), isPublished: true, isPinned: false, sortOrder: lineups.length })

  const startNew = () => setEditing(newLineup())
  const edit = (l: LineupT) => setEditing({ ...l, badgeIds: parseArr(l.badgeIds), slots: (parseArr(l.slots).length ? parseArr(l.slots) : blankSlots()) as LineupSlotT[] })

  const commit = () => {
    if (!editing) return
    setLineups((prev: LineupT[]) => {
      const i = prev.findIndex(x => x.id === editing.id)
      if (i >= 0) { const c = [...prev]; c[i] = editing; return c }
      return [...prev, editing]
    })
    markDirty(); setEditing(null)
  }
  const remove = (id: string) => { if (!confirm('確定刪除此陣容？')) return; setLineups((p: LineupT[]) => p.filter(x => x.id !== id)); markDirty() }

  const setSlot = (role: string, patch: Partial<LineupSlotT>) => {
    setEditing((e: LineupT | null) => {
      if (!e) return e
      const slots = (e.slots as LineupSlotT[]).map(s => s.role === role ? { ...s, ...patch } : s)
      return { ...e, slots }
    })
  }
  const toggleBadge = (bid: string) => setEditing((e: any) => {
    if (!e) return e
    const cur: string[] = parseArr(e.badgeIds)
    return { ...e, badgeIds: cur.includes(bid) ? cur.filter(x => x !== bid) : [...cur, bid] }
  })

  if (editing) {
    const slots = editing.slots as LineupSlotT[]
    const badgeIds: string[] = parseArr(editing.badgeIds)
    return (
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-wiki-text">{lineups.find((x: LineupT) => x.id === editing.id) ? '編輯陣容' : '新增陣容'}</h2>
          <div className="flex gap-2"><button className={btnSec} onClick={() => setEditing(null)}>取消</button><button className={btnPri} onClick={commit}>套用</button></div>
        </div>

        {/* ▸ 選擇豪傑 & 各自加點（對照線下工具：立繪預覽 + 角色 + 加點） */}
        <div className="text-sm font-bold text-wiki-accent mb-3">▸ 選擇豪傑 &amp; 各自加點</div>
        <div className="flex flex-wrap gap-4 mb-6">
          {ROLE_KEYS.map((role, idx) => {
            const s = slots.find(x => x.role === role)!
            const hero = heroes.find((h: LineupHeroT) => h.id === s.heroId)
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
                  {heroes.map((h: LineupHeroT) => <option key={h.id} value={h.id}>{h.name}</option>)}
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

        {/* ▸ 選擇裝備（6 個下拉，對照線下工具佈局） */}
        <div className="text-sm font-bold text-wiki-accent mb-3">▸ 選擇裝備</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {ROLE_KEYS.map((role, idx) => {
            const s = slots.find(x => x.role === role)!
            const prefix = idx === 0 ? '主力' : '輔助' + idx
            return [
              <div key={role + '-w'}>
                <label className={labelCls}>{prefix}武器</label>
                <select className={inputCls} value={s.weaponId || ''} onChange={e => setSlot(role, { weaponId: e.target.value })}>
                  <option value="">— 武器 —</option>
                  {weapons.map((w: LineupWeaponT) => <option key={w.id} value={w.id}>{weaponLabel(w)}</option>)}
                </select>
              </div>,
              <div key={role + '-e'}>
                <label className={labelCls}>{prefix}戰徽</label>
                <select className={inputCls} value={s.emblemId || ''} onChange={e => setSlot(role, { emblemId: e.target.value })}>
                  <option value="">— 戰徽 —</option>
                  {emblems.map((em: LineupEmblemT) => <option key={em.id} value={em.id}>{emblemLabel(em)}</option>)}
                </select>
              </div>,
            ]
          })}
        </div>

        {/* ▸ 陣容資訊 */}
        <div className="text-sm font-bold text-wiki-accent mb-3">▸ 陣容資訊</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>陣容標題</label>
            <input className={inputCls} value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="如：飛車流強力組合" />
          </div>
          <div>
            <label className={labelCls}>適配流派</label>
            <select className={inputCls} value={editing.genreId || ''} onChange={e => setEditing({ ...editing, genreId: e.target.value })}>
              <option value="">— 流派 —</option>
              {genres.map((g: LineupGenreT) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>更新日期文字 <span className="normal-case font-normal text-wiki-text-muted">（右上角展示，如 2026/07）</span></label>
            <input className={inputCls} value={editing.updateText || ''} onChange={e => setEditing({ ...editing, updateText: e.target.value })} placeholder="選填" />
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
            onChange={url => setEditing({ ...editing, bgUrl: url })} onPositionChange={() => {}} previewHeight="h-40" />
        </div>

        <div className="mb-4">
          <label className={labelCls}>陣容介紹（解說）</label>
          <RichTextEditor value={editing.description || ''} onChange={html => setEditing({ ...editing, description: html })} placeholder="陣容說明、技能聯動、打法建議..." />
        </div>

        <div className="flex flex-wrap gap-6 items-center">
          <label className="flex items-center gap-2 text-wiki-text"><input type="checkbox" checked={!!editing.isPinned} onChange={e => setEditing({ ...editing, isPinned: e.target.checked })} /> 置頂</label>
          <label className="flex items-center gap-2 text-wiki-text"><input type="checkbox" checked={editing.isPublished !== false} onChange={e => setEditing({ ...editing, isPublished: e.target.checked })} /> 發佈</label>
          <div className="flex items-center gap-2 text-wiki-text"><span>排序</span><input type="number" className="w-20 bg-wiki-gray border border-wiki-border px-2 py-1" value={editing.sortOrder ?? 0} onChange={e => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} /></div>
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
          <div><label className={labelCls}>主標題</label><input className={inputCls} value={config.pageConfig?.title || ''} onChange={e => setPage({ title: e.target.value })} placeholder="豪傑最強陣容" /></div>
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
        <p className="text-sm text-wiki-text-muted">共 {lineups.length} 套陣容 · 修改後記得點右上「保存全部」</p>
        <button className={btnPri} onClick={startNew}>+ 新增陣容</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {lineups.map((l: LineupT) => {
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
        {!lineups.length && <div className="text-wiki-text-muted text-sm">尚無陣容</div>}
      </div>
    </div>
  )
}

/* ───────────── 角色池 Tab ───────────── */
function HeroesTab({ heroes, setHeroes, config, markDirty, styleName }: any) {
  const [editing, setEditing] = useState<LineupHeroT | null>(null)
  const start = () => setEditing({ id: uid(), name: '', style: '迅捷', imgUrl: '', characterKind: 'haojie' })
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
        <button className={btnPri + ' mb-4'} onClick={start}>+ 新增角色</button>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {heroes.map((h: LineupHeroT) => (
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
        {!heroes.length && <div className="text-wiki-text-muted text-sm">尚無角色</div>}
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
  const setAttr = (idx: number, v: string) => setEditing((e: any) => ({ ...e, attrs: e.attrs.map((a: string, i: number) => i === idx ? v : a) }))
  const addAttr = () => setEditing((e: any) => ({ ...e, attrs: [...(e.attrs || []), ''] }))
  const delAttr = (idx: number) => setEditing((e: any) => ({ ...e, attrs: e.attrs.filter((_: any, i: number) => i !== idx) }))

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
              <ImageUploadInput label="圖標" value={editing.imgUrl || ''} position="50% 50%" onChange={url => setEditing({ ...editing, imgUrl: url })} onPositionChange={() => {}} compact />
              <label className={labelCls + ' mt-4'}>{isWeapon ? '武器技能 / 詞條' : '戰徽詞條'}</label>
              {(editing.attrs || []).map((a: string, i: number) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input className="flex-1 bg-wiki-gray border border-wiki-border px-3 py-2 text-wiki-text" value={a} onChange={e => setAttr(i, e.target.value)} placeholder={isWeapon ? '如：隊伍每有一位智謀豪傑，技術+7' : '如：豪傑技術'} />
                  <button className={btnDanger} onClick={() => delAttr(i)}>×</button>
                </div>
              ))}
              <button className={btnSec} onClick={addAttr}>+ 新增一條</button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div><label className={labelCls}>流派名稱</label><input className={inputCls} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="如：飛車黨" /></div>
            <div><label className={labelCls}>代表色</label><input type="color" className="w-full h-12 bg-wiki-gray border border-wiki-border" value={editing.color} onChange={e => setEditing({ ...editing, color: e.target.value })} /></div>
            <ImageUploadInput label="流派圖標（選填）" value={editing.imgUrl || ''} position="50% 50%" onChange={url => setEditing({ ...editing, imgUrl: url })} onPositionChange={() => {}} compact />
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
