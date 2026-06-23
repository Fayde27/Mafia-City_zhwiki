'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BUILDING_TYPE_LABELS, BUILDING_TYPE_OPTIONS } from '@/lib/building'

const cardCls  = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'
const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none'
const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'

export default function AdminBuildingNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ buildingType: 'inner', name: '', slug: '' })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    const t = searchParams.get('type')
    if (t && BUILDING_TYPE_OPTIONS.includes(t as any)) setForm(f => ({ ...f, buildingType: t }))
  }, [isAdmin, isLoaded, router, searchParams])

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  const handleCreate = async () => {
    if (!form.name.trim() || !form.slug.trim()) { alert('請填寫名稱和 Slug'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isPublished: false }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/admin/buildings/edit/${data.id}`)
      } else {
        const d = await res.json(); alert(d.error || '創建失敗')
      }
    } catch { alert('網絡錯誤') }
    finally { setSaving(false) }
  }

  if (!isLoaded) return <div className="min-h-screen bg-wiki-bg flex items-center justify-center text-wiki-text-muted">載入中...</div>
  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-wiki-bg">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">新增建築</h1>
          <Link href="/admin/buildings" className="px-4 py-2 bg-wiki-gray text-wiki-text font-bold text-sm hover:text-wiki-accent">返回列表</Link>
        </div>
        <p className="text-wiki-text-muted text-sm mb-6">先選擇類型並填寫名稱，創建後進入完整編輯頁填寫各分區內容。</p>

        <div className={cardCls + ' space-y-4'}>
          <div>
            <label className={labelCls}>建築類型 *</label>
            <select value={form.buildingType} onChange={e => set('buildingType', e.target.value)} className={inputCls + ' cursor-pointer'}>
              {BUILDING_TYPE_OPTIONS.map(t => <option key={t} value={t}>{BUILDING_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>名稱 *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="如：市政廳 / 賽季要塞 / 賽事祭壇" />
          </div>
          <div>
            <label className={labelCls}>URL Slug *</label>
            <input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} placeholder="英文小寫，如：city-hall" />
          </div>
          <div className="flex gap-4 pt-2">
            <button onClick={handleCreate} disabled={saving}
              className="px-8 py-3 bg-wiki-accent text-wiki-dark font-bold rounded-lg hover:bg-wiki-accent/90 transition-colors disabled:opacity-50">
              {saving ? '創建中...' : '創建並編輯'}
            </button>
            <Link href="/admin/buildings" className="px-8 py-3 bg-wiki-gray text-wiki-text font-bold rounded-lg hover:bg-wiki-border transition-colors">取消</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
