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

// ─── Types ───────────────────────────────────────────────────────────────────

interface CharacterCategory { id: string; name: string; slug: string }
interface EquipmentOption { id: string; name: string; icon?: string; rarity?: number }
interface ArticleOption { id: string; title: string; slug: string }
interface CharacterOption { id: string; name: string; avatar?: string }

interface SkillEntry {
  icon: string; type: string; name: string; effect: string; multiplier: string
}
interface SkinBonus { label: string; value: string }
interface SkinEntry {
  name: string; art: string; icon: string; bonuses: SkinBonus[]; acquisition: string
}
interface SkinBondEntry {
  name: string; skinIds: string[]; bonuses: SkinBonus[]
}
interface TeamCompEntry {
  name: string; memberIds: string[]; reason: string
}
interface BloodBondEntry {
  requiredStars: number; memberIds: string[]; bonuses: SkinBonus[]
}

const SECTIONS = [
  { id: 'basic', label: '基本信息' },
  { id: 'images', label: '圖片上傳' },
  { id: 'attributes', label: '英雄屬性' },
  { id: 'skills', label: '英雄技能' },
  { id: 'equipment', label: '推薦裝備' },
  { id: 'teamcomp', label: '陣容搭配' },
  { id: 'skins', label: '英雄皮膚' },
  { id: 'skinbonds', label: '皮膚羁绊' },
  { id: 'bloodbond', label: '血盟' },
  { id: 'articles', label: '關聯攻略' },
]

const TRAIT_OPTIONS = ['攻擊型', '防禦型', '輔助型', '控制型', '速度型', '魅帥型']
const RARITY_OPTIONS = ['金', '紫', '藍']
const SKILL_TYPES = ['帶動生效', '被動生效', '主動技能', '觸發效果']

// ─── Radar chart preview ─────────────────────────────────────────────────────

function RadarPreview({ attrs }: { attrs: any }) {
  const size = 160
  const cx = size / 2
  const cy = size / 2
  const r = 60
  const labels = ['攻擊', '防衛', '魅帥', '速度']
  const angles = labels.map((_, i) => (Math.PI * 2 * i) / 4 - Math.PI / 2)

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  })

  const baseVals = [
    Number(attrs?.attackBase) || 0,
    Number(attrs?.defenseBase) || 0,
    Number(attrs?.charismaBase) || 0,
    Number(attrs?.speedBase) || 0,
  ]
  const maxVals = [
    Number(attrs?.attackMax) || 0,
    Number(attrs?.defenseMax) || 0,
    Number(attrs?.charismaMax) || 0,
    Number(attrs?.speedMax) || 0,
  ]
  const globalMax = Math.max(...maxVals, 1)

  const polyPoints = (vals: number[]) =>
    vals.map((v, i) => {
      const pt = toXY(angles[i], (v / globalMax) * r)
      return `${pt.x},${pt.y}`
    }).join(' ')

  return (
    <svg width={size} height={size} className="mx-auto">
      {[0.25, 0.5, 0.75, 1].map((frac) => (
        <polygon
          key={frac}
          points={angles.map(a => {
            const pt = toXY(a, r * frac)
            return `${pt.x},${pt.y}`
          }).join(' ')}
          fill="none" stroke="#4b5563" strokeWidth="1"
        />
      ))}
      {angles.map((a, i) => {
        const outer = toXY(a, r)
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#4b5563" strokeWidth="1" />
      })}
      {baseVals.some(v => v > 0) && (
        <polygon points={polyPoints(baseVals)} fill="rgba(59,130,246,0.3)" stroke="#3b82f6" strokeWidth="1.5" />
      )}
      {maxVals.some(v => v > 0) && (
        <polygon points={polyPoints(maxVals)} fill="rgba(212,175,55,0.25)" stroke="#d4af37" strokeWidth="1.5" />
      )}
      {labels.map((label, i) => {
        const pt = toXY(angles[i], r + 14)
        return (
          <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="#d1b27a">{label}</text>
        )
      })}
    </svg>
  )
}

// ─── Reusable sub-components ─────────────────────────────────────────────────

