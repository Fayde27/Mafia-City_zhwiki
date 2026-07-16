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
  characterType?: string
  avatar: string
  banner: string
  avatarPosition?: string
  bannerPosition?: string
  rarity: number | string
  role: string
  weapon: string
  troopType?: string
  awakenHero?: boolean
  traits?: string
  coreBonus: string
  acquisition: string
  description: string
  attributes: string
  skills: string
  haojieEquip?: string
  rumors: string
  teamComp: string
  troopRec: string
  category: { name: string; slug: string }
}

interface HaojieSkill { icon?: string; type?: string; name?: string; effect?: string; multiplier?: string }
interface EquipInfo { id: string; name: string; icon?: string }

function tryParse<T>(val: any, fallback: T): T {
  if (!val) return fallback
  if (typeof val === 'object') return val as T
  try { return JSON.parse(val) as T } catch { return fallback }
}

export default function CharacterDetailPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const characterSlug = params?.characterSlug as string
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [equipMap, setEquipMap] = useState<Record<string, EquipInfo>>({})

  useEffect(() => {
    fetch(`/api/wiki/characters?category=${categorySlug}&slug=${characterSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.characters && data.characters.length > 0) setCharacter(data.characters[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [categorySlug, characterSlug])

  // 豪傑：載入武器/戰徽以解析裝備推薦
  const isHaojie = character?.characterType === 'haojie'
  useEffect(() => {
    if (!isHaojie) return
    Promise.all([
      fetch('/api/wiki/equipment?equipType=haojie_weapon').then(r => r.json()).catch(() => []),
      fetch('/api/wiki/equipment?equipType=haojie_warbadge').then(r => r.json()).catch(() => []),
    ]).then(([a, b]) => {
      const list = [...(a?.equipment || a || []), ...(b?.equipment || b || [])] as EquipInfo[]
      const map: Record<string, EquipInfo> = {}
      list.forEach(e => { if (e?.id) map[e.id] = e })
      setEquipMap(map)
    })
  }, [isHaojie])

  const getRarityStars = (rarity: number) => '★'.repeat(Math.max(0, rarity)) + '☆'.repeat(Math.max(0, 5 - rarity))

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
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-12 text-center text-wiki-text-muted">
            角色不存在
          </div>
        </main>
        <WikiFooter />
      </div>
    )
  }

  const breadcrumb = (
    <div className="text-sm text-wiki-text-muted mb-4 md:mb-6 flex flex-wrap items-center gap-y-1">
      <Link href="/" className="hover:text-wiki-accent">首頁</Link>
      <span className="mx-2">/</span>
      <Link href="/wiki" className="hover:text-wiki-accent">圖鑑</Link>
      <span className="mx-2">/</span>
      <Link href="/wiki/characters/characters" className="hover:text-wiki-accent">角色圖鑑</Link>
      <span className="mx-2">/</span>
      <Link href={`/wiki/characters/${character.category.slug}`} className="hover:text-wiki-accent">{character.category.name}</Link>
      <span className="mx-2">/</span>
      <span className="text-wiki-text">{character.name}</span>
    </div>
  )

  // ───────── 豪傑專屬渲染 ─────────
  if (isHaojie) {
    const recommend = tryParse<{ recommend?: string }>(character.attributes, {})?.recommend || ''
    const skills = (Array.isArray(tryParse(character.skills, [])) ? tryParse<HaojieSkill[]>(character.skills, []) : [])
    const traits = Array.isArray(tryParse(character.traits, [])) ? tryParse<string[]>(character.traits, []) : []
    const equip = tryParse<{ weaponId?: string; warbadgeId?: string }>(character.haojieEquip, {})
    const weaponEq = equip.weaponId ? equipMap[equip.weaponId] : undefined
    const warbadgeEq = equip.warbadgeId ? equipMap[equip.warbadgeId] : undefined
    const rarityColor = ({ 金: 'text-yellow-400', 紫: 'text-purple-400', 藍: 'text-blue-400' } as Record<string, string>)[String(character.rarity)] || 'text-wiki-text'

    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
          {breadcrumb}

          {/* 頂部：立繪 + 名稱 */}
          <div className="relative rounded-xl overflow-hidden bg-wiki-gray-light border border-wiki-border mb-6" style={{ minHeight: 180 }}>
            {character.banner && <img src={character.banner} alt={character.name} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: character.bannerPosition || '50% 50%' }} />}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
            <div className="relative z-10 flex items-end gap-4 p-5" style={{ minHeight: 180 }}>
              {character.avatar && (
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-wiki-accent bg-wiki-gray flex-shrink-0">
                  <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" style={{ objectPosition: character.avatarPosition || '50% 50%' }} />
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-white heading-hard">
                  {character.name}
                  {character.awakenHero && <span className="ml-2 text-sm px-2 py-0.5 bg-yellow-900/60 border border-yellow-500/50 text-yellow-400 rounded align-middle">覺醒</span>}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`font-bold ${rarityColor}`}>{character.rarity}</span>
                  {traits.map(t => <span key={t} className="px-2 py-0.5 text-xs bg-wiki-accent/20 text-wiki-accent border border-wiki-accent/40 rounded">{t}</span>)}
                  {character.troopType && <span className="px-2 py-0.5 text-xs bg-white/10 text-white/80 border border-white/20 rounded">{character.troopType}</span>}
                  {character.acquisition && <span className="text-xs text-white/70">獲得：{character.acquisition}</span>}
                </div>
              </div>
            </div>
          </div>

          {recommend && (
            <SectionCard title="推薦加點"><p className="text-wiki-text text-sm whitespace-pre-line leading-relaxed">{recommend}</p></SectionCard>
          )}

          {skills.length > 0 && (
            <SectionCard title="豪傑技能">
              <div className="space-y-3">
                {skills.map((sk, i) => (
                  <div key={i} className="flex gap-3 bg-wiki-gray rounded-lg p-3">
                    {sk.icon
                      ? <img src={sk.icon} alt={sk.name} className="w-10 h-10 object-contain rounded flex-shrink-0" />
                      : <div className="w-10 h-10 bg-wiki-border rounded flex-shrink-0 flex items-center justify-center text-wiki-text-muted">⚔</div>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-wiki-text text-sm">{sk.name}</span>
                        {sk.type && <span className={`px-2 py-0.5 text-xs rounded border ${sk.type === '帶隊生效' ? 'bg-blue-900/40 border-blue-500/40 text-blue-300' : 'bg-wiki-accent/10 border-wiki-accent/30 text-wiki-accent'}`}>{sk.type}</span>}
                      </div>
                      {sk.effect && <p className="text-xs text-wiki-text-muted leading-relaxed">{sk.effect}</p>}
                      {sk.multiplier && <p className="text-xs text-wiki-accent mt-0.5">升級倍率：{sk.multiplier}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {(weaponEq || warbadgeEq) && (
            <SectionCard title="裝備推薦">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {weaponEq && (
                  <div className="flex items-center gap-3 bg-wiki-gray rounded-lg p-3">
                    {weaponEq.icon
                      ? <img src={weaponEq.icon} alt={weaponEq.name} className="w-12 h-12 object-contain rounded border border-wiki-border flex-shrink-0 bg-wiki-gray-light" />
                      : <div className="w-12 h-12 rounded border border-wiki-border flex-shrink-0 bg-wiki-gray-light flex items-center justify-center text-2xl">⚔</div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-wiki-text-muted mb-0.5">武器</p>
                      <p className="font-bold text-wiki-text text-sm truncate">{weaponEq.name}</p>
                    </div>
                  </div>
                )}
                {warbadgeEq && (
                  <div className="flex items-center gap-3 bg-wiki-gray rounded-lg p-3">
                    {warbadgeEq.icon
                      ? <img src={warbadgeEq.icon} alt={warbadgeEq.name} className="w-12 h-12 object-contain rounded border border-wiki-border flex-shrink-0 bg-wiki-gray-light" />
                      : <div className="w-12 h-12 rounded border border-wiki-border flex-shrink-0 bg-wiki-gray-light flex items-center justify-center text-2xl">🛡</div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-wiki-text-muted mb-0.5">戰徽</p>
                      <p className="font-bold text-wiki-text text-sm truncate">{warbadgeEq.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {!recommend && skills.length === 0 && !weaponEq && !warbadgeEq && (
            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-8 text-center text-wiki-text-muted">暫無豪傑詳情</div>
          )}

          <div className="mt-8 flex justify-center">
            <LikeButton entityType="character" entityId={character.id} initialLikes={character.likes || 0} />
          </div>
        </main>
        <WikiFooter />
      </div>
    )
  }

  // ───────── 英雄（原有渲染） ─────────
  const rarityNum = typeof character.rarity === 'number' ? character.rarity : 0

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-6 md:py-8">
        {breadcrumb}

        {character.banner && (
          <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden mb-6 md:mb-8">
            <img src={character.banner} alt={character.name} className="w-full h-full object-cover" style={{ objectPosition: character.bannerPosition || '50% 50%' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-wiki-dark via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400 text-lg font-bold drop-shadow-lg">{getRarityStars(rarityNum)}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-wiki-text heading-hard mb-2">{character.name}</h1>
              {character.title && <p className="text-wiki-text-muted text-lg md:text-xl">{character.title}</p>}
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
                  {character.role && <span className="text-wiki-text font-bold">{character.role}</span>}
                  {character.weapon && <span className="text-wiki-text font-bold">{character.weapon}</span>}
                </div>
                {character.coreBonus && <p className="text-wiki-text-muted text-sm mt-2">核心加成：{character.coreBonus}</p>}
                {character.acquisition && <p className="text-wiki-text-muted text-sm">獲得方式：{character.acquisition}</p>}
              </div>
            </div>

            {character.description && (
              <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-wiki-accent mb-3">角色簡介</h3>
                {character.description.trim().startsWith('<') ? (
                  <div className="rich-content text-wiki-text leading-relaxed" dangerouslySetInnerHTML={{ __html: character.description }} />
                ) : (
                  <p className="text-wiki-text leading-relaxed">{character.description}</p>
                )}
              </div>
            )}

            {character.attributes && <SectionCard title="角色屬性"><MarkdownRenderer content={character.attributes} /></SectionCard>}
            {character.skills && <SectionCard title="技能詳情"><MarkdownRenderer content={character.skills} /></SectionCard>}
            {character.rumors && <SectionCard title="黑道傳聞"><MarkdownRenderer content={character.rumors} /></SectionCard>}
            {character.teamComp && <SectionCard title="陣容搭配"><MarkdownRenderer content={character.teamComp} /></SectionCard>}
            {character.troopRec && <SectionCard title="配兵推薦"><MarkdownRenderer content={character.troopRec} /></SectionCard>}
            {!character.attributes && !character.skills && !character.rumors && !character.teamComp && !character.troopRec && (
              <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-8 text-center text-wiki-text-muted">暫無角色詳情</div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6 lg:sticky lg:top-4">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">角色信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-wiki-text-muted">稀有度</span>
                  <span className="text-yellow-400 font-bold">{getRarityStars(rarityNum)}</span>
                </div>
                {character.role && <div className="flex justify-between"><span className="text-wiki-text-muted">角色定位</span><span className="text-wiki-text font-bold">{character.role}</span></div>}
                {character.weapon && <div className="flex justify-between"><span className="text-wiki-text-muted">適配兵種</span><span className="text-wiki-text">{character.weapon}</span></div>}
                {character.coreBonus && <div className="flex justify-between"><span className="text-wiki-text-muted">核心加成</span><span className="text-wiki-text">{character.coreBonus}</span></div>}
                {character.acquisition && <div className="flex justify-between"><span className="text-wiki-text-muted">獲得方式</span><span className="text-wiki-text">{character.acquisition}</span></div>}
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="mt-8 flex justify-center">
        <LikeButton entityType="character" entityId={character.id} initialLikes={character.likes || 0} />
      </div>

      <WikiFooter />
    </div>
  )
}
