'use client'

export const runtime = 'edge'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ImageUploadInput from '@/components/ImageUploadInput'
import RichTextEditor from '@/components/RichTextEditor'
import BuildingPreviewModal from '@/components/BuildingPreviewModal'
import { BUILDING_TYPE_LABELS } from '@/lib/building'

// ─── 類型 ──────────────────────────────────────────────────────────────────────

interface BuildingCategory { id: string; name: string; slug: string }

interface UpgradeTable {
  columns: string[]
  rows: string[][]
}

const DEFAULT_UPGRADE_TABLE: UpgradeTable = {
  columns: ['等級', '升級條件', '建造時間', '效果加成'],
  rows: [],
}

// ─── 升級表格編輯器 ────────────────────────────────────────────────────────────

function UpgradeTableEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [table, setTable] = useState<UpgradeTable>(() => {
    try { return JSON.parse(value) || DEFAULT_UPGRADE_TABLE } catch { return DEFAULT_UPGRADE_TABLE }
  })

  const update = (next: UpgradeTable) => {
    setTable(next)
    onChange(JSON.stringify(next))
  }

  // 列操作
  const addCol = () => update({ ...table, columns: [...table.columns, '新列'], rows: table.rows.map(r => [...r, '']) })
  const delCol = (ci: number) => update({ ...table, columns: table.columns.filter((_, i) => i !== ci), rows: table.rows.map(r => r.filter((_, i) => i !== ci)) })
  const setColName = (ci: number, v: string) => { const cols = [...table.columns]; cols[ci] = v; update({ ...table, columns: cols }) }

  // 行操作
  const addRow = () => update({ ...table, rows: [...table.rows, table.columns.map(() => '')] })
  const delRow = (ri: number) => update({ ...table, rows: table.rows.filter((_, i) => i !== ri) })
  const setCell = (ri: number, ci: number, v: string) => {
    const rows = table.rows.map((r, i) => i === ri ? r.map((c, j) => j === ci ? v : c) : r)
    update({ ...table, rows })
  }

  const inputCls = 'w-full bg-wiki-gray border border-wiki-border px-2 py-1.5 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none'

  return (
    <div>
      {/* 說明 */}
      <p className="text-wiki-text-muted text-xs mb-3">可自由增刪列與行，表頭可重命名</p>

      <div className="overflow-x-auto rounded border border-wiki-border">
        <table className="w-full text-sm">
          {/* 表頭 */}
          <thead>
            <tr className="bg-wiki-gray">
              {table.columns.map((col, ci) => (
                <th key={ci} className="border-r border-wiki-border px-2 py-2 min-w-[100px]">
                  <div className="flex items-center gap-1">
                    <input
                      value={col}
                      onChange={e => setColName(ci, e.target.value)}
                      className="flex-1 bg-wiki-gray-light border border-wiki-border px-2 py-1 text-wiki-accent font-bold text-xs focus:border-wiki-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => delCol(ci)}
                      className="text-wiki-danger text-xs hover:opacity-70 flex-shrink-0"
                      title="刪除列"
                    >×</button>
                  </div>
                </th>
              ))}
              <th className="px-2 py-2 w-8">
                <button
                  type="button"
                  onClick={addCol}
                  className="text-wiki-accent text-lg leading-none hover:opacity-70"
                  title="添加列"
                >+</button>
              </th>
            </tr>
          </thead>

          {/* 數據行 */}
          <tbody>
            {table.rows.length === 0 && (
              <tr>
                <td colSpan={table.columns.length + 1} className="px-4 py-6 text-center text-wiki-text-muted text-sm">
                  暫無數據，點擊下方「添加行」開始填寫
                </td>
              </tr>
            )}
            {table.rows.map((row, ri) => (
              <tr key={ri} className="border-t border-wiki-border hover:bg-wiki-gray/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="border-r border-wiki-border px-1 py-1">
                    <input
                      value={cell}
                      onChange={e => setCell(ri, ci, e.target.value)}
                      className={inputCls}
                    />
                  </td>
                ))}
                <td className="px-2 py-1 text-center">
                  <button
                    type="button"
                    onClick={() => delRow(ri)}
                    className="text-wiki-danger text-xs hover:opacity-70"
                    title="刪除行"
                  >×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 px-4 py-2 bg-wiki-accent/10 border border-wiki-accent/30 text-wiki-accent text-sm font-bold rounded hover:bg-wiki-accent/20 transition-colors"
      >
        + 添加行
      </button>
    </div>
  )
}

// ─── 主編輯頁 ──────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'basic',      label: '基本信息' },
  { id: 'images',     label: '圖片上傳' },
  { id: 'attributes', label: '建築屬性' },
  { id: 'description',label: '建築詳細信息' },
  { id: 'upgrade',    label: '建築升級詳情' },
  { id: 'publish',    label: '發佈設置' },
]

const cardCls  = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'
const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none'
const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'

