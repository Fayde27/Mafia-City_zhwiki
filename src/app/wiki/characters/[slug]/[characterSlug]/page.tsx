'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface Character {
  id: string
  name: string
  slug: string
  title: string
  avatar: string
  banner: string
  avatarPosition?: string
  bannerPosition?: string
  rarity: number
  role: string
  weapon: string
  coreBonus: string
  acquisition: string
  description: string
  attributes: string
  skills: string
  rumors: string
  teamComp: string
  troopRec: string
  category: {
    name: string
    slug: string
  }
}

export default function CharacterDetailPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const characterSlug = params?.characterSlug as string
  const { isAdmin } = useAdminAuth()
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('attributes')

  useEffect(() => {
    fetch(`/api/wiki/characters?category=${categorySlug}&slug=${characterSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.characters && data.characters.length > 0) {
          setCharacter(data.characters[0])
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [categorySlug, characterSlug])

  const getRarityStars = (rarity: number) => {
    return '★'.repeat(rarity) + '☆'.repeat(5 - rarity)
  }

  const tabs = [
    { id: 'attributes', label: '角色属性' },
    { id: 'skills', label: '技能详情' },
    { id: 'rumors', label: '黑道传闻' },
    { id: 'teamComp', label: '阵容搭配' },
    { id: 'troopRec', label: '配兵推荐' },
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

  if (!character) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-12 text-center text-wiki-text-muted">
            角色不存在
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
          <Link href="/wiki/characters/characters" className="hover:text-wiki-accent">角色图鉴</Link>
          <span className="mx-2">/</span>
          <Link href={`/wiki/characters/${character.category.slug}`} className="hover:text-wiki-accent">
            {character.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{character.name}</span>
        </div>

        {character.banner && (
          <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden mb-6 md:mb-8">
            <img
              src={character.banner}
              alt={character.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: character.bannerPosition || '50% 50%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wiki-dark via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400 text-lg font-bold drop-shadow-lg">
                  {getRarityStars(character.rarity)}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-wiki-text heading-hard mb-2">
                {character.name}
              </h1>
              {character.title && (
                <p className="text-wiki-text-muted text-lg md:text-xl">{character.title}</p>
              )}
            </div>
            {isAdmin && (
              <div className="absolute top-4 right-4 md:top-8 md:right-8">
                <Link
                  href={`/admin/characters/edit/${character.id}`}
                  className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90"
                >
                  编辑角色
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              {character.avatar && (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-2 border-wiki-accent flex-shrink-0">
                  <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" style={{ objectPosition: character.avatarPosition || '50% 50%' }} />
                </div>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap gap-4 text-sm text-wiki-text-muted">
                  {character.role && (
                    <span className="flex items-center gap-2">
                      <span className="text-wiki-text font-bold">{character.role}</span>
                    </span>
                  )}
                  {character.weapon && (
                    <span className="flex items-center gap-2">
                      <span className="text-wiki-text font-bold">{character.weapon}</span>
                    </span>
                  )}
                </div>
                {character.coreBonus && (
                  <p className="text-wiki-text-muted text-sm mt-2">核心加成：{character.coreBonus}</p>
                )}
                {character.acquisition && (
                  <p className="text-wiki-text-muted text-sm">获取方式：{character.acquisition}</p>
                )}
              </div>
            </div>

            {character.description && (
              <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-wiki-accent mb-3">角色简介</h3>
                {character.description.trim().startsWith('<') ? (
                  <div className="rich-content text-wiki-text leading-relaxed" dangerouslySetInnerHTML={{ __html: character.description }} />
                ) : (
                  <p className="text-wiki-text leading-relaxed">{character.description}</p>
                )}
              </div>
            )}

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.filter(tab => {
                if (tab.id === 'attributes' && !character.attributes) return false
                if (tab.id === 'skills' && !character.skills) return false
                if (tab.id === 'rumors' && !character.rumors) return false
                if (tab.id === 'teamComp' && !character.teamComp) return false
                if (tab.id === 'troopRec' && !character.troopRec) return false
                return true
              }).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-wiki-accent text-wiki-darker'
                      : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
              {activeTab === 'attributes' && character.attributes && (
                <MarkdownRenderer content={character.attributes} />
              )}
              {activeTab === 'skills' && character.skills && (
                <MarkdownRenderer content={character.skills} />
              )}
              {activeTab === 'rumors' && character.rumors && (
                <MarkdownRenderer content={character.rumors} />
              )}
              {activeTab === 'teamComp' && character.teamComp && (
                <MarkdownRenderer content={character.teamComp} />
              )}
              {activeTab === 'troopRec' && character.troopRec && (
                <MarkdownRenderer content={character.troopRec} />
              )}
              {activeTab === 'attributes' && !character.attributes && (
                <p className="text-wiki-text-muted text-center py-8">暂无角色属性</p>
              )}
              {activeTab === 'skills' && !character.skills && (
                <p className="text-wiki-text-muted text-center py-8">暂无技能详情</p>
              )}
              {activeTab === 'rumors' && !character.rumors && (
                <p className="text-wiki-text-muted text-center py-8">暂无黑道传闻</p>
              )}
              {activeTab === 'teamComp' && !character.teamComp && (
                <p className="text-wiki-text-muted text-center py-8">暂无阵容搭配</p>
              )}
              {activeTab === 'troopRec' && !character.troopRec && (
                <p className="text-wiki-text-muted text-center py-8">暂无配兵推荐</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">角色信息</h3>
              <div className="space-y-3 text-sm">
                {character.rarity && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">稀有度</span>
                    <span className="text-yellow-400 font-bold">{getRarityStars(character.rarity)}</span>
                  </div>
                )}
                {character.role && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">角色定位</span>
                    <span className="text-wiki-text font-bold">{character.role}</span>
                  </div>
                )}
                {character.weapon && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">适配兵种</span>
                    <span className="text-wiki-text">{character.weapon}</span>
                  </div>
                )}
                {character.coreBonus && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">核心加成</span>
                    <span className="text-wiki-text">{character.coreBonus}</span>
                  </div>
                )}
                {character.acquisition && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">获取方式</span>
                    <span className="text-wiki-text">{character.acquisition}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-8 flex justify-end">
            <Link href={`/admin/characters/edit/${character.id}`} className="btn-hard text-wiki-text text-sm">
              编辑角色
            </Link>
          </div>
        )}
      </main>

      <WikiFooter />
    </div>
  )
}
