'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface Building {
  id: string
  name: string
  slug: string
  icon: string
  image: string
  imagePosition?: string
  iconPosition?: string
  rarity: number
  type: string
  function: string
  level: number
  maxLevel: number
  cost: string
  production: string
  description: string
  details: string
  upgradeInfo: string
  category: {
    name: string
    slug: string
  }
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
        if (data.buildings && data.buildings.length > 0) {
          setBuilding(data.buildings[0])
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [categorySlug, buildingSlug])

  const getRarityStars = (rarity: number) => {
    return '★'.repeat(rarity) + '☆'.repeat(5 - rarity)
  }

  const tabs = [
    { id: 'details', label: '建筑详情' },
    { id: 'upgrade', label: '升级信息' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <div className="text-center py-20 text-wiki-text-muted">加载中...</div>
        <WikiFooter />
      </div>
    )
  }

  if (!building) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-12 text-center text-wiki-text-muted">
            建筑不存在
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
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首页</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">图鉴</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/buildings" className="hover:text-wiki-accent">建筑图鉴</Link>
          <span className="mx-2">/</span>
          <Link href={`/wiki/buildings/${building.category.slug}`} className="hover:text-wiki-accent">
            {building.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{building.name}</span>
        </div>

        {building.image && (
          <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden mb-6 md:mb-8">
            <img
              src={building.image}
              alt={building.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: building.imagePosition || '50% 50%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wiki-dark via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400 text-lg font-bold drop-shadow-lg">
                  {getRarityStars(building.rarity)}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-wiki-text heading-hard mb-2">
                {building.name}
              </h1>
              {building.function && (
                <p className="text-wiki-text-muted text-lg md:text-xl">{building.function}</p>
              )}
            </div>
            {isAdmin && (
              <div className="absolute top-4 right-4 md:top-8 md:right-8">
                <Link
                  href={`/admin/buildings/edit/${building.id}`}
                  className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90"
                >
                  编辑建筑
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              {building.icon && (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-2 border-wiki-accent flex-shrink-0 bg-wiki-gray flex items-center justify-center">
                  <span className="text-5xl">{building.icon}</span>
                </div>
              )}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-wiki-text">{building.name}</h2>
                {building.type && (
                  <p className="text-wiki-text-muted mt-1">类型：{building.type}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-bold uppercase tracking-wider whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-wiki-accent text-wiki-darker'
                      : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6 md:p-8">
              {activeTab === 'details' && (
                <div>
                  {building.description && (
                    <MarkdownRenderer content={building.description} />
                  )}
                </div>
              )}
              {activeTab === 'upgrade' && (
                <div>
                  {building.upgradeInfo && (
                    <MarkdownRenderer content={building.upgradeInfo} />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">建筑信息</h3>
              <div className="space-y-3 text-sm">
                {building.rarity && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">稀有度</span>
                    <span className="text-yellow-400 font-bold">{getRarityStars(building.rarity)}</span>
                  </div>
                )}
                {building.type && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">类型</span>
                    <span className="text-wiki-text font-bold">{building.type}</span>
                  </div>
                )}
                {building.level && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">等级</span>
                    <span className="text-wiki-text">{building.level}/{building.maxLevel}</span>
                  </div>
                )}
                {building.cost && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">建造成本</span>
                    <span className="text-wiki-text">{building.cost}</span>
                  </div>
                )}
                {building.production && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">产出</span>
                    <span className="text-wiki-text">{building.production}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <WikiFooter />
    </div>
  )
}
