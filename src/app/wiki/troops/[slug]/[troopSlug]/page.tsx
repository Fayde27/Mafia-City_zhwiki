'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface Troop {
  id: string
  name: string
  slug: string
  icon: string
  image: string
  rarity: number
  type: string
  attack: number
  defense: number
  hp: number
  speed: number
  counter: string
  weakness: string
  description: string
  stats: string
  skills: string
  training: string
  category: {
    name: string
    slug: string
  }
}

export default function TroopDetailPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const troopSlug = params?.troopSlug as string
  const { isAdmin } = useAdminAuth()
  const [troop, setTroop] = useState<Troop | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    fetch(`/api/wiki/troops?category=${categorySlug}&slug=${troopSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.troops && data.troops.length > 0) {
          setTroop(data.troops[0])
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [categorySlug, troopSlug])

  const getRarityStars = (rarity: number) => {
    return '★'.repeat(rarity) + '☆'.repeat(5 - rarity)
  }

  const tabs = [
    { id: 'description', label: '兵种详情' },
    { id: 'skills', label: '技能信息' },
    { id: 'training', label: '训练方法' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-dark">
        <WikiHeader />
        <div className="text-center py-20 text-wiki-text-muted">加载中...</div>
        <WikiFooter />
      </div>
    )
  }

  if (!troop) {
    return (
      <div className="min-h-screen bg-wiki-dark">
        <WikiHeader />
        <main className="container mx-auto px-4 py-12">
          <div className="card-hard rounded-lg p-12 text-center text-wiki-text-muted">
            兵种不存在
          </div>
        </main>
        <WikiFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wiki-dark">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首页</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">图鉴</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/troops" className="hover:text-wiki-accent">兵种图鉴</Link>
          <span className="mx-2">/</span>
          <Link href={`/wiki/troops/${troop.category.slug}`} className="hover:text-wiki-accent">
            {troop.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{troop.name}</span>
        </div>

        {troop.image && (
          <div className="relative h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden mb-6 md:mb-8">
            <img
              src={troop.image}
              alt={troop.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wiki-dark via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400 text-lg font-bold drop-shadow-lg">
                  {getRarityStars(troop.rarity)}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white heading-hard mb-2">
                {troop.name}
              </h1>
              {troop.type && (
                <p className="text-wiki-text-muted text-lg md:text-xl">类型：{troop.type}</p>
              )}
            </div>
            {isAdmin && (
              <div className="absolute top-4 right-4 md:top-8 md:right-8">
                <Link
                  href={`/admin/troops/edit/${troop.id}`}
                  className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90"
                >
                  编辑兵种
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              {troop.icon && (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-2 border-wiki-accent flex-shrink-0 bg-wiki-gray flex items-center justify-center">
                  <span className="text-5xl">{troop.icon}</span>
                </div>
              )}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-wiki-text">{troop.name}</h2>
                {troop.type && (
                  <p className="text-wiki-text-muted mt-1">类型：{troop.type}</p>
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

            <div className="card-hard rounded-lg p-6 md:p-8">
              {activeTab === 'description' && (
                <div>
                  {troop.description && (
                    <MarkdownRenderer content={troop.description} />
                  )}
                </div>
              )}
              {activeTab === 'skills' && (
                <div>
                  {troop.skills && (
                    <MarkdownRenderer content={troop.skills} />
                  )}
                </div>
              )}
              {activeTab === 'training' && (
                <div>
                  {troop.training && (
                    <MarkdownRenderer content={troop.training} />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card-hard rounded-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">兵种信息</h3>
              <div className="space-y-3 text-sm">
                {troop.rarity && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">稀有度</span>
                    <span className="text-yellow-400 font-bold">{getRarityStars(troop.rarity)}</span>
                  </div>
                )}
                {troop.type && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">类型</span>
                    <span className="text-wiki-text font-bold">{troop.type}</span>
                  </div>
                )}
                {troop.attack > 0 && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">攻击力</span>
                    <span className="text-wiki-text font-bold">{troop.attack}</span>
                  </div>
                )}
                {troop.defense > 0 && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">防御力</span>
                    <span className="text-wiki-text font-bold">{troop.defense}</span>
                  </div>
                )}
                {troop.hp > 0 && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">生命值</span>
                    <span className="text-wiki-text font-bold">{troop.hp}</span>
                  </div>
                )}
                {troop.speed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">速度</span>
                    <span className="text-wiki-text font-bold">{troop.speed}</span>
                  </div>
                )}
                {troop.counter && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">克制</span>
                    <span className="text-wiki-text">{troop.counter}</span>
                  </div>
                )}
                {troop.weakness && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">被克制</span>
                    <span className="text-wiki-text">{troop.weakness}</span>
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
