'use client'

export const runtime = 'edge'

import { useState, useEffect, useRef } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ImageUploadInput from '@/components/ImageUploadInput'
import RichTextEditor from '@/components/RichTextEditor'
import EventPreviewModal from '@/components/EventPreviewModal'

const SECTIONS = [
  { id: 'basic',     label: '基本信息' },
  { id: 'images',    label: '圖片上傳' },
  { id: 'condition', label: '參與條件' },
  { id: 'gameplay',  label: '活動玩法' },
  { id: 'rewards',   label: '活動獎勵' },
  { id: 'guides',    label: '相關攻略' },
  { id: 'publish',   label: '發佈設置' },
]

interface EventCategory { id: string; name: string; slug: string }
interface ArticleOption { id: string; title: string }

const cardCls  = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'
const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none'
const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'

export default function AdminEventEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { isAdmin, isLoaded } = useAdminAuth()

  const [categories, setCategories] = useState<EventCategory[]>([])
  const [allArticles, setAllArticles] = useState<ArticleOption[]>([])
  const [articleSearch, setArticleSearch] = useState('')
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
    condition: '',
    gameplay: '',
    rewards: '',
    relatedArticleIds: [] as string[],
    sortOrder: 0,
    isFeatured: false,
    isPublished: false,
  })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
  }, [isAdmin, isLoaded, router])

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/admin/events/${id}`).then(r => r.json()),
      fetch('/api/admin/event-categories').then(r => r.json()),
      fetch('/api/admin/articles?limit=200').then(r => r.json()),
    ]).then(([event, cats, arts]) => {
      setCategories(Array.isArray(cats) ? cats : [])
      setAllArticles(arts?.articles || [])
      if (event && !event.error) {
        let articleIds: string[] = []
        try { articleIds = JSON.parse(event.relatedArticleIds || '[]') } catch { articleIds = [] }
        setForm({
          name: event.name || '',
          slug: event.slug || '',
          summary: event.summary || '',
          categoryId: event.categoryId || '',
          icon: event.icon || '',
          iconPosition: event.iconPosition || '50% 50%',
          image: event.image || '',
          imagePosition: event.imagePosition || '50% 50%',
          condition: event.condition || '',
          gameplay: event.gameplay || '',
          rewards: event.rewards || '',
          relatedArticleIds: Array.isArray(articleIds) ? articleIds : [],
          sortOrder: event.sortOrder || 0,
          isFeatured: event.isFeatured || false,
          isPublished: event.isPublished || false,
        })
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
    if (!form.name.trim() || !form.slug.trim()) { alert('請填寫活動名稱和 Slug'); return }
    setSaving(true); setSaved(false)
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
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
              <div className="text-wiki-text-muted text-xs font-bold uppercase tracking-wider mb-3 px-3">編輯活動</div>
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
                <Link href="/admin/events"
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
              <h1 className="text-xl font-bold text-wiki-text"><span className="text-wiki-accent mr-2">◆</span>編輯活動</h1>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-wiki-accent text-wiki-dark font-bold text-sm rounded disabled:opacity-50">
                  {saving ? '保存中...' : '保存'}
                </button>
                <Link href="/admin/events" className="px-4 py-2 bg-wiki-gray text-wiki-text text-sm rounded">返回</Link>
              </div>
            </div>

            {/* Section 1: 基本信息 */}
            <section ref={el => { sectionRefs.current['basic'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>基本信息
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>活動名稱 *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="如：跨服爭霸賽" />
                </div>
                <div>
                  <label className={labelCls}>URL Slug *</label>
                  <input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} placeholder="英文小寫，如：cross-server-clash" />
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
                  <label className={labelCls}>活動簡介</label>
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

            {/* Section 3: 參與條件 */}
            <section ref={el => { sectionRefs.current['condition'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>參與條件
              </h2>
              <RichTextEditor value={form.condition} onChange={html => set('condition', html)} minHeight="min-h-[120px]" placeholder="如：總部等級達到 10 級可參與" />
            </section>

            {/* Section 4: 活動玩法 */}
            <section ref={el => { sectionRefs.current['gameplay'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>活動玩法
              </h2>
              <RichTextEditor value={form.gameplay} onChange={html => set('gameplay', html)} minHeight="min-h-[160px]" placeholder="活動規則、玩法步驟說明" />
            </section>

            {/* Section 5: 活動獎勵 */}
            <section ref={el => { sectionRefs.current['rewards'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>活動獎勵
              </h2>
              <RichTextEditor value={form.rewards} onChange={html => set('rewards', html)} minHeight="min-h-[120px]" placeholder="獎勵一覽" />
            </section>

            {/* Section 6: 相關攻略（關聯文章） */}
            <section ref={el => { sectionRefs.current['guides'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>相關攻略
              </h2>
              <p className="text-wiki-text-muted text-xs mb-3">從文章庫勾選關聯攻略，詳情頁將展示為文章鏈接</p>
              <input
                className="w-full bg-wiki-gray border border-wiki-border px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none mb-3"
                placeholder="搜尋文章標題..."
                value={articleSearch}
                onChange={e => setArticleSearch(e.target.value)}
              />
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allArticles
                  .filter(art => !articleSearch || art.title.toLowerCase().includes(articleSearch.toLowerCase()))
                  .map(art => {
                    const sel = form.relatedArticleIds.includes(art.id)
                    return (
                      <label key={art.id}
                        className={`flex items-center gap-2 p-3 border cursor-pointer transition-colors rounded
                          ${sel ? 'border-wiki-accent bg-wiki-accent/10' : 'border-wiki-border bg-wiki-gray hover:border-wiki-accent/50'}`}>
                        <input type="checkbox" className="accent-wiki-accent"
                          checked={sel}
                          onChange={e => set('relatedArticleIds', e.target.checked ? [...form.relatedArticleIds, art.id] : form.relatedArticleIds.filter(id => id !== art.id))} />
                        <span className="text-sm text-wiki-text truncate">{art.title}</span>
                      </label>
                    )
                  })}
                {allArticles.length === 0 && <p className="text-wiki-text-muted text-sm text-center py-4">文章庫為空</p>}
              </div>
              {form.relatedArticleIds.length > 0 && (
                <p className="text-xs text-wiki-text-muted mt-2">已選 {form.relatedArticleIds.length} 篇</p>
              )}
            </section>

            {/* Section 7: 發佈設置 */}
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
              <EventPreviewModal
                form={form}
                categoryName={categories.find(c => c.id === form.categoryId)?.name}
                relatedArticleTitles={allArticles.filter(a => form.relatedArticleIds.includes(a.id)).map(a => a.title)}
                onClose={() => setShowPreview(false)}
              />
            )}

            {/* 底部按鈕 */}
            <div className="flex gap-4 pb-16">
              <button type="button" onClick={handleSave} disabled={saving}
                className="px-8 py-3 bg-wiki-accent text-wiki-dark font-bold rounded-lg hover:bg-wiki-accent/90 transition-colors disabled:opacity-50">
                {saving ? '保存中...' : saved ? '✓ 已保存' : '保存活動'}
              </button>
              <Link href="/admin/events"
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
