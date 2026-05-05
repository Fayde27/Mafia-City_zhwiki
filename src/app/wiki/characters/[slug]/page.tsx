'use client'

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
  path: string
  faction: string
  combatType: string
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

export default function CharacterListPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const { isAdmin, isLoaded } = useAdminAuth()
  const [characters, setCharacters] = useState<Character[]>([])
  const [category, setCategory] = useState<CharacterCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterPath, setFilterPath] = useState<string>('all')
  const [paths, setPaths] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/wiki/characters?category=${categorySlug}`).then(res => res.json()),
      fetch('/api/wiki/characters/categories').then(res => res.json()),
    ]).then(([charData, catData]) => {
      const chars = charData?.characters || []
      setCharacters(chars)
      
      const cat = catData?.find((c: CharacterCategory) => c.slug === categorySlug)
      setCategory(cat || null)
      
      const uniquePaths = [...new Set(chars.map((c: Character) => c.path).filter(Boolean))]
      setPaths(uniquePaths as string[])
      
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [categorySlug])

  const filteredCharacters = filterPath === 'all' 
    ? characters 
    : characters.filter(c => c.path === filterPath)

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
      '记忆': '❄️',
      '欢愉': '🎭',
    }
    return icons[path] || '⭐'
  }

  const getCombatTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '物理': 'text-gray-300',
      '火': 'text-red-400',
      '冰': 'text-cyan-300',
      '雷': 'text-purple-400',
      '风': 'text-green-400',
      '量子': 'text-indigo-400',
      '虚数': 'text-yellow-400',
    }
    return colors[type] || 'text-wiki-text'
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

        {paths.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilterPath('all')}
              className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
                filterPath === 'all'
                  ? 'bg-wiki-accent text-wiki-darker'
                  : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
              }`}
            >
              全部
            </button>
            {paths.map((path) => (
              <button
                key={path}
                onClick={() => setFilterPath(path)}
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                  filterPath === path
                    ? 'bg-wiki-accent text-wiki-darker'
                    : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                }`}
              >
                <span>{getPathIcon(path)}</span>
                {path}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
        ) : filteredCharacters.length === 0 ? (
          <div className="card-hard rounded-lg p-8 md:p-12 text-center text-wiki-text-muted">
            该分类下暂无角色
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredCharacters.map((character) => (
              <Link
                key={character.id}
                href={`/wiki/characters/${categorySlug}/${character.slug}`}
                className="card-hard rounded-lg overflow-hidden group block hover:border-wiki-accent transition-all"
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
                    <span className={`text-lg ${getCombatTypeColor(character.combatType)} drop-shadow-lg`}>
                      {character.combatType === '物理' ? '⚪' :
                       character.combatType === '火' ? '🔥' :
                       character.combatType === '冰' ? '❄️' :
                       character.combatType === '雷' ? '⚡' :
                       character.combatType === '风' ? '🌪️' :
                       character.combatType === '量子' ? '' :
                       character.combatType === '虚数' ? '✨' : '⭐'}
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
                    {character.path && (
                      <span className="flex items-center gap-1">
                        {getPathIcon(character.path)} {character.path}
                      </span>
                    )}
                    {character.faction && (
                      <span>· {character.faction}</span>
                    )}
                  </div>
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
