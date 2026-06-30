'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import LikeButton from '@/components/LikeButton'
import SectionCard from '@/components/SectionCard'

interface Character {
  id: string
  likes?: number
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
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)

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
    return '★'.repeat(Math.max(0, rarity)) + '☆'.repeat(Math.max(0, 5 - rarity))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <div className="text-center py-20 text-wiki-text-muted">載入中...</div>
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
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">圖鑑</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/characters/characters" className="hover:text-wiki-accent">角色圖鑑</Link>
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
                  <p className="text-wiki-text-muted text-sm">獲取方式：{character.acquisition}</p>
                )}
              </div>
            </div>

            {character.description && (
              <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-wiki-accent mb-3">角色簡介</h3>
                {character.description.trim().startsWith('<') ? (
                  <div className="rich-content text-wiki-text leading-relaxed" dangerouslySetInnerHTML={{ __html: character.description }} />
                ) : (
                  <p className="text-wiki-text leading-relaxed">{character.description}</p>
                )}
              </div>
            )}

            {character.attributes && (
              <SectionCard title="角色屬性"><MarkdownRenderer content={character.attributes} /></SectionCard>
            )}
            {character.skills && (
              <SectionCard title="技能詳情"><MarkdownRenderer content={character.skills} /></SectionCard>
            )}
            {character.rumors && (
              <SectionCard title="黑道傳聞"><MarkdownRenderer content={character.rumors} /></SectionCard>
            )}
            {character.teamComp && (
              <SectionCard title="陣容搭配"><MarkdownRenderer content={character.teamComp} /></SectionCard>
            )}
            {character.troopRec && (
              <SectionCard title="配兵推薦"><MarkdownRenderer content={character.troopRec} /></SectionCard>
            )}
            {!character.attributes && !character.skills && !character.rumors && !character.teamComp && !character.troopRec && (
              <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-8 text-center text-wiki-text-muted">暫無角色詳情</div>
            )}
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
                    <span className="text-wiki-text-muted">適配兵種</span>
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
                    <span className="text-wiki-text-muted">獲取方式</span>
                    <span className="text-wiki-text">{character.acquisition}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </main>


      <div className="mt-8 flex justify-center">
        <LikeButton entityType="character" entityId={character?.id || ''} initialLikes={character?.likes || 0} />
      </div>

      <WikiFooter />
    </div>
  )
}
