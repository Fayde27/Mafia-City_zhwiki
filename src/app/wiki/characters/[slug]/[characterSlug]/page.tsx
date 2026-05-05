'use client'

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
  rarity: number
  path: string
  faction: string
  combatType: string
  gender: string
  releaseDate: string
  weapon: string
  tags: string
  description: string
  stats: string
  materials: string
  story: string
  otherInfo: string
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
  const [activeTab, setActiveTab] = useState('info')

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

  const getPathIcon = (path: string) => {
    const icons: Record<string, string> = {
      '毁灭': '⚔️',
      '巡猎': '🏹',
      '智识': '📖',
      '同谐': '🎵',
      '虚无': '🌑',
      '存护': '🛡️',
      '丰饶': '💚',
      '记忆': '️',
      '欢愉': '',
    }
    return icons[path] || '⭐'
  }

  const getCombatTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      '物理': '⚪',
      '火': '🔥',
      '冰': '❄️',
      '雷': '⚡',
      '风': '️',
      '量子': '',
      '虚数': '✨',
    }
    return icons[type] || '⭐'
  }

  const tabs = [
    { id: 'info', label: '角色信息' },
    { id: 'stats', label: '属性数据' },
    { id: 'materials', label: '晋升材料' },
    { id: 'story', label: '角色故事' },
    { id: 'other', label: '其他信息' },
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

  if (!character) {
    return (
      <div className="min-h-screen bg-wiki-dark">
        <WikiHeader />
        <main className="container mx-auto px-4 py-12">
          <div className="card-hard rounded-lg p-12 text-center text-wiki-text-muted">
            角色不存在
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
          <Link href="/wiki/characters" className="hover:text-wiki-accent">角色图鉴</Link>
          <span className="mx-2">/</span>
          <Link href={`/wiki/characters/${character.category.slug}`} className="hover:text-wiki-accent">
            {character.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{character.name}</span>
        </div>

        {character.banner && (
          <div className="relative h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden mb-6 md:mb-8">
            <img
              src={character.banner}
              alt={character.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wiki-dark via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400 text-lg font-bold drop-shadow-lg">
                  {getRarityStars(character.rarity)}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white heading-hard mb-2">
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
                  <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap gap-4 text-sm text-wiki-text-muted">
                  {character.path && (
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{getPathIcon(character.path)}</span>
                      <span className="text-wiki-text font-bold">{character.path}</span>
                    </span>
                  )}
                  {character.combatType && (
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{getCombatTypeIcon(character.combatType)}</span>
                      <span className="text-wiki-text font-bold">{character.combatType}</span>
                    </span>
                  )}
                  {character.faction && (
                    <span className="flex items-center gap-2">
                      <span className="text-wiki-text font-bold">{character.faction}</span>
                    </span>
                  )}
                  {character.gender && (
                    <span className="flex items-center gap-2">
                      <span className="text-wiki-text">{character.gender === '男' ? '' : '♀'} {character.gender}</span>
                    </span>
                  )}
                </div>
                {character.weapon && (
                  <p className="text-wiki-text-muted text-sm mt-2">适配兵种：{character.weapon}</p>
                )}
                {character.releaseDate && (
                  <p className="text-wiki-text-muted text-sm">实装日期：{character.releaseDate}</p>
                )}
              </div>
            </div>

            {character.description && (
              <div className="card-hard rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-wiki-accent mb-3">角色简介</h3>
                <p className="text-wiki-text leading-relaxed">{character.description}</p>
              </div>
            )}

            {character.tags && (
              <div className="flex flex-wrap gap-2 mb-6">
                {character.tags.split(',').map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.filter(tab => {
                if (tab.id === 'stats' && !character.stats) return false
                if (tab.id === 'materials' && !character.materials) return false
                if (tab.id === 'story' && !character.story) return false
                if (tab.id === 'other' && !character.otherInfo) return false
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

            <div className="card-hard rounded-lg p-6">
              {activeTab === 'info' && character.description && (
                <MarkdownRenderer content={character.description} />
              )}
              {activeTab === 'stats' && character.stats && (
                <MarkdownRenderer content={character.stats} />
              )}
              {activeTab === 'materials' && character.materials && (
                <MarkdownRenderer content={character.materials} />
              )}
              {activeTab === 'story' && character.story && (
                <MarkdownRenderer content={character.story} />
              )}
              {activeTab === 'other' && character.otherInfo && (
                <MarkdownRenderer content={character.otherInfo} />
              )}
              {activeTab === 'info' && !character.description && (
                <p className="text-wiki-text-muted text-center py-8">暂无角色简介</p>
              )}
              {activeTab === 'stats' && !character.stats && (
                <p className="text-wiki-text-muted text-center py-8">暂无属性数据</p>
              )}
              {activeTab === 'materials' && !character.materials && (
                <p className="text-wiki-text-muted text-center py-8">暂无晋升材料</p>
              )}
              {activeTab === 'story' && !character.story && (
                <p className="text-wiki-text-muted text-center py-8">暂无角色故事</p>
              )}
              {activeTab === 'other' && !character.otherInfo && (
                <p className="text-wiki-text-muted text-center py-8">暂无其他信息</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card-hard rounded-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">角色信息</h3>
              <div className="space-y-3 text-sm">
                {character.rarity && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">稀有度</span>
                    <span className="text-yellow-400 font-bold">{getRarityStars(character.rarity)}</span>
                  </div>
                )}
                {character.path && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">命途</span>
                    <span className="text-wiki-text font-bold">{getPathIcon(character.path)} {character.path}</span>
                  </div>
                )}
                {character.combatType && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">战斗属性</span>
                    <span className="text-wiki-text font-bold">{getCombatTypeIcon(character.combatType)} {character.combatType}</span>
                  </div>
                )}
                {character.faction && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">阵营</span>
                    <span className="text-wiki-text">{character.faction}</span>
                  </div>
                )}
                {character.gender && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">性别</span>
                    <span className="text-wiki-text">{character.gender}</span>
                  </div>
                )}
                {character.weapon && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">适配兵种</span>
                    <span className="text-wiki-text">{character.weapon}</span>
                  </div>
                )}
                {character.releaseDate && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">实装日期</span>
                    <span className="text-wiki-text">{character.releaseDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-8 flex justify-end">
            <Link href={`/admin/characters/edit/${character.id}`} className="btn-hard text-white text-sm">
              编辑角色
            </Link>
          </div>
        )}
      </main>

      <WikiFooter />
    </div>
  )
}
