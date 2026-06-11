'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import LikeButton from '@/components/LikeButton'

interface Building {
  id: string
  likes?: number
  name: string
  slug: string
  icon: string
  image: string
  imagePosition?: string
  iconPosition?: string
  rarity: number
  type: string
  function: string
  unlockCondition?: string
  summary?: string
  level: number
  maxLevel: number
  cost: string
  production: string
  description: string
  details: string
  upgradeInfo: string
  upgradeLevels?: string
  isPublished: boolean
  category: {
    name: string
    slug: string
  }
}

interface UpgradeTable {
  columns: string[]
  rows: string[][]
}

function parseUpgradeTable(raw?: string): UpgradeTable | null {
  if (!raw) return null
  try {
    const t = JSON.parse(raw) as UpgradeTable
    if (!t.columns?.length) return null
    return t
  } catch { return null }
}

export default function BuildingDetailPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const buildingSlug = params?.buildingSlug as string
  const { isAdmin } = useAdminAuth()
  const [building, setBuilding] = useState<Building | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    fetch(`/api/wiki/buildings?category=${categorySlug}&slug=${buildingSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.buildings && data.buildings.length > 0) setBuilding(data.buildings[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [categorySlug, buildingSlug])

  const getRarityStars = (rarity: number) => '★'.repeat(rarity) + '☆'.repeat(5 - rarity)

  const upgradeTable = parseUpgradeTable(building?.upgradeLevels)
  const hasUpgrade = (upgradeTable && upgradeTable.rows.length > 0) || !!building?.upgradeInfo

  const tabs = [
    { id: 'details', label: '建築詳情' },
    ...(hasUpgrade ? [{ id: 'upgrade', label: '升級詳情' }] : []),
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <div className="text-center py-20 text-wiki-text-muted">載入中...</div>
        <WikiFooter />
      </div>
    )
  }

  if (!building) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-12 text-center text-wiki-text-muted">
            建築不存在
          </div>
        </main>
        <WikiFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* 麵包屑 */}
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">圖鑑</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/buildings" className="hover:text-wiki-accent">建築圖鑑</Link>
          <span className="mx-2">/</span>
          <Link href={`/wiki/buildings/${building.category.slug}`} className="hover:text-wiki-accent">
            {building.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{building.name}</span>
        </div>

        {/* Banner 大圖 */}
        {building.image && (
          <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden mb-6 md:mb-8">
            <img
              src={building.image}
              alt={building.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: building.imagePosition || '50% 50%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-5 md:bottom-8 md:left-8">
              {building.rarity > 0 && (
                <div className="text-yellow-400 text-base font-bold drop-shadow-lg mb-1">
                  {getRarityStars(building.rarity)}
                </div>
              )}
              <h1 className="text-3xl md:text-5xl font-heading font-bold text-white heading-hard mb-1 drop-shadow-xl">
                {building.name}
              </h1>
              {building.function && (
                <p className="text-white/80 text-sm md:text-base">{building.function}</p>
              )}
            </div>
            {isAdmin && (
              <div className="absolute top-4 right-4 md:top-6 md:right-6">
                <Link
                  href={`/admin/buildings/edit/${building.id}`}
                  className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm rounded hover:opacity-90"
                >
                  編輯建築
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 無 Banner 時的標題區 */}
        {!building.image && (
          <div className="flex items-center gap-4 mb-6">
            {building.icon && (
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-wiki-accent bg-wiki-gray flex items-center justify-center flex-shrink-0">
                <img src={building.icon} alt={building.name} className="w-full h-full object-cover" style={{ objectPosition: building.iconPosition || '50% 50%' }} />
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-wiki-text">{building.name}</h1>
              {building.function && <p className="text-wiki-text-muted mt-0.5">{building.function}</p>}
            </div>
            {isAdmin && (
              <Link href={`/admin/buildings/edit/${building.id}`}
                className="ml-auto px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm rounded hover:opacity-90">
                編輯建築
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* 主內容 */}
          <div className="lg:col-span-2">
            {/* 小圖標 + 簡短描述 */}
            {(building.image && building.icon) && (
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-wiki-border bg-wiki-gray flex-shrink-0">
                  <img src={building.icon} alt={building.name} className="w-full h-full object-cover"
                    style={{ objectPosition: building.iconPosition || '50% 50%' }} />
                </div>
                {building.summary && (
                  <p className="text-wiki-text-muted text-sm leading-relaxed">{building.summary}</p>
                )}
              </div>
            )}
            {!building.image && building.summary && (
              <p className="text-wiki-text-muted text-sm mb-5 leading-relaxed">{building.summary}</p>
            )}

            {/* Tab 切換 */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-bold whitespace-nowrap rounded transition-colors ${
                    activeTab === tab.id
                      ? 'bg-wiki-accent text-wiki-darker'
                      : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 內容 */}
            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 md:p-7">
              {activeTab === 'details' && (
                <div>
                  {building.description
                    ? <MarkdownRenderer content={building.description} />
                    : <p className="text-wiki-text-muted text-sm">暫無建築詳情</p>
                  }
                </div>
              )}

              {activeTab === 'upgrade' && (
                <div>
                  {/* 結構化升級表格 */}
                  {upgradeTable && upgradeTable.rows.length > 0 && (
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr>
                            {upgradeTable.columns.map((col, ci) => (
                              <th key={ci}
                                className="text-left px-4 py-2.5 bg-wiki-gray text-wiki-accent font-bold border border-wiki-border whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {upgradeTable.rows.map((row, ri) => (
                            <tr key={ri} className={ri % 2 === 0 ? 'bg-wiki-card' : 'bg-wiki-gray/30'}>
                              {row.map((cell, ci) => (
                                <td key={ci} className="px-4 py-2.5 text-wiki-text border border-wiki-border">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* 舊版富文本升級信息兼容 */}
                  {building.upgradeInfo && (
                    <MarkdownRenderer content={building.upgradeInfo} />
                  )}
                  {!upgradeTable?.rows.length && !building.upgradeInfo && (
                    <p className="text-wiki-text-muted text-sm">暫無升級詳情</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 右側信息欄 */}
          <div className="lg:col-span-1">
            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 sticky top-4">
              <h3 className="text-base font-bold text-wiki-accent mb-4">建築信息</h3>
              <div className="space-y-3 text-sm">
                {building.category && (
                  <div className="flex justify-between gap-2">
                    <span className="text-wiki-text-muted flex-shrink-0">分類</span>
                    <span className="text-wiki-text font-bold text-right">{building.category.name}</span>
                  </div>
                )}
                {building.type && (
                  <div className="flex justify-between gap-2">
                    <span className="text-wiki-text-muted flex-shrink-0">建築類型</span>
                    <span className="text-wiki-text font-bold text-right">{building.type}</span>
                  </div>
                )}
                {building.function && (
                  <div className="flex justify-between gap-2">
                    <span className="text-wiki-text-muted flex-shrink-0">核心功能</span>
                    <span className="text-wiki-text text-right">{building.function}</span>
                  </div>
                )}
                {building.unlockCondition && (
                  <div className="flex justify-between gap-2">
                    <span className="text-wiki-text-muted flex-shrink-0">開放條件</span>
                    <span className="text-wiki-text text-right">{building.unlockCondition}</span>
                  </div>
                )}
                {building.rarity > 0 && (
                  <div className="flex justify-between gap-2">
                    <span className="text-wiki-text-muted flex-shrink-0">稀有度</span>
                    <span className="text-yellow-400 font-bold">{getRarityStars(building.rarity)}</span>
                  </div>
                )}
                {building.cost && (
                  <div className="flex justify-between gap-2">
                    <span className="text-wiki-text-muted flex-shrink-0">建造成本</span>
                    <span className="text-wiki-text text-right">{building.cost}</span>
                  </div>
                )}
                {building.production && (
                  <div className="flex justify-between gap-2">
                    <span className="text-wiki-text-muted flex-shrink-0">產出</span>
                    <span className="text-wiki-text text-right">{building.production}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 點贊 */}
        <div className="mt-10 flex justify-center">
          <LikeButton entityType="building" entityId={building.id} initialLikes={building.likes || 0} />
        </div>
      </main>

      <WikiFooter />
    </div>
  )
}
