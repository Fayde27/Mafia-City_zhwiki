'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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
  category: {
    name: string
    slug: string
  }
}

interface CharacterCategory {
  id: string
  name: string
  slug: string
  icon: string
}

interface CharacterFilterOption {
  id: string
  type: string
  value: string
  sortOrder: number
}

export default function CharacterListPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const [characters, setCharacters] = useState<Character[]>([])
  const [category, setCategory] = useState<CharacterCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [filterOptions, setFilterOptions] = useState<CharacterFilterOption[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/wiki/characters?category=${categorySlug}`).then(res => res.json()),
      fetch('/api/wiki/characters/categories').then(res => res.json()),
      fetch(`/api/wiki/characters/filter-options?categorySlug=${categorySlug}`).then(res => res.json()),
    ]).then(([charData, catData, filterData]) => {
      const chars = charData?.characters || []
      setCharacters(chars)
      
      const cat = catData?.find((c: CharacterCategory) => c.slug === categorySlug)
      setCategory(cat || null)
      
      const filters = Array.isArray(filterData) ? filterData : []
      setFilterOptions(filters)
      
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [categorySlug])

  const filteredCharacters = characters.filter(c => {
    return Object.entries(activeFilters).every(([type, value]) => {
      if (!value || value === 'all') return true
      if (type === 'rarity') return c.rarity === parseInt(value)
      if (type === 'role') return c.role === value
      if (type === 'weapon') return c.weapon === value
      // 自定義類型：嘗試匹配角色所有字段
      return Object.values(c as any).some((v: unknown) => String(v) === value)
    })
  })

  const getRarityStars = (rarity: number) => '★'.repeat(Math.max(0, rarity)) + '☆'.repeat(Math.max(0, 5 - rarity))

  // 動態分組
  const filterTypes = Array.from(new Set(filterOptions.map(o => o.type)))
  const groupedFilters = filterTypes.reduce((acc, type) => {
    acc[type] = filterOptions.filter(o => o.type === type).sort((a, b) => a.sortOrder - b.sortOrder)
    return acc
  }, {} as Record<string, CharacterFilterOption[]>)

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">圖鑑</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/characters/characters" className="hover:text-wiki-accent">角色圖鑑</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{category?.name || '載入中...'}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{category?.icon}</span>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">
              {category?.name}
            </h1>
          </div>
        </div>

        {filterTypes.length > 0 && (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-4 md:p-6 mb-6 space-y-4">
            {filterTypes.map(type => (
              <div key={type}>
                <div className="text-sm font-bold text-wiki-accent uppercase tracking-wider mb-2">{type}</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFilters(prev => ({ ...prev, [type]: 'all' }))}
                    className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                      !activeFilters[type] || activeFilters[type] === 'all'
                        ? 'bg-wiki-accent text-wiki-darker'
                        : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                    }`}
                  >
                    全部
                  </button>
                  {groupedFilters[type].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setActiveFilters(prev => ({ ...prev, [type]: opt.value }))}
                      className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                        activeFilters[type] === opt.value
                          ? 'bg-wiki-accent text-wiki-darker'
                          : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                      }`}
                    >
                      {type === 'rarity' && !isNaN(parseInt(opt.value))
                        ? getRarityStars(parseInt(opt.value))
                        : opt.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : filteredCharacters.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-8 md:p-12 text-center text-wiki-text-muted">
            該分類下暫無角色
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredCharacters.map((character) => (
              <Link
                key={character.id}
                href={`/wiki/characters/${categorySlug}/${character.slug}`}
                className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg overflow-hidden group block hover:border-wiki-accent transition-all"
              >
                <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-wiki-gray to-wiki-darker">
                  {character.avatar ? (
                    <img
                      src={character.avatar}
                      alt={character.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: character.avatarPosition || '50% 50%' }}
                    />
                  ) : character.banner ? (
                    <img
                      src={character.banner}
                      alt={character.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: character.bannerPosition || '50% 50%' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl text-wiki-text-muted">{character.name[0]}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-1">
                    <span className="text-yellow-400 text-sm font-bold drop-shadow-lg">
                      {getRarityStars(character.rarity)}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-wiki-text text-xs font-bold drop-shadow-lg">
                      {character.role}
                    </span>
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="text-lg md:text-xl font-bold text-wiki-text mb-1 group-hover:text-wiki-accent transition-colors">
                    {character.name}
                  </h3>
                  {character.title && (
                    <p className="text-wiki-text-muted text-sm mb-2">{character.title}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-wiki-text-muted">
                    {character.role && (
                      <span>{character.role}</span>
                    )}
                    {character.weapon && (
                      <span>· {character.weapon}</span>
                    )}
                  </div>
                  {character.coreBonus && (
                    <p className="text-wiki-text-muted text-xs mt-1">
                      核心加成：{character.coreBonus}
                    </p>
                  )}
                  {character.description && (
                    <p className="text-wiki-text-muted text-xs mt-2 line-clamp-2">
                      {character.description.replace(/<[^>]*>/g, '').trim()}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <WikiFooter />
    </div>
  )
}
