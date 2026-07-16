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
  weaponId: string
  warbadgeId: string
}
interface Equipment { id: string; name: string; icon?: string; equipType?: string; EquipmentCategory?: { name: string } }

const SECTIONS = [
  { id: 'basic', label: '基本信息' },
  { id: 'images', label: '圖片上傳' },
  { id: 'skills', label: '豪傑技能' },
  { id: 'equipment', label: '裝備推薦' },
  { id: 'teamcomp', label: '配隊推薦' },
  { id: 'story', label: '黑道傳聞' },
]

const RARITY_OPTIONS = ['金', '紫']
const HAOJIE_STYLES = ['無畏風格', '迅捷風格', '智謀風格', '穩固風格']
const TROOP_TYPES = ['暴徒', '槍手', '飛車黨', '改裝車輛']
const SKILL_TYPES = ['帶隊生效', '被動生效']

// ─── Equipment picker ─────────────────────────────────────────────────────────

function EquipPickerField({
  label, placeholder, pool, selectedId, selectedEq, onSelect, onClear,
}: {
  label: string; placeholder: string
  pool: Equipment[]; selectedId: string; selectedEq: Equipment | undefined
  onSelect: (id: string) => void; onClear: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = pool.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-wiki-accent">{label}</span>
        {selectedId && (
          <button type="button" onClick={onClear} className="text-xs text-red-400 hover:text-red-300">× 取消選擇</button>
        )}
      </div>

      {/* 已選中預覽 */}
      {selectedEq && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-wiki-accent/10 border border-wiki-accent/40 rounded text-sm">
          {selectedEq.icon
            ? <img src={selectedEq.icon} alt={selectedEq.name} className="w-8 h-8 object-contain flex-shrink-0" />
            : <div className="w-8 h-8 bg-wiki-gray rounded flex-shrink-0" />}
          <span className="text-wiki-accent font-bold">{selectedEq.name}</span>
        </div>
      )}

      {/* 搜索框 */}
      <input
        className="w-full bg-wiki-gray border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none mb-2"
        placeholder={placeholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* 列表 */}
      <div className="border border-wiki-border rounded overflow-hidden max-h-52 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-wiki-text-muted text-sm text-center py-6">
            {pool.length === 0 ? '裝備庫尚無此類型裝備' : '無符合結果'}
          </p>
        ) : (
          filtered.map(eq => {
            const sel = eq.id === selectedId
            return (
              <button
                key={eq.id}
                type="button"
                onClick={() => onSelect(sel ? '' : eq.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors border-b border-wiki-border/40 last:border-0
                  ${sel ? 'bg-wiki-accent/10 text-wiki-accent' : 'bg-wiki-gray-light hover:bg-wiki-gray text-wiki-text'}`}
              >
                {eq.icon
                  ? <img src={eq.icon} alt={eq.name} className="w-7 h-7 object-contain flex-shrink-0" />
                  : <div className="w-7 h-7 bg-wiki-gray rounded flex-shrink-0" />}
                <span className="truncate">{eq.name}</span>
                {sel && <span className="ml-auto text-wiki-accent text-xs flex-shrink-0">✓ 已選</span>}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
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

// ─── Preview helpers ──────────────────────────────────────────────────────────

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-wiki-border">
        <h3 className="text-sm font-heading font-bold text-wiki-accent heading-hard">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

interface HaojiePreviewProps {
  name: string; rarity: string; traits: string[]; troopType: string; acquisition: string
  awakenHero: boolean; avatar: string; avatarPosition: string; banner: string; bannerPosition: string
  recommendedBuild: string; skills: SkillEntry[]; haojieEquip: HaojieEquip
  teamComps: TeamCompEntry[]; allHaojie: CharacterOption[]; allEquipments: Equipment[]
  onClose: () => void
}

function HaojiePreviewModal(p: HaojiePreviewProps) {
  const [teamTab, setTeamTab] = useState(0)
  const rarityColor = { '金': 'text-yellow-400', '紫': 'text-purple-400' }[p.rarity] || 'text-wiki-text'
  const memberName = (id: string) => p.allHaojie.find(c => c.id === id)?.name || id
  const weaponEq = p.allEquipments.find(e => e.id === p.haojieEquip.weaponId)
  const warbadgeEq = p.allEquipments.find(e => e.id === p.haojieEquip.warbadgeId)

  return (
    <div className="fixed inset-0 z-50 flex bg-black/80" onClick={e => { if (e.target === e.currentTarget) p.onClose() }}>
      <div className="ml-auto w-full max-w-3xl h-full bg-wiki-bg overflow-y-auto flex flex-col shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-wiki-gray-light border-b border-wiki-border">
          <span className="text-sm font-bold text-wiki-accent">預覽（當前表單數據）</span>
          <button onClick={p.onClose} className="text-wiki-text-muted hover:text-wiki-text text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Banner */}
          <div className="relative rounded-xl overflow-hidden bg-wiki-gray-light border border-wiki-border" style={{ minHeight: 180 }}>
            {p.banner && <img src={p.banner} alt={p.name} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: p.bannerPosition }} />}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="relative z-10 flex items-end gap-4 p-5">
              {p.avatar && (
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-wiki-accent bg-wiki-gray flex-shrink-0">
                  <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" style={{ objectPosition: p.avatarPosition }} />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-heading font-bold text-white heading-hard">
                  {p.name || '（未填名稱）'}
                  {p.awakenHero && <span className="ml-2 text-sm px-2 py-0.5 bg-yellow-900/60 border border-yellow-500/50 text-yellow-400 rounded">覺醒</span>}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`font-bold ${rarityColor}`}>{p.rarity}</span>
                  {p.traits.map(t => <span key={t} className="px-2 py-0.5 text-xs bg-wiki-accent/20 text-wiki-accent border border-wiki-accent/40 rounded">{t}</span>)}
                  {p.troopType && <span className="px-2 py-0.5 text-xs bg-white/10 text-white/80 border border-white/20 rounded">{p.troopType}</span>}
                  {p.acquisition && <span className="text-xs text-white/60">獲得：{p.acquisition}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* 推薦加點 */}
          {p.recommendedBuild && (
            <PreviewCard title="推薦加點">
              <p className="text-sm text-wiki-text whitespace-pre-line">{p.recommendedBuild}</p>
            </PreviewCard>
          )}

          {/* Skills */}
          {p.skills.length > 0 && (
            <PreviewCard title="豪傑技能">
              <div className="space-y-3">
                {p.skills.map((sk, i) => (
                  <div key={i} className="flex gap-3 bg-wiki-gray rounded p-3">
                    {sk.icon
                      ? <img src={sk.icon} alt={sk.name} className="w-10 h-10 object-contain rounded flex-shrink-0" />
                      : <div className="w-10 h-10 bg-wiki-border rounded flex-shrink-0 flex items-center justify-center text-wiki-text-muted">⚔</div>}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-wiki-text text-sm">{sk.name || '（未填名稱）'}</span>
                        <span className={`px-2 py-0.5 text-xs rounded border ${sk.type === '帶隊生效' ? 'bg-blue-900/40 border-blue-500/40 text-blue-300' : 'bg-wiki-accent/10 border-wiki-accent/30 text-wiki-accent'}`}>{sk.type}</span>
                      </div>
                      <p className="text-xs text-wiki-text-muted">{sk.effect || '（未填效果）'}</p>
                      {sk.multiplier && <p className="text-xs text-wiki-accent mt-0.5">升級倍率：{sk.multiplier}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </PreviewCard>
          )}

          {/* Equipment */}
          {(weaponEq || warbadgeEq) && (
            <PreviewCard title="裝備推薦">
              <div className="grid grid-cols-2 gap-4">
                {weaponEq && (
                  <div className="flex items-center gap-3 bg-wiki-gray rounded p-3">
                    {weaponEq.icon
                      ? <img src={weaponEq.icon} className="w-12 h-12 object-contain rounded border border-wiki-border flex-shrink-0 bg-wiki-gray-light" alt={weaponEq.name} />
                      : <div className="w-12 h-12 rounded border border-wiki-border flex-shrink-0 bg-wiki-gray-light flex items-center justify-center text-2xl">⚔</div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-wiki-text-muted mb-0.5">武器</p>
                      <p className="font-bold text-wiki-text text-sm truncate">{weaponEq.name}</p>
                    </div>
                  </div>
                )}
                {warbadgeEq && (
                  <div className="flex items-center gap-3 bg-wiki-gray rounded p-3">
                    {warbadgeEq.icon
                      ? <img src={warbadgeEq.icon} className="w-12 h-12 object-contain rounded border border-wiki-border flex-shrink-0 bg-wiki-gray-light" alt={warbadgeEq.name} />
                      : <div className="w-12 h-12 rounded border border-wiki-border flex-shrink-0 bg-wiki-gray-light flex items-center justify-center text-2xl">🛡</div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-wiki-text-muted mb-0.5">戰徽</p>
                      <p className="font-bold text-wiki-text text-sm truncate">{warbadgeEq.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </PreviewCard>
          )}

          {/* Team comps */}
          {p.teamComps.length > 0 && (
            <PreviewCard title="配隊推薦">
              <div className="flex gap-2 mb-3 flex-wrap">
                {p.teamComps.map((tc, i) => (
                  <button key={i} type="button" onClick={() => setTeamTab(i)}
                    className={`px-3 py-1 text-xs font-bold border rounded transition-colors ${teamTab === i ? 'border-wiki-accent text-wiki-accent bg-wiki-accent/10' : 'border-wiki-border text-wiki-text-muted'}`}>
                    {tc.name || `配隊 ${i + 1}`}
                  </button>
                ))}
              </div>
              {p.teamComps[teamTab] && (
                <>
                  <div className="flex gap-3 flex-wrap mb-2">
                    {p.teamComps[teamTab].memberIds.map(id => (
                      <div key={id} className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-wiki-gray border border-wiki-border flex items-center justify-center text-xs text-wiki-text-muted">?</div>
                        <span className="text-xs text-wiki-text-muted">{memberName(id)}</span>
                      </div>
                    ))}
                  </div>
                  {p.teamComps[teamTab].reason && <p className="text-sm text-wiki-text-muted">{p.teamComps[teamTab].reason}</p>}
                </>
              )}
            </PreviewCard>
          )}
        </div>
      </div>
    </div>
  )
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
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
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

  // 推薦加點（數值不固定，改為文字建議；復用 attributes JSON 存 { recommend }）
  const [recommendedBuild, setRecommendedBuild] = useState('')

  // Skills
  const [skills, setSkills] = useState<SkillEntry[]>([])

  // Equipment（武器 + 戰徽各關聯圖鑑庫一件）
  const [haojieEquip, setHaojieEquip] = useState<HaojieEquip>({ weaponId: '', warbadgeId: '' })

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
      const [catRes, haojieListRes, eqRes, haojieRes] = await Promise.all([
        fetch('/api/admin/character-categories'),
        fetch('/api/admin/haojie?limit=200'),
        fetch('/api/admin/equipment?limit=200'),
        haojieId ? fetch(`/api/admin/haojie/${haojieId}`) : Promise.resolve(null),
      ])

      setCategories(await catRes.json().then(d => Array.isArray(d) ? d : []))
      setAllHaojie(await haojieListRes.json().then(d => d.haojie || []))
      setAllEquipments(await eqRes.json().then(d => d.equipment || []))

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
          setRecommendedBuild(tryParse(d.attributes, {})?.recommend || '')
          setSkills(tryParse(d.skills, []))
          setHaojieEquip(tryParse(d.haojieEquip, { weaponId: '', warbadgeId: '' }))
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
          attributes: JSON.stringify({ recommend: recommendedBuild }),
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
              {haojieId ? '編輯豪傑' : '新增豪傑'}
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">豪傑圖鑑詳細資料</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowPreview(true)}
              className="px-4 py-2 border border-wiki-accent text-wiki-accent font-bold text-sm hover:bg-wiki-accent hover:text-wiki-bg transition-colors">
              預覽
            </button>
            <Link href="/admin/characters" className="px-4 py-2 bg-wiki-gray text-wiki-text font-bold text-sm hover:text-wiki-accent">
              返回列表
            </Link>
          </div>
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
                    <label className={labelCls}>豪傑名稱 *</label>
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
                    <label className={labelCls}>獲得方式</label>
                    <input className={inputCls} value={acquisition} onChange={e => setAcquisition(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-6 pt-6">
                    <label className="flex items-center gap-2 text-wiki-text cursor-pointer select-none">
                      <input type="checkbox" className="w-4 h-4 accent-wiki-accent"
                        checked={awakenHero} onChange={e => setAwakenHero(e.target.checked)} />
                      <span className="text-sm font-bold">覺醒豪傑</span>
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
                  <div>
                    <label className={labelCls}>豪傑風格</label>
                    <div className="flex flex-wrap gap-3 pt-2">
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
                  <div>
                    <label className={labelCls}>推薦加點</label>
                    <textarea className={inputCls + ' resize-y'} rows={3} value={recommendedBuild}
                      onChange={e => setRecommendedBuild(e.target.value)}
                      placeholder="如：優先力量，其次技術；速度點滿後轉防護" />
                    <p className="text-xs text-wiki-text-muted mt-1">遊戲內數值受協同訓練投資影響不固定，此處填寫推薦加點方向即可</p>
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

              {/* §3 豪傑技能 */}
              <div ref={el => { sectionRefs.current['skills'] = el }} className={cardCls}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-wiki-accent">豪傑技能</h3>
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

              {/* §5 裝備推薦 */}
              <div ref={el => { sectionRefs.current['equipment'] = el }} className={cardCls}>
                <h3 className="text-lg font-bold text-wiki-accent mb-5">裝備推薦</h3>
                <div className="space-y-6">
                  {([
                    { field: 'weaponId' as const, label: '⚔ 推薦武器', type: 'haojie_weapon', placeholder: '搜尋武器名稱…' },
                    { field: 'warbadgeId' as const, label: '🛡 推薦戰徽', type: 'haojie_warbadge', placeholder: '搜尋戰徽名稱…' },
                  ]).map(({ field, label, type, placeholder }) => {
                    const selectedId = haojieEquip[field]
                    const selectedEq = allEquipments.find(e => e.id === selectedId)
                    const pool = allEquipments.filter(e => e.equipType === type)
                    return (
                      <EquipPickerField
                        key={field}
                        label={label}
                        placeholder={placeholder}
                        pool={pool}
                        selectedId={selectedId}
                        selectedEq={selectedEq}
                        onSelect={id => setHaojieEquip({ ...haojieEquip, [field]: id })}
                        onClear={() => setHaojieEquip({ ...haojieEquip, [field]: '' })}
                      />
                    )
                  })}
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
                        <label className="block text-xs text-wiki-text-muted mb-2">成員豪傑</label>
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
                            <p className="text-wiki-text-muted text-xs">暫無其他豪傑可選</p>
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
                  {saving ? '保存中...' : '保存豪傑'}
                </button>
              </div>

            </div>
          </div>
        </form>
      </main>
      <WikiFooter />

      {showPreview && (
        <HaojiePreviewModal
          name={name} rarity={rarity} traits={traits} troopType={troopType} acquisition={acquisition}
          awakenHero={awakenHero} avatar={avatar} avatarPosition={avatarPosition}
          banner={banner} bannerPosition={bannerPosition}
          recommendedBuild={recommendedBuild} skills={skills} haojieEquip={haojieEquip}
          teamComps={teamComps} allHaojie={allHaojie} allEquipments={allEquipments}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
