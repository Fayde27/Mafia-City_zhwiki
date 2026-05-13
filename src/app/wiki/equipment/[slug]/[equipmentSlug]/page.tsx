'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface Equipment {
  id: string
  name: string
  slug: string
  icon: string
  image: string
  imagePosition?: string
  iconPosition?: string
  rarity: number
  type: string
  slot: string
  attack: number
  defense: number
  hp: number
  speed: number
  skill: string
  description: string
  stats: string
  enhancement: string
  acquisition: string
  category: {
    name: string
    slug: string
  }
}

export default function EquipmentDetailPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const equipmentSlug = params?.equipmentSlug as string
  const { isAdmin } = useAdminAuth()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stats')

  useEffect(() => {
    fetch(`/api/wiki/equipment?category=${categorySlug}&slug=${equipmentSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.equipment && data.equipment.length > 0) {
          setEquipment(data.equipment[0])
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [categorySlug, equipmentSlug])

  const getRarityStars = (rarity: number) => {
    return '★'.repeat(rarity) + '☆'.repeat(5 - rarity)
  }

  const tabs = [
    { id: 'stats', label: '属性详情' },
    { id: 'enhancement', label: '强化信息' },
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

  if (!equipment) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-12 text-center text-wiki-text-muted">
            装备不存在
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
          <Link href="/wiki/equipment" className="hover:text-wiki-accent">装备图鉴</Link>
          <span className="mx-2">/</span>
          <Link href={`/wiki/equipment/${equipment.category.slug}`} className="hover:text-wiki-accent">
            {equipment.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{equipment.name}</span>
        </div>

        {equipment.image && (
          <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden mb-6 md:mb-8">
            <img
              src={equipment.image}
              alt={equipment.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: equipment.imagePosition || '50% 50%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wiki-dark via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400 text-lg font-bold drop-shadow-lg">
                  {getRarityStars(equipment.rarity)}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-wiki-text heading-hard mb-2">
                {equipment.name}
              </h1>
              {equipment.skill && (
                <p className="text-wiki-text-muted text-lg md:text-xl">{equipment.skill}</p>
              )}
            </div>
            {isAdmin && (
              <div className="absolute top-4 right-4 md:top-8 md:right-8">
                <Link
                  href={`/admin/equipment/edit/${equipment.id}`}
                  className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90"
                >
                  编辑装备
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              {equipment.icon && (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-2 border-wiki-accent flex-shrink-0 bg-wiki-gray flex items-center justify-center">
                  <span className="text-5xl">{equipment.icon}</span>
                </div>
              )}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-wiki-text">{equipment.name}</h2>
                {equipment.type && (
                  <p className="text-wiki-text-muted mt-1">类型：{equipment.type}</p>
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
              {activeTab === 'stats' && (
                <div>
                  {equipment.description && (
                    <MarkdownRenderer content={equipment.description} />
                  )}
                </div>
              )}
              {activeTab === 'enhancement' && (
                <div>
                  {equipment.enhancement && (
                    <MarkdownRenderer content={equipment.enhancement} />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">装备信息</h3>
              <div className="space-y-3 text-sm">
                {equipment.rarity && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">稀有度</span>
                    <span className="text-yellow-400 font-bold">{getRarityStars(equipment.rarity)}</span>
                  </div>
                )}
                {equipment.type && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">类型</span>
                    <span className="text-wiki-text font-bold">{equipment.type}</span>
                  </div>
                )}
                {equipment.slot && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">部位</span>
                    <span className="text-wiki-text">{equipment.slot}</span>
                  </div>
                )}
                {equipment.attack > 0 && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">攻击力</span>
                    <span className="text-wiki-text font-bold">{equipment.attack}</span>
                  </div>
                )}
                {equipment.defense > 0 && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">防御力</span>
                    <span className="text-wiki-text font-bold">{equipment.defense}</span>
                  </div>
                )}
                {equipment.hp > 0 && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">生命值</span>
                    <span className="text-wiki-text font-bold">{equipment.hp}</span>
                  </div>
                )}
                {equipment.speed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">速度</span>
                    <span className="text-wiki-text font-bold">{equipment.speed}</span>
                  </div>
                )}
                {equipment.acquisition && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">获取方式</span>
                    <span className="text-wiki-text">{equipment.acquisition}</span>
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
