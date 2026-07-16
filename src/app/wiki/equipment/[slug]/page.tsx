'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { EQUIP_TYPE_LABELS, rarityInfo, fieldLabel } from '@/lib/equipment'

interface Equipment {
  id: string; name: string; slug: string; summary?: string
  icon: string; image: string; iconPosition?: string; imagePosition?: string
  rarity: number; type?: string; slot?: string; attrBias?: string; equipType: string
  set?: { name?: string } | null
}

// 取某筆裝備在指定 field 上用於比較的值（套裝取 set.name）
const fieldVal = (e: Equipment, field: string): string =>
  field === 'set' ? String(e.set?.name ?? '') : String((e as any)[field] ?? '')

interface FilterOption { id: string; type: string; value: string; field: string; sortOrder: number }

export default function EquipmentTypeListPage() {
  const params = useParams()
  const equipType = params?.slug as string
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [options, setOptions] = useState<FilterOption[]>([])
  const [loading, setLoading] = useState(true)
  // 後台自定義篩選：{ field: 選中的 value }，'all' / 未設 = 不過濾
  const [active, setActive] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/wiki/equipment?equipType=${equipType}`)
      .then(res => res.json())
      .then(data => { setEquipment(data?.equipment || []); setLoading(false) })
      .catch(() => setLoading(false))
    fetch(`/api/wiki/equipment/filter-options?equipType=${equipType}`)
      .then(res => res.json())
      .then(data => setOptions(Array.isArray(data) ? data : []))
      .catch(() => setOptions([]))
  }, [equipType])

  const typeLabel = EQUIP_TYPE_LABELS[equipType] || equipType

  // 後台配置的篩選按 field 分組（保留插入順序）
  const groups = options.reduce((acc, o) => {
    (acc[o.field] ||= { label: o.type || fieldLabel(equipType, o.field), field: o.field, values: [] }).values.push(o)
    return acc
  }, {} as Record<string, { label: string; field: string; values: FilterOption[] }>)
  const groupList = Object.values(groups)

  const filtered = equipment.filter(e => groupList.every(g => {
    const sel = active[g.field]
    return !sel || sel === 'all' || fieldVal(e, g.field) === sel
  }))

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">圖鑑</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/equipment" className="hover:text-wiki-accent">裝備圖鑑</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{typeLabel}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">{typeLabel}</h1>
        </div>

        {/* 篩選（僅顯示後台已配置的字段；未配置則不顯示篩選欄） */}
        {groupList.length > 0 && (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-4 md:p-6 mb-6 space-y-4">
            {groupList.map(g => {
              const sel = active[g.field] || 'all'
              const setSel = (v: string) => setActive(prev => ({ ...prev, [g.field]: v }))
              const isRarity = g.field === 'rarity'
              return (
                <div key={g.field}>
                  <div className="text-sm font-bold text-wiki-accent uppercase tracking-wider mb-2">{g.label}</div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSel('all')} className={`px-3 py-1.5 text-xs font-bold ${sel === 'all' ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>全部</button>
                    {g.values.map(o => {
                      const r = isRarity ? rarityInfo(parseInt(o.value)) : null
                      const on = sel === o.value
                      return (
                        <button key={o.id} onClick={() => setSel(o.value)}
                          className={`px-3 py-1.5 text-xs font-bold ${on ? (r ? 'text-white' : 'bg-wiki-accent text-wiki-darker') : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}
                          style={on && r ? { backgroundColor: r.color } : {}}>{r ? r.label : o.value}</button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 md:p-12 text-center text-wiki-text-muted">暫無裝備</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {filtered.map((item) => {
              const r = rarityInfo(item.rarity)
              return (
                <Link key={item.id} href={`/wiki/equipment/${equipType}/${item.slug}`}
                  className="bg-wiki-gray-light border-2 rounded-lg overflow-hidden group block hover:shadow-lg transition-all"
                  style={{ borderColor: r.color }}>
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-wiki-gray to-wiki-darker">
                    {item.icon ? (
                      <img src={item.icon} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" style={{ objectPosition: item.iconPosition || '50% 50%' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><span className="text-5xl text-wiki-text-muted">{item.name[0]}</span></div>
                    )}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold rounded text-white" style={{ backgroundColor: r.color }}>{r.label}</span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm md:text-base font-bold text-wiki-text group-hover:text-wiki-accent transition-colors truncate">{item.name}</h3>
                    {(item.type || item.slot) && <p className="text-wiki-text-muted text-xs mt-0.5">{item.type || item.slot}</p>}
                    {item.summary && <p className="text-wiki-text-muted text-xs mt-1 line-clamp-2">{item.summary}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <WikiFooter />
    </div>
  )
}
