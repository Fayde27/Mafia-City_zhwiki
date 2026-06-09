'use client'

export const runtime = 'edge'

import { useState, useEffect, useRef } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter, useParams } from 'next/navigation'
import ImageUploadInput from '@/components/ImageUploadInput'
import RichTextEditor from '@/components/RichTextEditor'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HaojieCategory { id: string; name: string; slug: string }
interface CharacterOption { id: string; name: string; avatar?: string }

interface SkillEntry {
  icon: string; type: string; name: string; effect: string; multiplier: string
}
interface TeamCompEntry {
  name: string; memberIds: string[]; reason: string
}
interface HaojieEquip {
  weapon: string; warbadge: string
}

const SECTIONS = [
  { id: 'basic', label: '基本信息' },
  { id: 'images', label: '圖片上傳' },
  { id: 'attributes', label: '豪杰屬性' },
  { id: 'skills', label: '豪杰技能' },
  { id: 'equipment', label: '裝備推薦' },
  { id: 'teamcomp', label: '配隊推薦' },
  { id: 'story', label: '黑道傳聞' },
]

const RARITY_OPTIONS = ['金', '紫']
const HAOJIE_STYLES = ['無畏風格', '迅捷風格', '智謀風格', '穩固風格']
const TROOP_TYPES = ['暴徒', '槍手', '飛車黨', '改裝車輛']
const SKILL_TYPES = ['帶隊生效', '被動生效']

// ─── 5-axis Radar ─────────────────────────────────────────────────────────────

function Radar5SVG({ attrs, size, r }: { attrs: any; size: number; r: number }) {
  const cx = size / 2, cy = size / 2
  const labels = ['力量', '技術', '體魄', '防護', '速度']
  const angles = labels.map((_, i) => (Math.PI * 2 * i) / 5 - Math.PI / 2)
  const toXY = (angle: number, radius: number) => ({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) })
  const baseVals = [attrs?.strengthBase, attrs?.techBase, attrs?.physBase, attrs?.defBase, attrs?.speedBase].map(Number)
  const maxVals  = [attrs?.strengthMax,  attrs?.techMax,  attrs?.physMax,  attrs?.defMax,  attrs?.speedMax ].map(Number)
  const globalMax = 100
  const polyPoints = (vals: number[]) => vals.map((v, i) => { const p = toXY(angles[i], (v / globalMax) * r); return `${p.x},${p.y}` }).join(' ')
  return (
    <svg width={size} height={size}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={angles.map(a => { const p = toXY(a, r * f); return `${p.x},${p.y}` }).join(' ')} fill="none" stroke="#4b5563" strokeWidth="1" />
      ))}
      {angles.map((a, i) => { const o = toXY(a, r); return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="#4b5563" strokeWidth="1" /> })}
      {baseVals.some(v => v > 0) && <polygon points={polyPoints(baseVals)} fill="rgba(59,130,246,0.3)" stroke="#3b82f6" strokeWidth="1.5" />}
      {maxVals.some(v => v > 0) && <polygon points={polyPoints(maxVals)} fill="rgba(212,175,55,0.25)" stroke="#d4af37" strokeWidth="1.5" />}
      {labels.map((label, i) => { const p = toXY(angles[i], r + (size > 200 ? 20 : 15)); return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={size > 200 ? 13 : 10} fill="#d1b27a" fontWeight="bold">{label}</text> })}
    </svg>
  )
}

function RadarPreview({ attrs }: { attrs: any }) {
  return <div className="mx-auto w-fit"><Radar5SVG attrs={attrs} size={180} r={64} /></div>
}

// ─── Skill icon input ─────────────────────────────────────────────────────────

