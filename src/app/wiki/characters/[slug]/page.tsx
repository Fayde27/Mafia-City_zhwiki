'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface Character {
  id: string
  name: string
  slug: string
  title: string
  avatar: string
  banner: string
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
  const { isAdmin, isLoaded } = useAdminAuth()
  const [characters, setCharacters] = useState<Character[]>([])
  const [category, setCategory] = useState<CharacterCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterRarity, setFilterRarity] = useState<string>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterWeapon, setFilterWeapon] = useState<string>('all')
  const [filterOptions, setFilterOptions] = useState<CharacterFilterOption[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/wiki/characters?category=${categorySlug}`).then(res => res.json()),
      fetch('/api/wiki/characters/categories').then(res => res.json()),
      fetch('/api/admin/character-filters').then(res => res.json()),
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
    if (filterRarity !== 'all' && c.rarity !== parseInt(filterRarity)) return false
    if (filterRole !== 'all' && c.role !== filterRole) return false
    if (filterWeapon !== 'all' && c.weapon !== filterWeapon) return false
    return true
  })

  const getRarityStars = (rarity: number) => {
    return '★'.repeat(rarity) + '☆'.repeat(5 - rarity)
  }

  const rarityOptions = filterOptions.filter(o => o.type === 'rarity')
  const roleOptions = filterOptions.filter(o => o.type === 'role')
  const weaponOptions = filterOptions.filter(o => o.type === 'weapon')

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
          <span className="text-wiki-text">{category?.name || '加载中...'}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{category?.icon}</span>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">
              {category?.name}
            </h1>
          </div>
          {isAdmin && (
            <Link
              href="/admin/characters"
              className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90"
            >
              管理角色
            </Link>
          )}
        </div>

        {(rarityOptions.length > 0 || roleOptions.length > 0 || weaponOptions.length > 0) && (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-4 md:p-6 mb-6 space-y-4">
            {rarityOptions.length > 0 && (
              <div>
                <div className="text-sm font-bold text-wiki-accent uppercase tracking-wider mb-2">稀有度</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterRarity('all')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                      filterRarity === 'all'
                        ? 'bg-wiki-accent text-wiki-darker'
                        : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                    }`}
                  >
                    全部
                  </button>
                  {rarityOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFilterRarity(opt.value)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                        filterRarity === opt.value
                          ? 'bg-wiki-accent text-wiki-darker'
                          : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                      }`}
                    >
                      {getRarityStars(parseInt(opt.value))}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {roleOptions.length > 0 && (
              <div>
                <div className="text-sm font-bold text-wiki-accent uppercase tracking-wider mb-2">角色定位</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterRole('all')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                      filterRole === 'all'
                        ? 'bg-wiki-accent text-wiki-darker'
                        : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                    }`}
                  >
                    全部
                  </button>
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFilterRole(opt.value)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                        filterRole === opt.value
                          ? 'bg-wiki-accent text-wiki-darker'
                          : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                      }`}
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {weaponOptions.length > 0 && (
              <div>
                <div className="text-sm font-bold text-wiki-accent uppercase tracking-wider mb-2">适配兵种</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterWeapon('all')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                      filterWeapon === 'all'
                        ? 'bg-wiki-accent text-wiki-darker'
                        : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                    }`}
                  >
                    全部
                  </button>
                  {weaponOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFilterWeapon(opt.value)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                        filterWeapon === opt.value
                          ? 'bg-wiki-accent text-wiki-darker'
                          : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                      }`}
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
        ) : filteredCharacters.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-8 md:p-12 text-center text-wiki-text-muted">
            该分类下暂无角色
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
                  {character.banner ? (
                    <img
                      src={character.banner}
                      alt={character.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : character.avatar ? (
                    <img
                      src={character.avatar}
                      alt={character.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                      {character.description}
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
