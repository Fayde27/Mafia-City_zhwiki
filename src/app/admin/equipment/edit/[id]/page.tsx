'use client'

export const runtime = 'edge'

import { useState, useEffect, useRef } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ImageUploadInput from '@/components/ImageUploadInput'
import RichTextEditor from '@/components/RichTextEditor'
import EquipmentPreviewModal from '@/components/EquipmentPreviewModal'
import {
  EQUIP_TYPE_LABELS, rarityTiersFor, SLOT_OPTIONS, BUFF_GROUPS, KIND_PRESETS,
  parseBuffs, BuffGroup, parseMainAttr, MainAttr, DEFAULT_MAIN_ATTR,
} from '@/lib/equipment'

interface EquipmentCategory { id: string; name: string; slug: string }
interface EquipmentSet { id: string; name: string; slug: string; equipType: string; setBonus?: string }

const cardCls  = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'
const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none'
const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'

const isHaojie = (t: string) => t === 'haojie_weapon' || t === 'haojie_warbadge'

export default function AdminEquipmentEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { isAdmin, isLoaded } = useAdminAuth()

  const [categories, setCategories] = useState<EquipmentCategory[]>([])
  const [sets, setSets] = useState<EquipmentSet[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('basic')
  const [showPreview, setShowPreview] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const [form, setForm] = useState({
    name: '', slug: '', summary: '', equipType: 'leader',
    categoryId: '', icon: '', iconPosition: '50% 50%', image: '', imagePosition: '50% 50%',
    rarity: 3, type: '', slot: '', attrBias: '', stats: '', setId: '',
    acquisition: '', sortOrder: 0, isFeatured: false, isPublished: false,
  })
  const [buffsData, setBuffsData] = useState<BuffGroup[]>([])
  const [mainAttr, setMainAttr] = useState<MainAttr>({ ...DEFAULT_MAIN_ATTR, items: [] })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
  }, [isAdmin, isLoaded, router])

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/admin/equipment/${id}`).then(r => r.json()),
      fetch('/api/admin/equipment-categories').then(r => r.json()),
      fetch('/api/admin/equipment-sets').then(r => r.json()),
    ]).then(([eq, cats, setList]) => {
      setCategories(Array.isArray(cats) ? cats : [])
      setSets(Array.isArray(setList) ? setList : [])
      if (eq && !eq.error) {
        setForm({
          name: eq.name || '', slug: eq.slug || '', summary: eq.summary || '',
          equipType: eq.equipType || 'leader',
          categoryId: eq.categoryId || '',
          icon: eq.icon || '', iconPosition: eq.iconPosition || '50% 50%',
          image: eq.image || '', imagePosition: eq.imagePosition || '50% 50%',
          rarity: eq.rarity || 3, type: eq.type || '', slot: eq.slot || '',
          attrBias: eq.attrBias || '', stats: eq.stats || '', setId: eq.setId || '',
          acquisition: eq.acquisition || '', sortOrder: eq.sortOrder || 0,
          isFeatured: eq.isFeatured || false, isPublished: eq.isPublished || false,
        })
        setBuffsData(parseBuffs(eq.buffs))
        setMainAttr(parseMainAttr(eq.mainAttr))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  // 動態分區（依類型）
  const SECTIONS = [
    { id: 'basic',   label: '基本信息' },
    { id: 'images',  label: '圖片上傳' },
    { id: 'quality', label: '品質' },
    ...(isHaojie(form.equipType) ? [{ id: 'mainAttr', label: '主屬性（推薦）' }] : []),
    { id: 'attrs',   label: isHaojie(form.equipType) ? (form.equipType === 'haojie_weapon' ? '武器屬性' : '戰徽屬性') : '裝備屬性' },
    ...(!isHaojie(form.equipType) ? [{ id: 'set', label: '所屬套裝' }] : []),
    { id: 'source',  label: '獲得途徑' },
    { id: 'publish', label: '發佈設置' },
  ]

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
  })

  const scrollTo = (sid: string) => {
    const el = sectionRefs.current[sid]
    if (el) window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' })
  }

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  // buffs 編輯輔助
  const getGroup = (g: string): BuffGroup => buffsData.find(b => b.group === g) || { group: g, items: [] }
  const updateGroup = (g: string, items: { name: string; value: string }[]) => {
    setBuffsData(prev => {
      const others = prev.filter(b => b.group !== g)
      return [...others, { group: g, items }]
    })
  }
  const addBuffItem = (g: string) => { const grp = getGroup(g); updateGroup(g, [...grp.items, { name: '', value: '' }]) }
  const setBuffItem = (g: string, idx: number, key: 'name' | 'value', val: string) => {
    const grp = getGroup(g); const items = grp.items.map((it, i) => i === idx ? { ...it, [key]: val } : it); updateGroup(g, items)
  }
  const removeBuffItem = (g: string, idx: number) => { const grp = getGroup(g); updateGroup(g, grp.items.filter((_, i) => i !== idx)) }

  // 主屬性編輯輔助
  const addMainItem = () => setMainAttr(m => ({ ...m, items: [...m.items, { name: '', value: '' }] }))
  const setMainItem = (idx: number, key: 'name' | 'value', val: string) =>
    setMainAttr(m => ({ ...m, items: m.items.map((it, i) => i === idx ? { ...it, [key]: val } : it) }))
  const removeMainItem = (idx: number) => setMainAttr(m => ({ ...m, items: m.items.filter((_, i) => i !== idx) }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) { alert('請填寫名稱和 Slug'); return }
    setSaving(true); setSaved(false)
    try {
      const cleanBuffs = buffsData.filter(b => b.items.some(i => i.name || i.value))
      const cleanMain = { note: mainAttr.note, items: mainAttr.items.filter(i => i.name || i.value) }
      const payload = {
        ...form,
        buffs: isHaojie(form.equipType) ? JSON.stringify(cleanBuffs) : null,
        mainAttr: isHaojie(form.equipType) ? JSON.stringify(cleanMain) : null,
      }
      const res = await fetch(`/api/admin/equipment/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || '保存失敗') }
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (e: any) { alert(e.message || '保存失敗') }
    finally { setSaving(false) }
  }

  if (!isLoaded || loading) {
    return <div className="min-h-screen bg-wiki-bg flex items-center justify-center text-wiki-text-muted">載入中...</div>
  }

  const haojie = isHaojie(form.equipType)
  const typeLabel = EQUIP_TYPE_LABELS[form.equipType] || form.equipType
  const slotOpts = SLOT_OPTIONS[form.equipType] || []
  const kindPresets = KIND_PRESETS[form.equipType] || []
  const setOpts = sets.filter(s => s.equipType === form.equipType)
  const currentSet = sets.find(s => s.id === form.setId)

  return (
    <div className="min-h-screen bg-wiki-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* 左側 Sticky 導航 */}
          <div className="w-48 flex-shrink-0 hidden lg:block">
            <div className="sticky top-8 space-y-1">
              <div className="text-wiki-text-muted text-xs font-bold uppercase tracking-wider mb-1 px-3">編輯裝備</div>
              <div className="text-wiki-accent text-xs font-bold mb-3 px-3">{typeLabel}</div>
              {SECTIONS.map(sec => (
                <button key={sec.id} type="button" onClick={() => scrollTo(sec.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    activeSection === sec.id ? 'bg-wiki-accent/15 text-wiki-accent font-bold' : 'text-wiki-text-muted hover:text-wiki-text'
                  }`}>{sec.label}</button>
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
                <Link href="/admin/equipment" className="block w-full py-2 text-center text-wiki-text-muted text-sm hover:text-wiki-accent transition-colors">← 返回列表</Link>
              </div>
            </div>
          </div>

          {/* 右側表單 */}
          <div className="flex-1 space-y-8 min-w-0">
            <div className="flex items-center justify-between lg:hidden">
              <h1 className="text-xl font-bold text-wiki-text"><span className="text-wiki-accent mr-2">◆</span>編輯裝備（{typeLabel}）</h1>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-wiki-accent text-wiki-dark font-bold text-sm rounded disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
                <Link href="/admin/equipment" className="px-4 py-2 bg-wiki-gray text-wiki-text text-sm rounded">返回</Link>
              </div>
            </div>

            {/* 基本信息 */}
            <section ref={el => { sectionRefs.current['basic'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2"><span className="text-wiki-accent">◆</span>基本信息</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>名稱 *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>URL Slug *</label>
                  <input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} />
                </div>
                {haojie && (
                  <div>
                    <label className={labelCls}>{form.equipType === 'haojie_weapon' ? '武器種類' : '戰徽種類'}</label>
                    <input value={form.type} onChange={e => set('type', e.target.value)} list="kind-presets" className={inputCls} placeholder="可輸入或選擇" />
                    <datalist id="kind-presets">{kindPresets.map(k => <option key={k} value={k} />)}</datalist>
                  </div>
                )}
                {!haojie && (
                  <div>
                    <label className={labelCls}>部位</label>
                    <select value={form.slot} onChange={e => set('slot', e.target.value)} className={inputCls + ' cursor-pointer'}>
                      <option value="">請選擇部位</option>
                      {slotOpts.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className={labelCls}>所屬分類（選填）</label>
                  <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className={inputCls + ' cursor-pointer'}>
                    <option value="">不指定</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>簡介</label>
                  <textarea value={form.summary} onChange={e => set('summary', e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="列表卡片用的一句話描述" />
                </div>
              </div>
            </section>

            {/* 圖片上傳 */}
            <section ref={el => { sectionRefs.current['images'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2"><span className="text-wiki-accent">◆</span>圖片上傳</h2>
              <div className="space-y-6">
                <ImageUploadInput label="圖標（方形小圖）" value={form.icon} position={form.iconPosition} onChange={url => set('icon', url)} onPositionChange={pos => set('iconPosition', pos)} compact />
                <ImageUploadInput label="Banner 圖（寬幅大圖，選填）" value={form.image} position={form.imagePosition} onChange={url => set('image', url)} onPositionChange={pos => set('imagePosition', pos)} previewHeight="h-48" />
              </div>
            </section>

            {/* 品質 */}
            <section ref={el => { sectionRefs.current['quality'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2"><span className="text-wiki-accent">◆</span>品質</h2>
              <div className="flex flex-wrap gap-2">
                {rarityTiersFor(form.equipType).map(t => (
                  <button key={t.value} type="button" onClick={() => set('rarity', t.value)}
                    className={`px-4 py-2 text-sm font-bold rounded border-2 transition-colors ${form.rarity === t.value ? 'text-white' : 'text-wiki-text-muted border-wiki-border bg-wiki-gray'}`}
                    style={form.rarity === t.value ? { backgroundColor: t.color, borderColor: t.color } : {}}>
                    {t.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 主屬性（豪傑武器/戰徽，隨機生成，展示推薦詞條） */}
            {haojie && (
              <section ref={el => { sectionRefs.current['mainAttr'] = el }} className={cardCls}>
                <h2 className="text-wiki-text font-bold text-base mb-2 flex items-center gap-2"><span className="text-wiki-accent">◆</span>主屬性（推薦）</h2>
                <p className="text-wiki-text-muted text-xs mb-4">主屬性為遊戲內隨機生成，此處維護「推薦詞條」供玩家參考（名稱 + 數值）。</p>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>說明文字</label>
                    <input value={mainAttr.note} onChange={e => setMainAttr(m => ({ ...m, note: e.target.value }))}
                      className={inputCls} placeholder="如：主屬性為隨機生成，以下為推薦詞條" />
                  </div>
                  <div className="border border-wiki-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-wiki-text font-bold text-sm">推薦詞條</span>
                      <button type="button" onClick={addMainItem} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold rounded hover:bg-wiki-accent/30">+ 添加詞條</button>
                    </div>
                    {mainAttr.items.length === 0 ? (
                      <p className="text-wiki-text-muted text-xs">暫無推薦詞條</p>
                    ) : (
                      <div className="space-y-2">
                        {mainAttr.items.map((it, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input value={it.name} onChange={e => setMainItem(idx, 'name', e.target.value)} className="flex-1 bg-wiki-gray border border-wiki-border px-3 py-2 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none" placeholder="主屬性名（如：暴擊率）" />
                            <input value={it.value} onChange={e => setMainItem(idx, 'value', e.target.value)} className="w-32 bg-wiki-gray border border-wiki-border px-3 py-2 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none" placeholder="數值（如：+15%）" />
                            <button type="button" onClick={() => removeMainItem(idx)} className="text-wiki-danger text-sm px-2 hover:opacity-70">刪除</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* 屬性 */}
            <section ref={el => { sectionRefs.current['attrs'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2">
                <span className="text-wiki-accent">◆</span>{haojie ? (form.equipType === 'haojie_weapon' ? '武器屬性' : '戰徽屬性') : '裝備屬性'}
              </h2>

              {haojie ? (
                <div className="space-y-5">
                  <p className="text-wiki-text-muted text-xs">分類固定，下方細分詞條可自由增刪（名稱 + 數值）。</p>
                  {BUFF_GROUPS.map(g => {
                    const grp = getGroup(g)
                    return (
                      <div key={g} className="border border-wiki-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-wiki-text font-bold text-sm">{g}</span>
                          <button type="button" onClick={() => addBuffItem(g)} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold rounded hover:bg-wiki-accent/30">+ 添加細分</button>
                        </div>
                        {grp.items.length === 0 ? (
                          <p className="text-wiki-text-muted text-xs">暫無細分屬性</p>
                        ) : (
                          <div className="space-y-2">
                            {grp.items.map((it, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <input value={it.name} onChange={e => setBuffItem(g, idx, 'name', e.target.value)} className="flex-1 bg-wiki-gray border border-wiki-border px-3 py-2 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none" placeholder="細分屬性名（如：攻擊）" />
                                <input value={it.value} onChange={e => setBuffItem(g, idx, 'value', e.target.value)} className="w-32 bg-wiki-gray border border-wiki-border px-3 py-2 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none" placeholder="數值（如：10%）" />
                                <button type="button" onClick={() => removeBuffItem(g, idx)} className="text-wiki-danger text-sm px-2 hover:opacity-70">刪除</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {form.equipType === 'leader' && (
                    <div>
                      <label className={labelCls}>屬性偏向</label>
                      <input value={form.attrBias} onChange={e => set('attrBias', e.target.value)} className={inputCls} placeholder="如：偏攻擊 / 偏防禦" />
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>裝備屬性</label>
                    <RichTextEditor value={form.stats} onChange={html => set('stats', html)} minHeight="min-h-[120px]" placeholder="每行一條屬性，如：攻擊 +120 / 生命 +800（可加內鏈）" />
                  </div>
                </div>
              )}
            </section>

            {/* 所屬套裝（首領/英雄） */}
            {!haojie && (
              <section ref={el => { sectionRefs.current['set'] = el }} className={cardCls}>
                <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2"><span className="text-wiki-accent">◆</span>所屬套裝</h2>
                <div className="space-y-3">
                  <select value={form.setId} onChange={e => set('setId', e.target.value)} className={inputCls + ' cursor-pointer'}>
                    <option value="">不屬於任何套裝</option>
                    {setOpts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {currentSet?.setBonus && (
                    <div className="bg-wiki-gray rounded-lg p-3 text-sm text-wiki-text-muted whitespace-pre-line">套裝加成：{currentSet.setBonus}</div>
                  )}
                  <p className="text-wiki-text-muted text-xs">套裝在「<Link href="/admin/equipment-sets" className="text-wiki-accent hover:underline">套裝管理</Link>」中維護。</p>
                </div>
              </section>
            )}

            {/* 獲得途徑 */}
            <section ref={el => { sectionRefs.current['source'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2"><span className="text-wiki-accent">◆</span>獲得途徑</h2>
              <p className="text-wiki-text-muted text-xs mb-3">支持富文本（含鏈接）</p>
              <RichTextEditor value={form.acquisition} onChange={html => set('acquisition', html)} minHeight="min-h-[120px]" />
            </section>

            {/* 發佈設置 */}
            <section ref={el => { sectionRefs.current['publish'] = el }} className={cardCls}>
              <h2 className="text-wiki-text font-bold text-base mb-5 flex items-center gap-2"><span className="text-wiki-accent">◆</span>發佈設置</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div onClick={() => set('isPublished', !form.isPublished)} className={`w-11 h-6 rounded-full transition-colors relative ${form.isPublished ? 'bg-wiki-accent' : 'bg-wiki-border'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isPublished ? 'left-6' : 'left-1'}`} />
                  </div>
                  <span className="text-wiki-text font-bold">{form.isPublished ? '已發佈（公開可見）' : '草稿（暫不公開）'}</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>排序值</label>
                    <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', parseInt(e.target.value) || 0)} className={inputCls} />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div onClick={() => set('isFeatured', !form.isFeatured)} className={`w-11 h-6 rounded-full transition-colors relative ${form.isFeatured ? 'bg-wiki-accent' : 'bg-wiki-border'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isFeatured ? 'left-6' : 'left-1'}`} />
                      </div>
                      <span className="text-wiki-text text-sm font-bold">推薦展示</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {showPreview && (
              <EquipmentPreviewModal
                form={{ ...form, buffs: JSON.stringify(buffsData), mainAttr: JSON.stringify(mainAttr) }}
                setName={currentSet?.name}
                setBonus={currentSet?.setBonus}
                onClose={() => setShowPreview(false)}
              />
            )}

            <div className="flex gap-4 pb-16">
              <button type="button" onClick={handleSave} disabled={saving} className="px-8 py-3 bg-wiki-accent text-wiki-dark font-bold rounded-lg hover:bg-wiki-accent/90 transition-colors disabled:opacity-50">
                {saving ? '保存中...' : saved ? '✓ 已保存' : '保存裝備'}
              </button>
              <Link href="/admin/equipment" className="px-8 py-3 bg-wiki-gray text-wiki-text font-bold rounded-lg hover:bg-wiki-border transition-colors">返回列表</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
