'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import LikeButton from '@/components/LikeButton'
import { EQUIP_TYPE_LABELS, rarityInfo, parseBuffs, parseMainAttr } from '@/lib/equipment'
import EquipmentBuffsList from '@/components/EquipmentBuffsList'

interface EquipSet { id: string; name: string; slug: string; setBonus?: string }
interface Equipment {
  id: string; likes?: number; name: string; slug: string; summary?: string
  icon: string; image: string; imagePosition?: string; iconPosition?: string
  rarity: number; type?: string; slot?: string; equipType: string
  attrBias?: string; buffs?: string; mainAttr?: string; stats?: string; acquisition?: string
  setId?: string; set?: EquipSet
}

const isHaojie = (t: string) => t === 'haojie_weapon' || t === 'haojie_warbadge'

export default function EquipmentDetailPage() {
  const params = useParams()
  const equipType = params?.slug as string
  const equipmentSlug = params?.equipmentSlug as string
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [setPieces, setSetPieces] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/wiki/equipment?equipType=${equipType}&slug=${equipmentSlug}`)
      .then(res => res.json())
      .then(data => {
        const eq = data.equipment?.[0] || null
        setEquipment(eq)
        setLoading(false)
        if (eq?.set?.id) {
          fetch(`/api/wiki/equipment?equipType=${equipType}`)
            .then(r => r.json())
            .then(d => setSetPieces((d.equipment || []).filter((p: Equipment) => p.set?.id === eq.set.id)))
            .catch(() => {})
        }
      })
      .catch(() => setLoading(false))
  }, [equipType, equipmentSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-bg"><WikiHeader />
        <div className="text-center py-20 text-wiki-text-muted">載入中...</div><WikiFooter />
      </div>
    )
  }
  if (!equipment) {
    return (
      <div className="min-h-screen bg-wiki-bg"><WikiHeader />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-12 text-center text-wiki-text-muted">裝備不存在</div>
        </main><WikiFooter />
      </div>
    )
  }

  const haojie = isHaojie(equipment.equipType)
  const r = rarityInfo(equipment.rarity)
  const typeLabel = EQUIP_TYPE_LABELS[equipment.equipType] || equipment.equipType
  const buffs = parseBuffs(equipment.buffs).filter(g => g.items.some(i => i.name || i.value))
  const mainAttr = parseMainAttr(equipment.mainAttr)
  const mainItems = mainAttr.items.filter(i => i.name || i.value)
  const hasStats = !!equipment.stats && equipment.stats.trim().length > 0
  const hasAcq = !!equipment.acquisition && equipment.acquisition.replace(/<[^>]*>/g, '').trim().length > 0

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/equipment" className="hover:text-wiki-accent">裝備圖鑑</Link>
          <span className="mx-2">/</span>
          <Link href={`/wiki/equipment/${equipment.equipType}`} className="hover:text-wiki-accent">{typeLabel}</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{equipment.name}</span>
        </div>

        {/* 標題區 */}
        {equipment.image ? (
          <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden mb-6 md:mb-8">
            <img src={equipment.image} alt={equipment.name} className="w-full h-full object-cover" style={{ objectPosition: equipment.imagePosition || '50% 50%' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
              <span className="inline-block px-2 py-0.5 text-xs font-bold rounded text-white mb-2" style={{ backgroundColor: r.color }}>{r.label}</span>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-white heading-hard">{equipment.name}</h1>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {equipment.icon && (
                <div className="w-24 h-24 rounded-lg overflow-hidden border-2 flex-shrink-0" style={{ borderColor: r.color }}>
                  <img src={equipment.icon} alt={equipment.name} className="w-full h-full object-cover" style={{ objectPosition: equipment.iconPosition || '50% 50%' }} />
                </div>
              )}
              <div>
                <span className="inline-block px-2 py-0.5 text-xs font-bold rounded text-white mb-1" style={{ backgroundColor: r.color }}>{r.label}</span>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">{equipment.name}</h1>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {equipment.summary && (
              <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6"><p className="text-wiki-text">{equipment.summary}</p></div>
            )}

            {/* 豪傑武器/戰徽：主屬性（推薦詞條） */}
            {haojie && mainItems.length > 0 && (
              <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-wiki-accent mb-1">主屬性（推薦）</h3>
                {mainAttr.note && <p className="text-wiki-text-muted text-sm mb-4">{mainAttr.note}</p>}
                <div className="flex flex-wrap gap-2">
                  {mainItems.map((it, i) => (
                    <span key={i} className="inline-flex items-center gap-2 bg-wiki-gray border border-wiki-border rounded-lg px-3 py-2 text-sm">
                      <span className="text-wiki-text">{it.name}</span>
                      {it.value && <span className="text-wiki-accent font-bold">{it.value}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 豪傑武器/戰徽：屬性列表（篩選 + 折疊展開） */}
            {haojie && buffs.length > 0 && (
              <EquipmentBuffsList
                buffs={buffs}
                title={equipment.equipType === 'haojie_weapon' ? '武器屬性' : '戰徽屬性'}
              />
            )}

            {/* 首領/英雄：裝備屬性 */}
            {!haojie && hasStats && (
              <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-wiki-accent mb-3">裝備屬性</h3>
                <MarkdownRenderer content={equipment.stats!} />
              </div>
            )}

            {/* 套裝 + 同套件數 */}
            {!haojie && equipment.set && (
              <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-wiki-accent mb-3">所屬套裝 · {equipment.set.name}</h3>
                {equipment.set.setBonus && <p className="text-wiki-text-muted text-sm whitespace-pre-line mb-4">{equipment.set.setBonus}</p>}
                {setPieces.length > 0 && (
                  <div>
                    <div className="text-wiki-text-muted text-xs mb-2">本套共 {setPieces.length} 件</div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {setPieces.map(p => {
                        const pr = rarityInfo(p.rarity)
                        return (
                          <Link key={p.id} href={`/wiki/equipment/${equipment.equipType}/${p.slug}`}
                            className={`rounded-lg overflow-hidden border-2 ${p.id === equipment.id ? 'ring-2 ring-wiki-accent' : ''}`} style={{ borderColor: pr.color }}>
                            <div className="aspect-square bg-wiki-gray">
                              {p.icon ? <img src={p.icon} alt={p.name} className="w-full h-full object-cover" style={{ objectPosition: p.iconPosition || '50% 50%' }} /> : <div className="w-full h-full flex items-center justify-center text-wiki-text-muted">{p.name[0]}</div>}
                            </div>
                            <div className="px-1 py-1 text-center text-[11px] text-wiki-text truncate">{p.slot || p.name}</div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 獲取途徑 */}
            {hasAcq && (
              <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-wiki-accent mb-3">獲取途徑</h3>
                <MarkdownRenderer content={equipment.acquisition!} />
              </div>
            )}
          </div>

          {/* 側欄信息 */}
          <div className="lg:col-span-1">
            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6 lg:sticky lg:top-4">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">裝備信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-wiki-text-muted">類型</span><span className="text-wiki-text font-bold">{typeLabel}</span></div>
                <div className="flex justify-between"><span className="text-wiki-text-muted">品質</span><span className="font-bold" style={{ color: r.color }}>{r.label}</span></div>
                {equipment.type && <div className="flex justify-between"><span className="text-wiki-text-muted">種類</span><span className="text-wiki-text">{equipment.type}</span></div>}
                {equipment.slot && <div className="flex justify-between"><span className="text-wiki-text-muted">部位</span><span className="text-wiki-text">{equipment.slot}</span></div>}
                {equipment.attrBias && <div className="flex justify-between"><span className="text-wiki-text-muted">屬性偏向</span><span className="text-wiki-text">{equipment.attrBias}</span></div>}
                {equipment.set && <div className="flex justify-between"><span className="text-wiki-text-muted">套裝</span><span className="text-wiki-text">{equipment.set.name}</span></div>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <LikeButton entityType="equipment" entityId={equipment.id} initialLikes={equipment.likes || 0} />
        </div>
      </main>

      <WikiFooter />
    </div>
  )
}
