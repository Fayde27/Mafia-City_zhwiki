'use client'

export const runtime = 'edge'

import { useState, useEffect, useRef } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ImageUploadInput from '@/components/ImageUploadInput'
import RichTextEditor from '@/components/RichTextEditor'
import ItemPreviewModal from '@/components/ItemPreviewModal'

const ALL_SECTIONS = [
  { id: 'basic',    label: '基本信息' },
  { id: 'images',   label: '圖片上傳' },
  { id: 'exchange', label: '兌換內容' },
  { id: 'source',   label: '獲取途徑' },
  { id: 'publish',  label: '發佈設置' },
]

// 兌換道具關閉時不顯示「兌換內容」分區
function sectionsFor(isExchange: boolean) {
  return isExchange ? ALL_SECTIONS : ALL_SECTIONS.filter(s => s.id !== 'exchange')
}

interface ItemCategory { id: string; name: string; slug: string }

// 兌換內容結構
interface ExchangeItem { icon: string; name: string; quantity: string }
interface ExchangeContent { intro: string; items: ExchangeItem[] }
const DEFAULT_EXCHANGE: ExchangeContent = { intro: '將隨機獲得以下其中一項物品', items: [] }

const cardCls  = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'
const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none'
const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'

// ─── 兌換內容編輯器 ──────────────────────────────────────────────
function ExchangeContentEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  let parsed: ExchangeContent
  try { parsed = { ...DEFAULT_EXCHANGE, ...(JSON.parse(value) || {}) } } catch { parsed = DEFAULT_EXCHANGE }
  const data: ExchangeContent = { intro: parsed.intro ?? '', items: Array.isArray(parsed.items) ? parsed.items : [] }

  const update = (next: ExchangeContent) => onChange(JSON.stringify(next))
  const addItem = () => update({ ...data, items: [...data.items, { icon: '', name: '', quantity: '1' }] })
  const delItem = (i: number) => update({ ...data, items: data.items.filter((_, idx) => idx !== i) })
  const setItem = (i: number, key: keyof ExchangeItem, val: string) =>
    update({ ...data, items: data.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it) })

  const rowInput = 'w-full bg-wiki-gray border border-wiki-border px-3 py-2 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none'

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>說明文字</label>
        <input value={data.intro} onChange={e => update({ ...data, intro: e.target.value })}
          className={inputCls} placeholder="如：將隨機獲得以下其中一項物品" />
      </div>

      <div>
        <label className={labelCls}>可獲得物品列表</label>
        <p className="text-wiki-text-muted text-xs mb-3">每項為一個可獲得/兌換的物品，可上傳圖標、填寫名稱與數量</p>
        <div className="space-y-3">
          {data.items.length === 0 && (
            <p className="text-wiki-text-muted text-sm py-4 text-center border border-dashed border-wiki-border rounded-lg">
              暫無物品，點擊下方「+ 添加物品」開始填寫
            </p>
          )}
          {data.items.map((it, i) => (
            <div key={i} className="flex gap-4 items-start bg-wiki-gray rounded-lg p-3 border border-wiki-border">
              <div className="flex-shrink-0">
                <ImageUploadInput
                  label=""
                  value={it.icon}
                  onChange={url => setItem(i, 'icon', url)}
                  onPositionChange={() => {}}
                  compact
                />
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <RichTextEditor inline value={it.name} onChange={html => setItem(i, 'name', html)}
                  placeholder="物品名稱，如：6級紫寶石項鍊（可加內鏈）" />
                <input value={it.quantity} onChange={e => setItem(i, 'quantity', e.target.value)}
                  className={rowInput} placeholder="數量，如：1" />
              </div>
              <button type="button" onClick={() => delItem(i)}
                className="flex-shrink-0 text-wiki-danger text-sm hover:opacity-70 px-2 py-1" title="刪除此物品">×</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem}
          className="mt-3 px-4 py-2 bg-wiki-accent/10 border border-wiki-accent/30 text-wiki-accent text-sm font-bold rounded hover:bg-wiki-accent/20 transition-colors">
          + 添加物品
        </button>
      </div>
    </div>
  )
}