function BonusRepeater({ bonuses, onChange }: { bonuses: SkinBonus[]; onChange: (b: SkinBonus[]) => void }) {
  return (
    <div className="space-y-2">
      {bonuses.map((b, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            className="flex-1 bg-wiki-gray border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
            placeholder="屬性名稱"
            value={b.label}
            onChange={e => { const n = [...bonuses]; n[i] = { ...b, label: e.target.value }; onChange(n) }}
          />
          <input
            className="w-28 bg-wiki-gray border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
            placeholder="數值"
            value={b.value}
            onChange={e => { const n = [...bonuses]; n[i] = { ...b, value: e.target.value }; onChange(n) }}
          />
          <button type="button" onClick={() => onChange(bonuses.filter((_, j) => j !== i))}
            className="text-red-400 hover:text-red-300 px-2 text-lg leading-none">×</button>
        </div>
      ))}
      <button type="button"
        onClick={() => onChange([...bonuses, { label: '', value: '' }])}
        className="text-sm text-wiki-accent hover:underline">+ 新增加成</button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminCharacterEditPage() {
  const router = useRouter()
  const params = useParams()
  const rawId = params?.id as string
  const characterId = rawId === 'new' ? '' : rawId
  const { isAdmin, isLoaded } = useAdminAuth()

  const [categories, setCategories] = useState<CharacterCategory[]>([])
  const [allCharacters, setAllCharacters] = useState<CharacterOption[]>([])
  const [allEquipments, setAllEquipments] = useState<EquipmentOption[]>([])
  const [allArticles, setAllArticles] = useState<ArticleOption[]>([])
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
  const [story, setStory] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isPublished, setIsPublished] = useState(true)

  // Images
  const [avatar, setAvatar] = useState('')
  const [banner, setBanner] = useState('')
  const [bannerPosition, setBannerPosition] = useState('50% 50%')

  // Attributes
  const [attrs, setAttrs] = useState({
    attackBase: '', attackMax: '',
    defenseBase: '', defenseMax: '',
    charismaBase: '', charismaMax: '',
    speedBase: '', speedMax: '',
  })

  // Skills
  const [skills, setSkills] = useState<SkillEntry[]>([])

  // Equipment
  const [equipmentIds, setEquipmentIds] = useState<string[]>([])

  // TeamComps
  const [teamComps, setTeamComps] = useState<TeamCompEntry[]>([])

  // Skins
  const [skins, setSkins] = useState<SkinEntry[]>([])

  // SkinBonds
  const [skinBonds, setSkinBonds] = useState<SkinBondEntry[]>([])

  // BloodBonds
  const [bloodBonds, setBloodBonds] = useState<BloodBondEntry[]>([])

  // Articles
  const [articleIds, setArticleIds] = useState<string[]>([])

  // ── Auth & data load ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    fetchData()
  }, [isAdmin, isLoaded])

  const fetchData = async () => {
    try {
      const [catRes, charListRes, eqRes, artRes, charRes] = await Promise.all([
        fetch('/api/admin/character-categories'),
        fetch('/api/admin/characters?limit=200'),
        fetch('/api/admin/equipment?limit=200'),
        fetch('/api/admin/articles?limit=200'),
        characterId ? fetch(`/api/admin/characters/${characterId}`) : Promise.resolve(null),
      ])

      setCategories(await catRes.json().then(d => Array.isArray(d) ? d : []))
      setAllCharacters(await charListRes.json().then(d => d.characters || []))
      setAllEquipments(await eqRes.json().then(d => d.equipment || d.equipments || []))
      setAllArticles(await artRes.json().then(d => d.articles || []))

      if (charRes && characterId) {
        const d = await charRes.json()
        if (d.id) {
          setName(d.name || '')
          setSlug(d.slug || '')
          setRarity(d.rarity || '金')
          setTraits(tryParse(d.traits, []))
          setTroopType(d.troopType || '')
          setAcquisition(d.acquisition || '')
          setStory(d.story || '')
          setCategoryId(d.categoryId || '')
          setSortOrder(d.sortOrder || 0)
          setIsPublished(d.isPublished ?? true)
          setAvatar(d.avatar || '')
          setBanner(d.banner || '')
          setBannerPosition(d.bannerPosition || '50% 50%')
          setAttrs(tryParse(d.attributes, attrs))
          setSkills(tryParse(d.skills, []))
          setEquipmentIds(d.equipmentIds || [])
          setTeamComps(d.teamComps || [])
          setSkins((d.skins || []).map((s: any) => ({
            ...s,
            bonuses: tryParse(s.bonuses, []),
          })))
          setSkinBonds((d.skinBonds || []).map((b: any) => ({
            ...b,
            skinIds: tryParse(b.skinIds, []),
            bonuses: tryParse(b.bonuses, []),
          })))
          setBloodBonds((d.bloodBonds || []).map((bb: any) => ({
            ...bb,
            bonuses: tryParse(bb.bonuses, []),
          })))
          setArticleIds(d.articleIds || [])
        }
      }
    } catch { }
    setLoading(false)
  }

  // ── Sticky nav scroll detection ──────────────────────────────────────────

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
      const url = characterId ? `/api/admin/characters/${characterId}` : '/api/admin/characters'
      const method = characterId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, slug, rarity,
          traits: JSON.stringify(traits),
          troopType, acquisition, story,
          categoryId, sortOrder, isPublished,
          avatar, banner, bannerPosition,
          attributes: JSON.stringify(attrs),
          skills: JSON.stringify(skills),
          equipmentIds,
          teamComps,
          skins,
          skinBonds,
          bloodBonds,
          articleIds,
        }),
      })
      if (res.ok) {
        alert(characterId ? '更新成功' : '創建成功')
        router.push('/admin/characters')
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
              {characterId ? '編輯英雄' : '新增英雄'}
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">英雄圖鑑詳細資料</p>
          </div>
          <Link href="/admin/characters" className="px-4 py-2 bg-wiki-gray text-wiki-text font-bold text-sm hover:text-wiki-accent">
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
              <div ref={el => { sectionRefs.current['basic'] = el }} id="section-basic" className={cardCls}>
                <h3 className="text-lg font-bold text-wiki-accent mb-5">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>角色名稱 *</label>
                    <input className={inputCls} value={name} required
                      onChange={e => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>URL Slug *</label>
                    <input className={inputCls} value={slug} required
                      onChange={e => setSlug(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>稀有度</label>
                    <select className={inputCls + ' cursor-pointer'} value={rarity} onChange={e => setRarity(e.target.value)}>
                      {RARITY_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>兵種</label>
                    <input className={inputCls} value={troopType} placeholder="如：步兵、騎兵"
                      onChange={e => setTroopType(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>獲取方式</label>
                    <input className={inputCls} value={acquisition}
                      onChange={e => setAcquisition(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>所屬分類 *</label>
                    <select className={inputCls + ' cursor-pointer'} value={categoryId} required onChange={e => setCategoryId(e.target.value)}>
                      <option value="">請選擇分類</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>特性標籤</label>
                    <div className="flex flex-wrap gap-2">
                      {TRAIT_OPTIONS.map(t => (
                        <label key={t} className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input type="checkbox" className="accent-wiki-accent"
                            checked={traits.includes(t)}
                            onChange={e => setTraits(e.target.checked ? [...traits, t] : traits.filter(x => x !== t))} />
                          <span className="text-sm text-wiki-text">{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>英雄故事</label>
                    <RichTextEditor value={story} onChange={setStory} minHeight="min-h-[120px]" />
                  </div>
                  <div>
                    <label className={labelCls}>排序值</label>
                    <input type="number" className={inputCls} value={sortOrder}
                      onChange={e => setSortOrder(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="flex items-center gap-3 pt-8">
                    <label className="flex items-center gap-2 text-wiki-text cursor-pointer select-none">
                      <input type="checkbox" className="w-5 h-5 accent-wiki-accent cursor-pointer"
                        checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
                      <span className="font-bold">立即發佈</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* §2 圖片上傳 */}
              <div ref={el => { sectionRefs.current['images'] = el }} className={cardCls}>
                <h3 className="text-lg font-bold text-wiki-accent mb-5">圖片上傳</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImageUploadInput label="頭像" value={avatar}
                    onChange={setAvatar}
                    onPositionChange={() => {}}
                    previewHeight="h-48 max-w-xs mx-auto" />
                  <ImageUploadInput label="Banner" value={banner}
                    position={bannerPosition}
                    onChange={setBanner}
                    onPositionChange={setBannerPosition}
                    previewHeight="w-full aspect-[3/1]" />
                </div>
              </div>

              {/* §3 英雄屬性 */}
              <div ref={el => { sectionRefs.current['attributes'] = el }} className={cardCls}>
                <h3 className="text-lg font-bold text-wiki-accent mb-5">英雄屬性</h3>
                <div className="flex gap-8 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    {[
                      { key: 'attack', label: '攻擊' },
                      { key: 'defense', label: '防衛' },
                      { key: 'charisma', label: '魅帥' },
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

              {/* §4 英雄技能 */}
              <div ref={el => { sectionRefs.current['skills'] = el }} className={cardCls}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-wiki-accent">英雄技能</h3>
                  <button type="button"
                    onClick={() => setSkills([...skills, { icon: '', type: '帶動生效', name: '', effect: '', multiplier: '' }])}
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
                          <label className="block text-xs text-wiki-text-muted mb-1">圖標URL</label>
                          <input className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                            value={sk.icon} placeholder="圖標URL"
                            onChange={e => { const n = [...skills]; n[i] = { ...sk, icon: e.target.value }; setSkills(n) }} />
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

              {/* §5 推薦裝備 */}
              <div ref={el => { sectionRefs.current['equipment'] = el }} className={cardCls}>
                <h3 className="text-lg font-bold text-wiki-accent mb-5">推薦裝備 <span className="text-sm font-normal text-wiki-text-muted">（最多6件）</span></h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allEquipments.map(eq => {
                    const sel = equipmentIds.includes(eq.id)
                    return (
                      <label key={eq.id}
                        className={`flex items-center gap-2 p-3 border cursor-pointer transition-colors rounded
                          ${sel ? 'border-wiki-accent bg-wiki-accent/10' : 'border-wiki-border bg-wiki-gray hover:border-wiki-accent/50'}`}>
                        <input type="checkbox" className="accent-wiki-accent"
                          checked={sel}
                          onChange={e => {
                            if (e.target.checked && equipmentIds.length < 6) setEquipmentIds([...equipmentIds, eq.id])
                            else if (!e.target.checked) setEquipmentIds(equipmentIds.filter(id => id !== eq.id))
                          }} />
                        {eq.icon && <img src={eq.icon} alt={eq.name} className="w-8 h-8 object-contain" />}
                        <span className="text-sm text-wiki-text truncate">{eq.name}</span>
                      </label>
                    )
                  })}
                  {allEquipments.length === 0 && <p className="col-span-3 text-wiki-text-muted text-sm text-center py-4">裝備庫為空</p>}
                </div>
              </div>

              {/* §6 陣容搭配 */}
              <div ref={el => { sectionRefs.current['teamcomp'] = el }} className={cardCls}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-wiki-accent">陣容搭配</h3>
                  <button type="button"
                    onClick={() => setTeamComps([...teamComps, { name: '', memberIds: [], reason: '' }])}
                    className="text-sm text-wiki-accent border border-wiki-accent px-3 py-1 hover:bg-wiki-accent hover:text-wiki-bg transition-colors">
                    + 新增搭配
                  </button>
                </div>
                <div className="space-y-4">
                  {teamComps.map((tc, i) => (
                    <div key={i} className="bg-wiki-gray border border-wiki-border p-4 rounded space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-wiki-text-muted">搭配 {i + 1}</span>
                        <button type="button" onClick={() => setTeamComps(teamComps.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-300 text-sm">刪除</button>
                      </div>
                      <div>
                        <label className="block text-xs text-wiki-text-muted mb-1">搭配名稱（Tab標題）</label>
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
                        <label className="block text-xs text-wiki-text-muted mb-2">成員英雄</label>
                        <div className="flex flex-wrap gap-2">
                          {allCharacters.filter(c => c.id !== characterId).map(c => {
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
                        </div>
                      </div>
                    </div>
                  ))}
                  {teamComps.length === 0 && <p className="text-wiki-text-muted text-sm text-center py-4">尚無陣容搭配</p>}
                </div>
              </div>

              {/* §7 英雄皮膚 */}
              <div ref={el => { sectionRefs.current['skins'] = el }} className={cardCls}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-wiki-accent">英雄皮膚</h3>
                  <button type="button"
                    onClick={() => setSkins([...skins, { name: '', art: '', icon: '', bonuses: [], acquisition: '' }])}
                    className="text-sm text-wiki-accent border border-wiki-accent px-3 py-1 hover:bg-wiki-accent hover:text-wiki-bg transition-colors">
                    + 新增皮膚
                  </button>
                </div>
                <div className="space-y-4">
                  {skins.map((sk, i) => (
                    <div key={i} className="bg-wiki-gray border border-wiki-border p-4 rounded space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-wiki-text-muted">皮膚 {i + 1}</span>
                        <button type="button" onClick={() => setSkins(skins.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-300 text-sm">刪除</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-wiki-text-muted mb-1">皮膚名稱</label>
                          <input className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                            value={sk.name}
                            onChange={e => { const n = [...skins]; n[i] = { ...sk, name: e.target.value }; setSkins(n) }} />
                        </div>
                        <div>
                          <label className="block text-xs text-wiki-text-muted mb-1">獲取途徑</label>
                          <input className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                            value={sk.acquisition}
                            onChange={e => { const n = [...skins]; n[i] = { ...sk, acquisition: e.target.value }; setSkins(n) }} />
                        </div>
                        <div>
                          <label className="block text-xs text-wiki-text-muted mb-1">立繪URL（無背景）</label>
                          <input className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                            value={sk.art} placeholder="圖片URL"
                            onChange={e => { const n = [...skins]; n[i] = { ...sk, art: e.target.value }; setSkins(n) }} />
                          {sk.art && <img src={sk.art} alt="art" className="mt-2 h-24 object-contain rounded" />}
                        </div>
                        <div>
                          <label className="block text-xs text-wiki-text-muted mb-1">頭像URL</label>
                          <input className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                            value={sk.icon} placeholder="圖片URL"
                            onChange={e => { const n = [...skins]; n[i] = { ...sk, icon: e.target.value }; setSkins(n) }} />
                          {sk.icon && <img src={sk.icon} alt="icon" className="mt-2 h-12 w-12 object-cover rounded" />}
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-wiki-text-muted mb-2">屬性加成</label>
                          <BonusRepeater bonuses={sk.bonuses}
                            onChange={b => { const n = [...skins]; n[i] = { ...sk, bonuses: b }; setSkins(n) }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {skins.length === 0 && <p className="text-wiki-text-muted text-sm text-center py-4">尚無皮膚</p>}
                </div>
              </div>

              {/* §8 皮膚羁绊 */}
              <div ref={el => { sectionRefs.current['skinbonds'] = el }} className={cardCls}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-wiki-accent">皮膚羁绊</h3>
                  <button type="button"
                    onClick={() => setSkinBonds([...skinBonds, { name: '', skinIds: [], bonuses: [] }])}
                    className="text-sm text-wiki-accent border border-wiki-accent px-3 py-1 hover:bg-wiki-accent hover:text-wiki-bg transition-colors">
                    + 新增羁绊
                  </button>
                </div>
                <div className="space-y-4">
                  {skinBonds.map((sb, i) => (
                    <div key={i} className="bg-wiki-gray border border-wiki-border p-4 rounded space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-wiki-text-muted">羁绊 {i + 1}</span>
                        <button type="button" onClick={() => setSkinBonds(skinBonds.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-300 text-sm">刪除</button>
                      </div>
                      <div>
                        <label className="block text-xs text-wiki-text-muted mb-1">羁绊名稱</label>
                        <input className="w-full bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                          value={sb.name}
                          onChange={e => { const n = [...skinBonds]; n[i] = { ...sb, name: e.target.value }; setSkinBonds(n) }} />
                      </div>
                      <div>
                        <label className="block text-xs text-wiki-text-muted mb-2">包含皮膚</label>
                        <div className="flex flex-wrap gap-2">
                          {skins.map((sk, si) => {
                            if (!sk.name) return null
                            const skinKey = `skin-${si}`
                            const sel = sb.skinIds.includes(skinKey)
                            return (
                              <label key={si} className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs cursor-pointer transition-colors rounded
                                ${sel ? 'border-wiki-accent bg-wiki-accent/10 text-wiki-accent' : 'border-wiki-border text-wiki-text-muted'}`}>
                                <input type="checkbox" className="hidden"
                                  checked={sel}
                                  onChange={e => {
                                    const newIds = e.target.checked ? [...sb.skinIds, skinKey] : sb.skinIds.filter(id => id !== skinKey)
                                    const n = [...skinBonds]; n[i] = { ...sb, skinIds: newIds }; setSkinBonds(n)
                                  }} />
                                {sk.name}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-wiki-text-muted mb-2">解鎖加成</label>
                        <BonusRepeater bonuses={sb.bonuses}
                          onChange={b => { const n = [...skinBonds]; n[i] = { ...sb, bonuses: b }; setSkinBonds(n) }} />
                      </div>
                    </div>
                  ))}
                  {skinBonds.length === 0 && <p className="text-wiki-text-muted text-sm text-center py-4">尚無皮膚羁绊</p>}
                </div>
              </div>

              {/* §9 血盟 */}
              <div ref={el => { sectionRefs.current['bloodbond'] = el }} className={cardCls}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-wiki-accent">血盟</h3>
                  <button type="button"
                    onClick={() => setBloodBonds([...bloodBonds, { requiredStars: 0, memberIds: [], bonuses: [] }])}
                    className="text-sm text-wiki-accent border border-wiki-accent px-3 py-1 hover:bg-wiki-accent hover:text-wiki-bg transition-colors">
                    + 新增血盟
                  </button>
                </div>
                <div className="space-y-4">
                  {bloodBonds.map((bb, i) => (
                    <div key={i} className="bg-wiki-gray border border-wiki-border p-4 rounded space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-wiki-text-muted">血盟 {i + 1}</span>
                        <button type="button" onClick={() => setBloodBonds(bloodBonds.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-300 text-sm">刪除</button>
                      </div>
                      <div>
                        <label className="block text-xs text-wiki-text-muted mb-1">所需星級</label>
                        <input type="number" min="0" max="10"
                          className="w-24 bg-wiki-gray-light border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
                          value={bb.requiredStars}
                          onChange={e => { const n = [...bloodBonds]; n[i] = { ...bb, requiredStars: parseInt(e.target.value) || 0 }; setBloodBonds(n) }} />
                      </div>
                      <div>
                        <label className="block text-xs text-wiki-text-muted mb-2">成員英雄</label>
                        <div className="flex flex-wrap gap-2">
                          {allCharacters.filter(c => c.id !== characterId).map(c => {
                            const sel = bb.memberIds.includes(c.id)
                            return (
                              <label key={c.id}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs cursor-pointer transition-colors rounded
                                  ${sel ? 'border-wiki-accent bg-wiki-accent/10 text-wiki-accent' : 'border-wiki-border text-wiki-text-muted hover:border-wiki-accent/50'}`}>
                                <input type="checkbox" className="hidden"
                                  checked={sel}
                                  onChange={e => {
                                    const newIds = e.target.checked ? [...bb.memberIds, c.id] : bb.memberIds.filter(id => id !== c.id)
                                    const n = [...bloodBonds]; n[i] = { ...bb, memberIds: newIds }; setBloodBonds(n)
                                  }} />
                                {c.name}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-wiki-text-muted mb-2">解鎖加成</label>
                        <BonusRepeater bonuses={bb.bonuses}
                          onChange={b => { const n = [...bloodBonds]; n[i] = { ...bb, bonuses: b }; setBloodBonds(n) }} />
                      </div>
                    </div>
                  ))}
                  {bloodBonds.length === 0 && <p className="text-wiki-text-muted text-sm text-center py-4">尚無血盟</p>}
                </div>
              </div>

              {/* §10 關聯攻略 */}
              <div ref={el => { sectionRefs.current['articles'] = el }} className={cardCls}>
                <h3 className="text-lg font-bold text-wiki-accent mb-5">關聯攻略</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {allArticles.map(art => {
                    const sel = articleIds.includes(art.id)
                    return (
                      <label key={art.id}
                        className={`flex items-center gap-2 p-3 border cursor-pointer transition-colors rounded
                          ${sel ? 'border-wiki-accent bg-wiki-accent/10' : 'border-wiki-border bg-wiki-gray hover:border-wiki-accent/50'}`}>
                        <input type="checkbox" className="accent-wiki-accent"
                          checked={sel}
                          onChange={e => setArticleIds(e.target.checked ? [...articleIds, art.id] : articleIds.filter(id => id !== art.id))} />
                        <span className="text-sm text-wiki-text truncate">{art.title}</span>
                      </label>
                    )
                  })}
                  {allArticles.length === 0 && <p className="text-wiki-text-muted text-sm text-center py-4">文章庫為空</p>}
                </div>
              </div>

              {/* Bottom save */}
              <div className="flex gap-4 pb-8">
                <button type="submit" disabled={saving}
                  className="btn-hard text-wiki-text disabled:opacity-50">
                  {saving ? '保存中...' : '保存'}
                </button>
                <Link href="/admin/characters"
                  className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold uppercase tracking-wider">
                  取消
                </Link>
              </div>
            </div>
          </div>
        </form>
      </main>
      <WikiFooter />
    </div>
  )
}

function tryParse(val: any, fallback: any) {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'object') return val
  try { return JSON.parse(val) } catch { return fallback }
}
