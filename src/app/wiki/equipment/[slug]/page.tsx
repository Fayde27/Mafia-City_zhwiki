'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { EQUIP_TYPE_LABELS, rarityInfo, RARITY_TIERS, rarityTiersFor } from '@/lib/equipment'

interface Equipment {
  id: string; name: string; slug: string; summary?: string
  icon: string; image: string; iconPosition?: string; imagePosition?: string
  rarity: number; type?: string; slot?: string; equipType: string
}

const isHaojie = (t: string) => t === 'haojie_weapon' || t === 'haojie_warbadge'

export default function EquipmentTypeListPage() {
  const params = useParams()
  const equipType = params?.slug as string
  const { isAdmin } = useAdminAuth()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [rarityFilter, setRarityFilter] = useState(0) // 0 = 全部
  const [kindFilter, setKindFilter] = useState('all')  // 種類/部位

  useEffect(() => {
    fetch(`/api/wiki/equipment?equipType=${equipType}`)
      .then(res => res.json())
      .then(data => { setEquipment(data?.equipment || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [equipType])

  const typeLabel = EQUIP_TYPE_LABELS[equipType] || equipType
  const haojie = isHaojie(equipType)
  const kindKey = haojie ? 'type' : 'slot'
  const kindLabel = haojie ? '種類' : '部位'

  const kinds = Array.from(new Set(equipment.map(e => (e as any)[kindKey]).filter(Boolean)))
  const filtered = equipment
    .filter(e => rarityFilter === 0 || e.rarity === rarityFilter)
    .filter(e => kindFilter === 'all' || (e as any)[kindKey] === kindFilter)

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
          {isAdmin && (
            <Link href="/admin/equipment" className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90">管理裝備</Link>
          )}
        </div>

        {/* 篩選 */}
        <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-4 md:p-6 mb-6 space-y-4">
          <div>
            <div className="text-sm font-bold text-wiki-accent uppercase tracking-wider mb-2">品質</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setRarityFilter(0)} className={`px-3 py-1.5 text-xs font-bold ${rarityFilter === 0 ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>全部</button>
              {rarityTiersFor(equipType).map(t => (
                <button key={t.value} onClick={() => setRarityFilter(t.value)}
                  className={`px-3 py-1.5 text-xs font-bold ${rarityFilter === t.value ? 'text-white' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}
                  style={rarityFilter === t.value ? { backgroundColor: t.color } : {}}>{t.label}</button>
              ))}
            </div>
          </div>
          {kinds.length > 0 && (
            <div>
              <div className="text-sm font-bold text-wiki-accent uppercase tracking-wider mb-2">{kindLabel}</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setKindFilter('all')} className={`px-3 py-1.5 text-xs font-bold ${kindFilter === 'all' ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>全部</button>
                {kinds.map(k => (
                  <button key={k} onClick={() => setKindFilter(k)} className={`px-3 py-1.5 text-xs font-bold ${kindFilter === k ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>{k}</button>
                ))}
              </div>
            </div>
          )}
        </div>

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
