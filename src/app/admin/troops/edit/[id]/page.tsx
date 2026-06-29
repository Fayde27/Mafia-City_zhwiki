'use client'

export const runtime = 'edge'

import { useState, useEffect, useRef } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ImageUploadInput from '@/components/ImageUploadInput'
import RichTextEditor from '@/components/RichTextEditor'
import TroopPreviewModal from '@/components/TroopPreviewModal'

const SECTIONS = [
  { id: 'basic',   label: '基本信息' },
  { id: 'images',  label: '圖片上傳' },
  { id: 'stats',   label: '兵種屬性' },
  { id: 'talent',  label: '兵種天賦' },
  { id: 'publish', label: '發佈設置' },
]

const TROOP_TYPES = [
  { value: 'mobster',  label: '暴徒' },
  { value: 'gunman',   label: '槍手' },
  { value: 'biker',    label: '飛車黨' },
  { value: 'vehicle',  label: '改裝車輛' },
]

interface TroopCategory { id: string; name: string; slug: string }
interface TalentEntry { icon: string; content: string }

function TalentIconInput({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
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
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <div className="w-12 h-12 rounded border border-wiki-border bg-wiki-gray overflow-hidden flex items-center justify-center cursor-pointer"
        onClick={() => fileRef.current?.click()}>
        {value
          ? <img src={value} alt="icon" className="w-full h-full object-contain" />
          : <span className="text-wiki-text-muted text-xl">{uploading ? '…' : '+'}</span>}
      </div>
      <button type="button" disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="text-xs text-wiki-text-muted hover:text-wiki-accent transition-colors">
        {uploading ? '上傳…' : '上傳圖標'}
      </button>
      {value && (
        <button type="button" onClick={() => onChange('')}
          className="text-xs text-red-400 hover:text-red-300">清除</button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
    </div>
  )
}

function tryParseArr(val: any): TalentEntry[] {
  if (!val) return []
  if (typeof val === 'object' && Array.isArray(val)) return val
  try {
    const parsed = JSON.parse(val)
    if (Array.isArray(parsed)) return parsed
    return [{ icon: '', content: val }]
  } catch {
    return typeof val === 'string' && val.trim() ? [{ icon: '', content: val }] : []
  }
}

const cardCls  = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'
const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none'
const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'

export default function AdminTroopEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { isAdmin, isLoaded } = useAdminAuth()

  const [categories, setCategories] = useState<TroopCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('basic')
  const [showPreview, setShowPreview] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const [form, setForm] = useState({
    name: '',
    slug: '',
    summary: '',
    categoryId: '',
    troopType: '',
    icon: '',
    iconPosition: '50% 50%',
    image: '',
    imagePosition: '50% 50%',
    combatPower: 0,
    attack: 0,
    defense: 0,
    hp: 0,
    speed: 0,
    load: 0,
    attackRange: 0,
    cashCost: 0,
    sortOrder: 0,
    isFeatured: false,
    isPublished: false,
  })
  const [talents, setTalents] = useState<TalentEntry[]>([])

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
  }, [isAdmin, isLoaded, router])

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/admin/troops/${id}`).then(r => r.json()),
      fetch('/api/admin/troop-categories').then(r => r.json()),
    ]).then(([troop, cats]) => {
      setCategories(Array.isArray(cats) ? cats : [])
      if (troop && !troop.error) {
        setForm({
          name: troop.name || '',
          slug: troop.slug || '',
          summary: troop.summary || '',
          categoryId: troop.categoryId || '',
          troopType: troop.troopType || '',
          icon: troop.icon || '',
          iconPosition: troop.iconPosition || '50% 50%',
          image: troop.image || '',
          imagePosition: troop.imagePosition || '50% 50%',
          combatPower: troop.combatPower || 0,
          attack: troop.attack || 0,
          defense: troop.defense || 0,
          hp: troop.hp || 0,
          speed: troop.speed || 0,
          load: troop.load || 0,
          attackRange: troop.attackRange || 0,
          cashCost: troop.cashCost || 0,
          sortOrder: troop.sortOrder || 0,
          isFeatured: troop.isFeatured || false,
          isPublished: troop.isPublished || false,
        })
        setTalents(tryParseArr(troop.talent))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      for (const sec of SECTIONS) {
        const el = sectionRefs.current[sec.id]
        if (el && el.offsetTop <= scrollY + 140) setActiveSection(sec.id)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (sid: string) => {
    const el = sectionRefs.current[sid]
    if (el) window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' })
  }

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) { alert('請填寫兵種名稱和 Slug'); return }
    setSaving(true); setSaved(false)
    try {
      const res = await fetch(`/api/admin/troops/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, talent: JSON.stringify(talents) }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || '保存失敗') }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      alert(e.message || '保存失敗')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded || loading) {
    return <div className="min-h-screen bg-wiki-bg flex items-center justify-center text-wiki-text-muted">載入中...</div>
  }

  return (
    <div className="min-h-screen bg-wiki-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* 左側 Sticky 導航 */}
          <div className="w-48 flex-shrink-0 hidden lg:block">
            <div className="sticky top-8 space-y-1">
              <div className="text-wiki-text-muted text-xs font-bold uppercase tracking-wider mb-3 px-3">編輯兵種</div>
              {SECTIONS.map(sec => (
                <button key={sec.id} type="button" onClick={() => scrollTo(sec.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    activeSection === sec.id ? 'bg-wiki-accent/15 text-wiki-accent font-bold' : 'text-wiki-text-muted hover:text-wiki-text'
                  }`}>
                  {sec.label}
                </button>
              ))}
              <div className="pt-4 space-y-2">
                <button type="button" onClick={handleSave} disabled={saving}
                  className="w-full py-2.5 bg-wiki-accent text-wiki-dark font-bold text-sm rounded hover:bg-wiki-accent/90 transition-colors disabled:opacity-50">
                  {saving ? '保存中...' : saved ? '✓ 已保存' : '保存'}
                </button>
                <button type="button" onClick={() => setShowPreview(true)}
                  className="w-full py-2.5 bg-wiki-gray border border-wiki-border text-wiki-text text-sm font-bold rounded hover:border-wiki-accent hover:text-wiki-accent transition-colors">
                  👁 預覽效果
                </button>
                <Link href="/admin/troops"
                  className="block w-full py-2 text-center text-wiki-text-muted text-sm hover:text-wiki-accent transition-colors">
                  ← 返回列表
                </Link>
              </div>
            </div>
          </div>

          {/* 右側表單 */}
          <div className="flex-1 space-y-8 min-w-0">
            <div className="flex items-center justify-between lg:hidden">
              <h1 className="text-xl font-bold text-wiki-text"><span className="text-wiki-accent mr-2">◆</span>編輯兵種</h1>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-wiki-accent text-wiki-dark font-bold text-sm rounded disabled:opacity-50">
                  {saving ? '保存中...' : '保存'}
                </button>
                <Link href="/admin/troops" className="px-4 py-2 bg-wiki-gray text-wiki-text text-sm rounded">返回</Link>
              </div>
            </div>

            {/* Section 1: 基本信息 */}
            <section ref={el => { sectionRefs.current['basic'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>基本信息
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>兵種名稱 *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="如：暴徒 Lv.1" />
                </div>
                <div>
                  <label className={labelCls}>URL Slug *</label>
                  <input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} placeholder="英文小寫，如：mobster-lv1" />
                </div>
                <div>
                  <label className={labelCls}>所屬分類</label>
                  <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className={inputCls + ' cursor-pointer'}>
                    <option value="">請選擇分類</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>兵種類型</label>
                  <select value={form.troopType} onChange={e => set('troopType', e.target.value)} className={inputCls + ' cursor-pointer'}>
                    <option value="">請選擇類型</option>
                    {TROOP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>兵種簡介</label>
                  <textarea value={form.summary} onChange={e => set('summary', e.target.value)}
                    rows={2} className={inputCls + ' resize-none'}
                    placeholder="用於列表頁卡片展示的一句話描述" />
                </div>
              </div>
            </section>

            {/* Section 2: 圖片上傳 */}
            <section ref={el => { sectionRefs.current['images'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>圖片上傳
              </h2>
              <div className="space-y-6">
                <ImageUploadInput
                  label="圖標（方形小圖）"
                  value={form.icon} position={form.iconPosition}
                  onChange={url => set('icon', url)}
                  onPositionChange={pos => set('iconPosition', pos)}
                  compact
                />
                <ImageUploadInput
                  label="Banner 圖（寬幅大圖，選填）"
                  value={form.image} position={form.imagePosition}
                  onChange={url => set('image', url)}
                  onPositionChange={pos => set('imagePosition', pos)}
                  previewHeight="h-48"
                />
              </div>
            </section>

            {/* Section 3: 兵種屬性 */}
            <section ref={el => { sectionRefs.current['stats'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>兵種屬性
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'combatPower', label: '戰鬥力' },
                  { key: 'attack',      label: '攻擊' },
                  { key: 'defense',     label: '防禦' },
                  { key: 'hp',          label: '生命' },
                  { key: 'speed',       label: '速度' },
                  { key: 'load',        label: '負重' },
                  { key: 'attackRange', label: '攻擊距離' },
                  { key: 'cashCost',    label: '現金支出' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input type="number" value={(form as any)[key]}
                      onChange={e => set(key, parseInt(e.target.value) || 0)}
                      className={inputCls} min={0} />
                  </div>
                ))}
              </div>
            </section>

            {/* Section 4: 兵種天賦 */}
            <section ref={el => { sectionRefs.current['talent'] = el }} className={cardCls}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-wiki-text font-bold text-base flex items-center gap-2">
                  <span className="text-wiki-accent">◆</span>兵種天賦
                </h2>
                <button type="button"
                  onClick={() => setTalents(t => [...t, { icon: '', content: '' }])}
                  className="text-sm text-wiki-accent border border-wiki-accent px-3 py-1 hover:bg-wiki-accent hover:text-wiki-bg transition-colors rounded">
                  + 新增天賦
                </button>
              </div>
              <div className="space-y-4">
                {talents.map((entry, i) => (
                  <div key={i} className="bg-wiki-gray border border-wiki-border rounded-lg p-4 flex gap-4 items-start">
                    <TalentIconInput
                      value={entry.icon}
                      onChange={url => setTalents(t => t.map((e, j) => j === i ? { ...e, icon: url } : e))}
                    />
                    <div className="flex-1 min-w-0">
                      <RichTextEditor
                        value={entry.content}
                        onChange={html => setTalents(t => t.map((e, j) => j === i ? { ...e, content: html } : e))}
                        minHeight="min-h-[100px]"
                      />
                    </div>
                    <button type="button"
                      onClick={() => setTalents(t => t.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-300 text-lg leading-none flex-shrink-0 mt-1">×</button>
                  </div>
                ))}
                {talents.length === 0 && (
                  <p className="text-wiki-text-muted text-sm text-center py-6 border border-dashed border-wiki-border rounded-lg">
                    尚無天賦，點擊右上角「+ 新增天賦」
                  </p>
                )}
              </div>
            </section>

            {/* Section 5: 發佈設置 */}
            <section ref={el => { sectionRefs.current['publish'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>發佈設置
              </h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div onClick={() => set('isPublished', !form.isPublished)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${form.isPublished ? 'bg-wiki-accent' : 'bg-wiki-border'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isPublished ? 'left-6' : 'left-1'}`} />
                  </div>
                  <span className="text-wiki-text font-bold">
                    {form.isPublished ? '已發佈（公開可見）' : '草稿（暫不公開）'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>排序值</label>
                    <input type="number" value={form.sortOrder}
                      onChange={e => set('sortOrder', parseInt(e.target.value) || 0)}
                      className={inputCls} />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div onClick={() => set('isFeatured', !form.isFeatured)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${form.isFeatured ? 'bg-wiki-accent' : 'bg-wiki-border'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isFeatured ? 'left-6' : 'left-1'}`} />
                      </div>
                      <span className="text-wiki-text text-sm font-bold">推薦展示</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {showPreview && (
              <TroopPreviewModal
                form={{ ...form, talent: JSON.stringify(talents) }}
                categoryName={categories.find(c => c.id === form.categoryId)?.name}
                onClose={() => setShowPreview(false)}
              />
            )}

            <div className="flex gap-4 pb-16">
              <button type="button" onClick={handleSave} disabled={saving}
                className="px-8 py-3 bg-wiki-accent text-wiki-dark font-bold rounded-lg hover:bg-wiki-accent/90 transition-colors disabled:opacity-50">
                {saving ? '保存中...' : saved ? '✓ 已保存' : '保存兵種'}
              </button>
              <Link href="/admin/troops"
                className="px-8 py-3 bg-wiki-gray text-wiki-text font-bold rounded-lg hover:bg-wiki-border transition-colors">
                返回列表
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