export default function AdminItemEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { isAdmin, isLoaded } = useAdminAuth()

  const [categories, setCategories] = useState<ItemCategory[]>([])
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
    icon: '',
    iconPosition: '50% 50%',
    image: '',
    imagePosition: '50% 50%',
    source: '',
    isExchange: false,
    exchangeContent: JSON.stringify(DEFAULT_EXCHANGE),
    sortOrder: 0,
    isFeatured: false,
    isPublished: false,
    // 保留舊字段（不在表單中顯示，但保存時帶回）
    rarity: 3,
    type: '',
    quality: '',
    stackable: true,
    effect: '',
    description: '',
    usage: '',
    recipe: '',
  })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
  }, [isAdmin, isLoaded, router])

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/admin/items/${id}`).then(r => r.json()),
      fetch('/api/admin/item-categories').then(r => r.json()),
    ]).then(([item, cats]) => {
      setCategories(Array.isArray(cats) ? cats : [])
      if (item && !item.error) {
        setForm({
          name: item.name || '',
          slug: item.slug || '',
          summary: item.summary || '',
          categoryId: item.categoryId || '',
          icon: item.icon || '',
          iconPosition: item.iconPosition || '50% 50%',
          image: item.image || '',
          imagePosition: item.imagePosition || '50% 50%',
          source: item.source || '',
          isExchange: item.isExchange || false,
          exchangeContent: item.exchangeContent || JSON.stringify(DEFAULT_EXCHANGE),
          sortOrder: item.sortOrder || 0,
          isFeatured: item.isFeatured || false,
          isPublished: item.isPublished || false,
          rarity: item.rarity || 3,
          type: item.type || '',
          quality: item.quality || '',
          stackable: item.stackable !== false,
          effect: item.effect || '',
          description: item.description || '',
          usage: item.usage || '',
          recipe: item.recipe || '',
        })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const sections = sectionsFor(form.isExchange)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      for (const sec of sections) {
        const el = sectionRefs.current[sec.id]
        if (el && el.offsetTop <= scrollY + 140) setActiveSection(sec.id)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections])

  const scrollTo = (sid: string) => {
    const el = sectionRefs.current[sid]
    if (el) window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' })
  }

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) { alert('請填寫道具名稱和 Slug'); return }
    setSaving(true); setSaved(false)
    try {
      const res = await fetch(`/api/admin/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
              <div className="text-wiki-text-muted text-xs font-bold uppercase tracking-wider mb-3 px-3">編輯道具</div>
              {sections.map(sec => (
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
                <Link href="/admin/items"
                  className="block w-full py-2 text-center text-wiki-text-muted text-sm hover:text-wiki-accent transition-colors">
                  ← 返回列表
                </Link>
              </div>
            </div>
          </div>

          {/* 右側表單 */}
          <div className="flex-1 space-y-8 min-w-0">
            {/* 移動端頂部 */}
            <div className="flex items-center justify-between lg:hidden">
              <h1 className="text-xl font-bold text-wiki-text"><span className="text-wiki-accent mr-2">◆</span>編輯道具</h1>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-wiki-accent text-wiki-dark font-bold text-sm rounded disabled:opacity-50">
                  {saving ? '保存中...' : '保存'}
                </button>
                <Link href="/admin/items" className="px-4 py-2 bg-wiki-gray text-wiki-text text-sm rounded">返回</Link>
              </div>
            </div>

            {/* Section 1: 基本信息 */}
            <section ref={el => { sectionRefs.current['basic'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>基本信息
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>道具名稱 *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="如：建造加速（1分鐘）" />
                </div>
                <div>
                  <label className={labelCls}>URL Slug *</label>
                  <input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} placeholder="英文小寫，如：speed-up-building-1m" />
                </div>
                <div>
                  <label className={labelCls}>所屬分類 *</label>
                  <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}
                    className={inputCls + ' cursor-pointer'}>
                    <option value="">請選擇分類</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>道具簡介</label>
                  <textarea value={form.summary} onChange={e => set('summary', e.target.value)}
                    rows={2} className={inputCls + ' resize-none'}
                    placeholder="用於列表頁卡片展示的一句話描述" />
                </div>
                {/* 是否為兌換道具 */}
                <div className="pt-1">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div onClick={() => set('isExchange', !form.isExchange)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${form.isExchange ? 'bg-wiki-accent' : 'bg-wiki-border'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isExchange ? 'left-6' : 'left-1'}`} />
                    </div>
                    <span className="text-wiki-text font-bold text-sm">是否為兌換道具（寶箱／兌換券）</span>
                  </label>
                  <p className="text-wiki-text-muted text-xs mt-1.5">開啟後將出現「兌換內容」分區，可編輯可獲得/兌換的物品列表</p>
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

            {/* Section: 兌換內容（僅兌換道具顯示） */}
            {form.isExchange && (
            <section ref={el => { sectionRefs.current['exchange'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>兌換內容
              </h2>
              <ExchangeContentEditor
                value={form.exchangeContent}
                onChange={v => set('exchangeContent', v)}
              />
            </section>
            )}

            {/* Section 3: 獲取途徑 */}
            <section ref={el => { sectionRefs.current['source'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>獲取途徑
              </h2>
              <p className="text-wiki-text-muted text-xs mb-3">可填寫文字描述，支持富文本（包含鏈接）</p>
              <RichTextEditor
                value={form.source}
                onChange={html => set('source', html)}
                minHeight="min-h-[120px]"
              />
            </section>

            {/* Section 4: 發佈設置 */}
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
              <ItemPreviewModal
                form={form}
                categoryName={categories.find(c => c.id === form.categoryId)?.name}
                onClose={() => setShowPreview(false)}
              />
            )}

            {/* 底部按鈕 */}
            <div className="flex gap-4 pb-16">
              <button type="button" onClick={handleSave} disabled={saving}
                className="px-8 py-3 bg-wiki-accent text-wiki-dark font-bold rounded-lg hover:bg-wiki-accent/90 transition-colors disabled:opacity-50">
                {saving ? '保存中...' : saved ? '✓ 已保存' : '保存道具'}
              </button>
              <Link href="/admin/items"
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