function SkillIconInput({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const activeRef = useRef(false)

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!activeRef.current) return
      const items = e.clipboardData ? Array.from(e.clipboardData.items) : []
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) upload(file)
          return
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) onChange(data.url)
      else alert(data.error || '上傳失敗')
    } catch { alert('網絡錯誤') }
    setUploading(false)
  }

  return (
    <div className="flex gap-2 items-center"
      onMouseEnter={() => { activeRef.current = true }}
      onMouseLeave={() => { activeRef.current = false }}>
      {value ? (
        <img src={value} alt="icon" className="w-10 h-10 object-contain rounded border border-wiki-border flex-shrink-0 bg-wiki-gray" />
      ) : (
        <div className="w-10 h-10 rounded border border-dashed border-wiki-border flex-shrink-0 bg-wiki-gray flex items-center justify-center text-wiki-text-muted text-lg">
          {uploading ? '…' : '?'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <input className="w-full bg-wiki-gray-light border border-wiki-border px-2 py-1.5 text-xs text-wiki-text focus:border-wiki-accent focus:outline-none mb-1"
          value={value} placeholder="URL 或懸停後 Ctrl+V 貼圖"
          onChange={e => onChange(e.target.value)} />
        <div className="flex gap-1">
          <button type="button" disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="text-xs px-2 py-1 bg-wiki-gray border border-wiki-border text-wiki-text-muted hover:border-wiki-accent hover:text-wiki-text disabled:opacity-50">
            {uploading ? '上傳中…' : '選擇文件'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')}
              className="text-xs px-2 py-1 bg-wiki-gray border border-wiki-border text-wiki-text-muted hover:border-red-500 hover:text-red-400">
              清除
            </button>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
    </div>
  )
}

function tryParse(val: any, fallback: any) {
  if (!val) return fallback
  if (typeof val !== 'string') return val
  try { return JSON.parse(val) } catch { return fallback }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminHaojieEditPage() {
  const router = useRouter()
  const params = useParams()
  const rawId = params?.id as string
  const haojieId = rawId === 'new' ? '' : rawId
  const { isAdmin, isLoaded } = useAdminAuth()

  const [categories, setCategories] = useState<HaojieCategory[]>([])
  const [allHaojie, setAllHaojie] = useState<CharacterOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('basic')
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Basic fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [rarity, setRarity] = useState('金')
  const [traits, setTraits] = useState<string[]>([])
  const [troopType, setTroopType] = useState('')
  const [acquisition, setAcquisition] = useState('')
  const [awakenHero, setAwakenHero] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isPublished, setIsPublished] = useState(true)

  // Images
  const [avatar, setAvatar] = useState('')
  const [avatarPosition, setAvatarPosition] = useState('50% 50%')
  const [banner, setBanner] = useState('')
  const [bannerPosition, setBannerPosition] = useState('50% 50%')

  // 5-axis Attributes
  const [attrs, setAttrs] = useState({
    strengthBase: '', strengthMax: '',
    techBase: '', techMax: '',
    physBase: '', physMax: '',
    defBase: '', defMax: '',
    speedBase: '', speedMax: '',
  })

  // Skills
  const [skills, setSkills] = useState<SkillEntry[]>([])

  // Equipment（武器 + 戰徽各一件）
  const [haojieEquip, setHaojieEquip] = useState<HaojieEquip>({ weapon: '', warbadge: '' })

  // TeamComps
  const [teamComps, setTeamComps] = useState<TeamCompEntry[]>([])

  // Story
  const [story, setStory] = useState('')

  // ── Auth & data load ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    fetchData()
  }, [isAdmin, isLoaded])

  const fetchData = async () => {
    try {
      const [catRes, haojieListRes, haojieRes] = await Promise.all([
        fetch('/api/admin/character-categories'),
        fetch('/api/admin/haojie?limit=200'),
        haojieId ? fetch(`/api/admin/haojie/${haojieId}`) : Promise.resolve(null),
      ])

      setCategories(await catRes.json().then(d => Array.isArray(d) ? d : []))
      setAllHaojie(await haojieListRes.json().then(d => d.haojie || []))

      if (haojieRes && haojieId) {
        const d = await haojieRes.json()
        if (d.id) {
          setName(d.name || '')
          setSlug(d.slug || '')
          setRarity(d.rarity || '金')
          setTraits(tryParse(d.traits, []))
          setTroopType(d.troopType || '')
          setAcquisition(d.acquisition || '')
          setAwakenHero(d.awakenHero || false)
          setCategoryId(d.categoryId || '')
          setSortOrder(d.sortOrder || 0)
          setIsPublished(d.isPublished ?? true)
          setAvatar(d.avatar || '')
          setAvatarPosition(d.avatarPosition || '50% 50%')
          setBanner(d.banner || '')
          setBannerPosition(d.bannerPosition || '50% 50%')
          setAttrs(tryParse(d.attributes, attrs))
          setSkills(tryParse(d.skills, []))
          setHaojieEquip(tryParse(d.haojieEquip, { weapon: '', warbadge: '' }))
          setTeamComps(d.teamComps || [])
          setStory(d.story || '')
        }
      }
    } catch { }
    setLoading(false)
  }

  // ── Sticky nav scroll ─────────────────────────────────────────────────────

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY + 120
      for (const s of SECTIONS) {
        const el = sectionRefs.current[s.id]
        if (el && el.offsetTop <= scrollY) setActiveSection(s.id)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = haojieId ? `/api/admin/haojie/${haojieId}` : '/api/admin/haojie'
      const method = haojieId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, slug, rarity,
          traits: JSON.stringify(traits),
          troopType, acquisition, awakenHero,
          story,
          categoryId, sortOrder, isPublished,
          avatar, avatarPosition, banner, bannerPosition,
          attributes: JSON.stringify(attrs),
          skills: JSON.stringify(skills),
          haojieEquip: JSON.stringify(haojieEquip),
          teamComps,
        }),
      })
      if (res.ok) {
        const saved = await res.json()
        alert(haojieId ? '更新成功' : '創建成功')
        if (!haojieId) router.push(`/admin/characters/haojie/edit/${saved.id}`)
      } else {
        const d = await res.json()
        alert(d.error || '保存失敗')
      }
    } catch { alert('網絡錯誤') }
    setSaving(false)
  }

  if (!isAdmin) return null
  if (loading) return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <div className="text-center py-20 text-wiki-text-muted">載入中...</div>
      <WikiFooter />
    </div>
  )

  const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none'
  const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'
  const cardCls = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">
              {haojieId ? '編輯豪杰' : '新增豪杰'}
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">豪杰圖鑑詳細資料</p>
          </div>
          <Link href="/admin/characters/haojie" className="px-4 py-2 bg-wiki-gray text-wiki-text font-bold text-sm hover:text-wiki-accent">
            返回列表
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-6 items-start">
            {/* Sticky left nav */}
            <aside className="hidden lg:block w-44 flex-shrink-0 sticky top-24">
              <div className={cardCls + ' p-3'}>
                <nav className="space-y-1">
                  {SECTIONS.map(s => (
                    <button key={s.id} type="button"
                      onClick={() => scrollTo(s.id)}
                      className={`w-full text-left px-3 py-2 text-sm font-bold transition-colors rounded
                        ${activeSection === s.id ? 'text-wiki-accent border-l-2 border-wiki-accent pl-2' : 'text-wiki-text-muted hover:text-wiki-text'}`}>
                      {s.label}
                    </button>
                  ))}
                </nav>
                <div className="mt-4 pt-4 border-t border-wiki-border">
                  <button type="submit" disabled={saving}
                    className="w-full btn-hard text-wiki-text text-sm disabled:opacity-50">
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 space-y-8 min-w-0">

              {/* §1 基本信息 */}
              <div ref={el => { sectionRefs.current['basic'] = el }} className={cardCls}>
                <h3 className="text-lg font-bold text-wiki-accent mb-5">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>豪杰名稱 *</label>
                    <input className={inputCls} value={name} required onChange={e => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>URL Slug *</label>
                    <input className={inputCls} value={slug} required onChange={e => setSlug(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>稀有度</label>
                    <select className={inputCls + ' cursor-pointer'} value={rarity} onChange={e => setRarity(e.target.value)}>
                      {RARITY_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>所屬分類 *</label>
                    <select className={inputCls + ' cursor-pointer'} value={categoryId} required onChange={e => setCategoryId(e.target.value)}>
                      <option value="">請選擇分類</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>適配兵種</label>
                    <select className={inputCls + ' cursor-pointer'} value={troopType} onChange={e => setTroopType(e.target.value)}>
                      <option value="">請選擇</option>
                      {TROOP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>獲取方式</label>
                    <input className={inputCls} value={acquisition} onChange={e => setAcquisition(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-6 pt-6">
                    <label className="flex items-center gap-2 text-wiki-text cursor-pointer select-none">
                      <input type="checkbox" className="w-4 h-4 accent-wiki-accent"
                        checked={awakenHero} onChange={e => setAwakenHero(e.target.checked)} />
                      <span className="text-sm font-bold">覺醒豪杰</span>
                    </label>
                    <label className="flex items-center gap-2 text-wiki-text cursor-pointer select-none">
                      <input type="checkbox" className="w-4 h-4 accent-wiki-accent"
                        checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
                      <span className="text-sm font-bold">立即發佈</span>
                    </label>
                  </div>
                  <div>
                    <label className={labelCls}>排序值</label>
                    <input type="number" className={inputCls} value={sortOrder}
                      onChange={e => setSortOrder(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>豪杰風格</label>
                    <div className="flex flex-wrap gap-3">
                      {HAOJIE_STYLES.map(t => (
                        <label key={t} className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input type="checkbox" className="accent-wiki-accent"
                            checked={traits.includes(t)}
                            onChange={e => setTraits(e.target.checked ? [...traits, t] : traits.filter(x => x !== t))} />
                          <span className="text-sm text-wiki-text">{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* §2 圖片上傳 */}
              <div ref={el => { sectionRefs.current['images'] = el }} className={cardCls}>
                <h3 className="text-lg font-bold text-wiki-accent mb-5">圖片上傳</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImageUploadInput label="頭像" value={avatar}
                    position={avatarPosition}
                    onChange={setAvatar}
                    onPositionChange={setAvatarPosition}
                    previewHeight="h-48 max-w-xs mx-auto" />
                  <ImageUploadInput label="Banner" value={banner}
                    position={bannerPosition}
                    onChange={setBanner}
                    onPositionChange={setBannerPosition}
                    previewHeight="w-full aspect-[3/1]" />
                </div>
              </div>

              {/* §3 豪杰屬性（5軸雷達圖） */}
              <div ref={el => { sectionRefs.current['attributes'] = el }} className={cardCls}>
                <h3 className="text-lg font-bold text-wiki-accent mb-5">豪杰屬性</h3>
                <div className="flex gap-8 items-start flex-wrap">
                  <div className="flex-1 min-w-[280px] grid grid-cols-2 gap-4">
                    {[
                      { key: 'strength', label: '力量' },
                      { key: 'tech', label: '技術' },
                      { key: 'phys', label: '體魄' },
                      { key: 'def', label: '防護' },
                      { key: 'speed', label: '速度' },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-2">
                        <label className="block text-wiki-text-muted text-xs font-bold uppercase tracking-wider">{label}</label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-wiki-text-muted text-xs mb-1">初始值</label>
                            <input type="number" className="w-full bg-wiki-gray border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                              value={(attrs as any)[`${key}Base`]}
                              onChange={e => setAttrs({ ...attrs, [`${key}Base`]: e.target.value })} />
                          </div>
                          <div className="flex-1">
                            <label className="block text-wiki-text-muted text-xs mb-1">滿級值</label>
                            <input type="number" className="w-full bg-wiki-gray border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                              value={(attrs as any)[`${key}Max`]}
                              onChange={e => setAttrs({ ...attrs, [`${key}Max`]: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs text-wiki-text-muted text-center mb-2">預覽</p>
                    <div className="bg-wiki-gray rounded p-2">
                      <RadarPreview attrs={attrs} />
                    </div>
                    <div className="flex gap-4 justify-center mt-2 text-xs text-wiki-text-muted">
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-blue-400"></span>初始</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-yellow-500"></span>滿級</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* §4 豪杰技能 */}
              <div ref={el => { sectionRefs.current['skills'] = el }} className={cardCls}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-wiki-accent">豪杰技能</h3>
                  <button type="button"
                    onClick={() => setSkills([...skills, { icon: '', type: '帶隊生效', name: '', effect: '', multiplier: '' }])}
                    className="text-sm text-wiki-accent border border-wiki-accent px-3 py-1 hover:bg-wiki-accent hover:text-wiki-bg transition-colors">
                    + 新增技能
                  </button>
                </div>
                <div className="space-y-4">
                  {skills.map((sk, i) => (
                    <div key={i} className="bg-wiki-gray border border-wiki-border p-4 rounded space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-wiki-text-muted">技能 {i + 1}</span>
                        <button type="button" onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-300 text-sm">刪除</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-wiki-text-muted mb-1">技能圖標</label>
                          <SkillIconInput value={sk.icon} onChange={url => { const n = [...skills]; n[i] = { ...sk, icon: url }; setSkills(n) }} />
                        </div>
                        <div>
                          <label className="block text-xs text-wiki-text-muted mb-1">類型</label>
                          <select className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none cursor-pointer"
                            value={sk.type}
                            onChange={e => { const n = [...skills]; n[i] = { ...sk, type: e.target.value }; setSkills(n) }}>
                            {SKILL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-wiki-text-muted mb-1">技能名稱</label>
                          <input className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                            value={sk.name}
                            onChange={e => { const n = [...skills]; n[i] = { ...sk, name: e.target.value }; setSkills(n) }} />
                        </div>
                        <div>
                          <label className="block text-xs text-wiki-text-muted mb-1">升級倍率</label>
                          <input className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                            value={sk.multiplier} placeholder="如：5% / 10% / 15%"
                            onChange={e => { const n = [...skills]; n[i] = { ...sk, multiplier: e.target.value }; setSkills(n) }} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-wiki-text-muted mb-1">技能效果</label>
                          <textarea rows={2}
                            className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none resize-y"
                            value={sk.effect}
                            onChange={e => { const n = [...skills]; n[i] = { ...sk, effect: e.target.value }; setSkills(n) }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {skills.length === 0 && <p className="text-wiki-text-muted text-sm text-center py-4">尚無技能，點擊右上角新增</p>}
                </div>
              </div>

              {/* §5 裝備推薦（武器 + 戰徽各一件） */}
              <div ref={el => { sectionRefs.current['equipment'] = el }} className={cardCls}>
                <h3 className="text-lg font-bold text-wiki-accent mb-2">裝備推薦</h3>
                <p className="text-xs text-wiki-text-muted mb-5">豪杰同時只能裝備一件武器和一件戰徽。後續武器/戰徽圖鑑上線後將改為下拉選擇。</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-wiki-gray border border-wiki-border rounded p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-wiki-accent">⚔ 武器</span>
                    </div>
                    <div>
                      <label className="block text-xs text-wiki-text-muted mb-1">武器名稱</label>
                      <input className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                        value={haojieEquip.weapon}
                        placeholder="暫填武器名稱"
                        onChange={e => setHaojieEquip({ ...haojieEquip, weapon: e.target.value })} />
                    </div>
                  </div>
                  <div className="bg-wiki-gray border border-wiki-border rounded p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-wiki-accent">🛡 戰徽</span>
                    </div>
                    <div>
                      <label className="block text-xs text-wiki-text-muted mb-1">戰徽名稱</label>
                      <input className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                        value={haojieEquip.warbadge}
                        placeholder="暫填戰徽名稱"
                        onChange={e => setHaojieEquip({ ...haojieEquip, warbadge: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* §6 配隊推薦 */}
              <div ref={el => { sectionRefs.current['teamcomp'] = el }} className={cardCls}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-wiki-accent">配隊推薦</h3>
                  <button type="button"
                    onClick={() => setTeamComps([...teamComps, { name: '', memberIds: [], reason: '' }])}
                    className="text-sm text-wiki-accent border border-wiki-accent px-3 py-1 hover:bg-wiki-accent hover:text-wiki-bg transition-colors">
                    + 新增配隊
                  </button>
                </div>
                <div className="space-y-4">
                  {teamComps.map((tc, i) => (
                    <div key={i} className="bg-wiki-gray border border-wiki-border p-4 rounded space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-wiki-text-muted">配隊 {i + 1}</span>
                        <button type="button" onClick={() => setTeamComps(teamComps.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-300 text-sm">刪除</button>
                      </div>
                      <div>
                        <label className="block text-xs text-wiki-text-muted mb-1">配隊名稱（Tab標題）</label>
                        <input className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                          value={tc.name}
                          onChange={e => { const n = [...teamComps]; n[i] = { ...tc, name: e.target.value }; setTeamComps(n) }} />
                      </div>
                      <div>
                        <label className="block text-xs text-wiki-text-muted mb-1">推薦理由</label>
                        <textarea rows={2}
                          className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none resize-y"
                          value={tc.reason}
                          onChange={e => { const n = [...teamComps]; n[i] = { ...tc, reason: e.target.value }; setTeamComps(n) }} />
                      </div>
                      <div>
                        <label className="block text-xs text-wiki-text-muted mb-2">成員豪杰</label>
                        <div className="flex flex-wrap gap-2">
                          {allHaojie.filter(c => c.id !== haojieId).map(c => {
                            const sel = tc.memberIds.includes(c.id)
                            return (
                              <label key={c.id}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs cursor-pointer transition-colors rounded
                                  ${sel ? 'border-wiki-accent bg-wiki-accent/10 text-wiki-accent' : 'border-wiki-border text-wiki-text-muted hover:border-wiki-accent/50'}`}>
                                <input type="checkbox" className="hidden"
                                  checked={sel}
                                  onChange={e => {
                                    const newIds = e.target.checked ? [...tc.memberIds, c.id] : tc.memberIds.filter(id => id !== c.id)
                                    const n = [...teamComps]; n[i] = { ...tc, memberIds: newIds }; setTeamComps(n)
                                  }} />
                                {c.name}
                              </label>
                            )
                          })}
                          {allHaojie.filter(c => c.id !== haojieId).length === 0 && (
                            <p className="text-wiki-text-muted text-xs">暫無其他豪杰可選</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {teamComps.length === 0 && <p className="text-wiki-text-muted text-sm text-center py-4">尚無配隊，點擊右上角新增</p>}
                </div>
              </div>

              {/* §7 黑道傳聞 */}
              <div ref={el => { sectionRefs.current['story'] = el }} className={cardCls}>
                <h3 className="text-lg font-bold text-wiki-accent mb-5">黑道傳聞</h3>
                <RichTextEditor value={story} onChange={setStory} minHeight="min-h-[200px]" />
              </div>

              {/* Mobile save button */}
              <div className="lg:hidden">
                <button type="submit" disabled={saving}
                  className="w-full btn-hard text-wiki-text disabled:opacity-50 py-3">
                  {saving ? '保存中...' : '保存豪杰'}
                </button>
              </div>

            </div>
          </div>
        </form>
      </main>
      <WikiFooter />
    </div>
  )
}
