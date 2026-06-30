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

  // 稀有度漸變條（class 為完整字串字面量，確保 Tailwind 不被裁剪）
  const rarityGradient = (rarity: number) =>
    rarity >= 5 ? 'from-yellow-500 via-amber-300 to-yellow-500' :
    rarity >= 4 ? 'from-orange-500 via-orange-300 to-orange-500' :
    rarity >= 3 ? 'from-purple-500 via-fuchsia-400 to-purple-500' :
    rarity >= 2 ? 'from-blue-500 via-sky-400 to-blue-500' :
                  'from-gray-500 via-gray-300 to-gray-500'

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filteredCharacters.map((character) => (
              <Link
                key={character.id}
                href={`/wiki/characters/${categorySlug}/${character.slug}`}
                className="relative rounded-xl overflow-hidden group block aspect-[3/4] bg-wiki-darker border border-wiki-border hover:border-wiki-accent transition-all hover:shadow-lg hover:shadow-wiki-accent/20"
              >
                {/* 立绘 */}
                {character.avatar ? (
                  <img
                    src={character.avatar}
                    alt={character.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    style={{ objectPosition: character.avatarPosition || '50% 20%' }}
                  />
                ) : character.banner ? (
                  <img
                    src={character.banner}
                    alt={character.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    style={{ objectPosition: character.bannerPosition || '50% 20%' }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-wiki-gray to-wiki-darker">
                    <span className="text-5xl text-wiki-text-muted">{character.name[0]}</span>
                  </div>
                )}

                {/* 底部：稀有度漸變條 + 黑框白字名字 */}
                <div className="absolute bottom-0 left-0 right-0">
                  {/* 與立繪銜接的柔和暗化 */}
                  <div className="h-10 bg-gradient-to-t from-black/70 to-transparent" />
                  {/* 稀有度漸變條 */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${rarityGradient(character.rarity)}`} />
                  {/* 黑框白字名字 */}
                  <div className="bg-black/85 px-2 py-1.5">
                    <p className="text-white font-bold text-sm leading-tight text-center truncate drop-shadow">
                      {character.name}
                    </p>
                  </div>
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