export default function AdminBuildingEditPage() {
  const { isAdmin, isLoaded } = useAdminAuth()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [categories, setCategories] = useState<BuildingCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('basic')
  const [showPreview, setShowPreview] = useState(false)

  const [form, setForm] = useState({
    buildingType: 'inner',
    name: '',
    slug: '',
    categoryId: '',
    summary: '',
    sortOrder: 0,
    isFeatured: false,
    icon: '',
    iconPosition: '50% 50%',
    image: '',
    imagePosition: '50% 50%',
    unlockCondition: '',
    type: '',
    function: '',
    description: '',
    upgradeLevels: JSON.stringify(DEFAULT_UPGRADE_TABLE),
    isPublished: false,
    publishedAt: '',
    // 向後兼容
    rarity: 3,
    level: 1,
    maxLevel: 30,
    cost: '',
    production: '',
    details: '',
    upgradeInfo: '',
  })

  // Scroll-spy refs
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoaded && !isAdmin) router.push('/admin/login')
  }, [isAdmin, isLoaded, router])

  // 載入數據
  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/admin/buildings/${id}`).then(r => r.json()),
      fetch('/api/admin/building-categories').then(r => r.json()),
    ]).then(([bld, cats]) => {
      setCategories(Array.isArray(cats) ? cats : [])
      if (bld && !bld.error) {
        setForm({
          buildingType: bld.buildingType || 'inner',
          name: bld.name || '',
          slug: bld.slug || '',
          categoryId: bld.categoryId || '',
          summary: bld.summary || '',
          sortOrder: bld.sortOrder || 0,
          isFeatured: bld.isFeatured || false,
          icon: bld.icon || '',
          iconPosition: bld.iconPosition || '50% 50%',
          image: bld.image || '',
          imagePosition: bld.imagePosition || '50% 50%',
          unlockCondition: bld.unlockCondition || '',
          type: bld.type || '',
          function: bld.function || '',
          description: bld.description || '',
          upgradeLevels: bld.upgradeLevels || JSON.stringify(DEFAULT_UPGRADE_TABLE),
          isPublished: bld.isPublished || false,
          publishedAt: bld.publishedAt ? bld.publishedAt.slice(0, 16) : '',
          rarity: bld.rarity || 3,
          level: bld.level || 1,
          maxLevel: bld.maxLevel || 30,
          cost: bld.cost || '',
          production: bld.production || '',
          details: bld.details || '',
          upgradeInfo: bld.upgradeInfo || '',
        })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  // Scroll-spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      for (const sec of SECTIONS) {
        const el = sectionRefs.current[sec.id]
        if (el && el.offsetTop <= scrollY + 140) {
          setActiveSection(sec.id)
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id]
    if (el) window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' })
  }

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) { alert('請填寫建築名稱和 Slug'); return }
    setSaving(true); setSaved(false)
    try {
      const body = {
        ...form,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
      }
      const res = await fetch(`/api/admin/buildings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
          {/* ── 左側 Sticky 導航 ─────────────────────────────── */}
          <div className="w-48 flex-shrink-0 hidden lg:block">
            <div className="sticky top-8 space-y-1">
              <div className="text-wiki-text-muted text-xs font-bold uppercase tracking-wider mb-3 px-3">
                編輯建築
                <span className="ml-1 text-wiki-accent">· {BUILDING_TYPE_LABELS[form.buildingType] || '內城建築'}</span>
              </div>
              {SECTIONS.map(sec => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollTo(sec.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    activeSection === sec.id
                      ? 'bg-wiki-accent/15 text-wiki-accent font-bold'
                      : 'text-wiki-text-muted hover:text-wiki-text'
                  }`}
                >
                  {sec.label}
                </button>
              ))}

              <div className="pt-4 space-y-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-2.5 bg-wiki-accent text-wiki-dark font-bold text-sm rounded hover:bg-wiki-accent/90 transition-colors disabled:opacity-50"
                >
                  {saving ? '保存中...' : saved ? '✓ 已保存' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="w-full py-2.5 bg-wiki-gray border border-wiki-border text-wiki-text text-sm font-bold rounded hover:border-wiki-accent hover:text-wiki-accent transition-colors"
                >
                  👁 預覽效果
                </button>
                <Link
                  href="/admin/buildings"
                  className="block w-full py-2 text-center text-wiki-text-muted text-sm hover:text-wiki-accent transition-colors"
                >
                  ← 返回列表
                </Link>
              </div>
            </div>
          </div>

          {/* ── 右側表單 ──────────────────────────────────────── */}
          <div ref={containerRef} className="flex-1 space-y-8 min-w-0">
            {/* 頂部操作欄（移動端） */}
            <div className="flex items-center justify-between lg:hidden">
              <h1 className="text-xl font-bold text-wiki-text">
                <span className="text-wiki-accent mr-2">◆</span>編輯建築
              </h1>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-wiki-accent text-wiki-dark font-bold text-sm rounded disabled:opacity-50">
                  {saving ? '保存中...' : '保存'}
                </button>
                <Link href="/admin/buildings" className="px-4 py-2 bg-wiki-gray text-wiki-text text-sm rounded">返回</Link>
              </div>
            </div>

            {/* ─ Section 1: 基本信息 ─ */}
            <section ref={el => { sectionRefs.current['basic'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>基本信息
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>建築名稱 *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    className={inputCls} placeholder="如：市政廳" required />
                </div>
                <div>
                  <label className={labelCls}>URL Slug *</label>
                  <input value={form.slug} onChange={e => set('slug', e.target.value)}
                    className={inputCls} placeholder="英文小寫，如：city-hall" required />
                </div>
                <div>
                  <label className={labelCls}>所屬分類</label>
                  <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}
                    className={inputCls + ' cursor-pointer'}>
                    <option value="">請選擇分類</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>簡短描述</label>
                  <textarea value={form.summary} onChange={e => set('summary', e.target.value)}
                    rows={2} className={inputCls + ' resize-none'} placeholder="用於列表頁卡片展示" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>排序值</label>
                    <input type="number" value={form.sortOrder}
                      onChange={e => set('sortOrder', parseInt(e.target.value) || 0)}
                      className={inputCls} />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        onClick={() => set('isFeatured', !form.isFeatured)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${form.isFeatured ? 'bg-wiki-accent' : 'bg-wiki-border'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isFeatured ? 'left-6' : 'left-1'}`} />
                      </div>
                      <span className="text-wiki-text text-sm font-bold">推薦展示</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* ─ Section 2: 圖片上傳 ─ */}
            <section ref={el => { sectionRefs.current['images'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>圖片上傳
              </h2>
              <div className="space-y-6">
                <ImageUploadInput
                  label="圖標（方形小圖）"
                  value={form.icon}
                  position={form.iconPosition}
                  onChange={url => set('icon', url)}
                  onPositionChange={pos => set('iconPosition', pos)}
                  compact
                />
                <ImageUploadInput
                  label="Banner 圖（寬幅大圖）"
                  value={form.image}
                  position={form.imagePosition}
                  onChange={url => set('image', url)}
                  onPositionChange={pos => set('imagePosition', pos)}
                  previewHeight="h-48"
                />
              </div>
            </section>

            {/* ─ Section 3: 建築屬性 ─ */}
            <section ref={el => { sectionRefs.current['attributes'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>建築屬性
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>開放條件</label>
                  <input value={form.unlockCondition} onChange={e => set('unlockCondition', e.target.value)}
                    className={inputCls} placeholder="如：總部等級達到 5 級" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>建築類型</label>
                    <input value={form.type} onChange={e => set('type', e.target.value)}
                      className={inputCls} placeholder="如：資源建築" />
                  </div>
                  <div>
                    <label className={labelCls}>建築核心功能</label>
                    <input value={form.function} onChange={e => set('function', e.target.value)}
                      className={inputCls} placeholder="如：生產金幣" />
                  </div>
                </div>
              </div>
            </section>

            {/* ─ Section 4: 建築詳細信息 ─ */}
            <section ref={el => { sectionRefs.current['description'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>建築詳細信息
              </h2>
              <RichTextEditor
                value={form.description}
                onChange={html => set('description', html)}
                minHeight="min-h-[200px]"
              />
            </section>

            {/* ─ Section 5: 建築升級詳情 ─ */}
            <section ref={el => { sectionRefs.current['upgrade'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>建築升級詳情
              </h2>
              <UpgradeTableEditor
                value={form.upgradeLevels}
                onChange={v => set('upgradeLevels', v)}
              />
            </section>

            {/* ─ Section 6: 發佈設置 ─ */}
            <section ref={el => { sectionRefs.current['publish'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>發佈設置
              </h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => set('isPublished', !form.isPublished)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${form.isPublished ? 'bg-wiki-accent' : 'bg-wiki-border'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isPublished ? 'left-6' : 'left-1'}`} />
                  </div>
                  <span className="text-wiki-text font-bold">
                    {form.isPublished ? '已發佈（公開可見）' : '草稿（暫不公開）'}
                  </span>
                </label>

                <div>
                  <label className={labelCls}>定時發佈時間（選填）</label>
                  <input
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={e => set('publishedAt', e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-wiki-text-muted text-xs mt-1">設置後，到達指定時間自動切換為已發佈狀態</p>
                </div>
              </div>
            </section>

            {/* 預覽 Modal */}
            {showPreview && (
              <BuildingPreviewModal
                form={form}
                categoryName={categories.find(c => c.id === form.categoryId)?.name}
                onClose={() => setShowPreview(false)}
              />
            )}

            {/* 底部保存 */}
            <div className="flex gap-4 pb-16">
              <button onClick={handleSave} disabled={saving}
                className="px-8 py-3 bg-wiki-accent text-wiki-dark font-bold rounded-lg hover:bg-wiki-accent/90 transition-colors disabled:opacity-50">
                {saving ? '保存中...' : saved ? '✓ 已保存' : '保存建築'}
              </button>
              <Link href="/admin/buildings"
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
