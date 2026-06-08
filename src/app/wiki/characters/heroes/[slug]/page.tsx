'use client'

export const runtime = 'edge'

import { useState, useEffect, useRef } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import MarkdownRenderer from '@/components/MarkdownRenderer'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Bonus { label: string; value: string }
interface SkillEntry { icon?: string; type: string; name: string; effect: string; multiplier?: string }
interface SkinEntry { id?: string; name: string; art?: string; icon?: string; bonuses: Bonus[]; acquisition?: string }
interface SkinBondEntry { name: string; skinIds: string[]; bonuses: Bonus[] }
interface TeamCompEntry { id: string; name: string; reason?: string; members: CharacterRef[] }
interface BloodBondEntry { id: string; requiredStars: number; bonuses: Bonus[]; members: CharacterRef[] }
interface CharacterRef { id: string; name: string; slug: string; avatar?: string; rarity?: string }
interface EquipmentRef { id: string; name: string; slug: string; icon?: string; rarity?: number; slot?: string }
interface ArticleRef { id: string; title: string; slug: string; coverImage?: string }

interface HeroData {
  id: string; name: string; slug: string
  avatar?: string; banner?: string; bannerPosition?: string
  rarity: string; traits?: string; troopType?: string; acquisition?: string; story?: string
  attributes?: string; skills?: string
  category: { name: string; slug: string }
  skins: SkinEntry[]
  skinBonds: SkinBondEntry[]
  teamComps: TeamCompEntry[]
  bloodBonds: BloodBondEntry[]
  equipments: EquipmentRef[]
  relatedArticles: ArticleRef[]
}

// ─── Radar chart ─────────────────────────────────────────────────────────────

function RadarChart({ attrs }: { attrs: any }) {
  const size = 280
  const cx = size / 2
  const cy = size / 2
  const r = 100
  const labels = ['攻擊', '防衛', '魅帥', '速度']
  const angles = labels.map((_, i) => (Math.PI * 2 * i) / 4 - Math.PI / 2)

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  })

  const baseVals = [attrs?.attackBase, attrs?.defenseBase, attrs?.charismaBase, attrs?.speedBase].map(Number)
  const maxVals = [attrs?.attackMax, attrs?.defenseMax, attrs?.charismaMax, attrs?.speedMax].map(Number)
  const globalMax = Math.max(...maxVals, 1)

  const polyPoints = (vals: number[]) =>
    vals.map((v, i) => {
      const pt = toXY(angles[i], (v / globalMax) * r)
      return `${pt.x},${pt.y}`
    }).join(' ')

  return (
    <svg width={size} height={size} className="mx-auto drop-shadow-lg">
      {[0.25, 0.5, 0.75, 1].map(frac => (
        <polygon key={frac}
          points={angles.map(a => { const p = toXY(a, r * frac); return `${p.x},${p.y}` }).join(' ')}
          fill="none" stroke="#374151" strokeWidth="1" />
      ))}
      {angles.map((a, i) => {
        const outer = toXY(a, r)
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#374151" strokeWidth="1" />
      })}
      {baseVals.some(v => v > 0) && (
        <polygon points={polyPoints(baseVals)} fill="rgba(59,130,246,0.25)" stroke="#60a5fa" strokeWidth="2" />
      )}
      {maxVals.some(v => v > 0) && (
        <polygon points={polyPoints(maxVals)} fill="rgba(212,175,55,0.2)" stroke="#d4af37" strokeWidth="2" />
      )}
      {labels.map((label, i) => {
        const pt = toXY(angles[i], r + 18)
        return (
          <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="13" fill="#d1b27a" fontWeight="bold">{label}</text>
        )
      })}
    </svg>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-wiki-border">
        <h2 className="text-lg font-heading font-bold text-wiki-accent heading-hard">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HeroDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [hero, setHero] = useState<HeroData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('')
  const [storyOpen, setStoryOpen] = useState(false)
  const [activeSkinTab, setActiveSkinTab] = useState(0)
  const [activeTeamTab, setActiveTeamTab] = useState(0)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    fetch(`/api/wiki/characters/heroes?slug=${slug}`)
      .then(r => r.json())
      .then(d => { setHero(d.id ? d : null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  const attrs = hero ? tryParse(hero.attributes, {}) : {}
  const skills: SkillEntry[] = hero ? tryParse(hero.skills, []) : []
  const traits: string[] = hero ? tryParse(hero.traits, []) : []

  // visible sections
  const sections = [
    { id: 'attributes', label: '英雄屬性', show: true },
    { id: 'skills', label: '英雄技能', show: skills.length > 0 },
    { id: 'equipment', label: '推薦裝備', show: (hero?.equipments?.length ?? 0) > 0 },
    { id: 'teamcomp', label: '陣容搭配', show: (hero?.teamComps?.length ?? 0) > 0 },
    { id: 'skins', label: '英雄皮膚', show: (hero?.skins?.length ?? 0) > 0 },
    { id: 'bloodbond', label: '血盟', show: (hero?.bloodBonds?.length ?? 0) > 0 },
  ]

  useEffect(() => {
    if (!hero) return
    const first = sections.find(s => s.show)
    if (first) setActiveSection(first.id)
  }, [hero])

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY + 160
      for (const s of sections) {
        if (!s.show) continue
        const el = sectionRefs.current[s.id]
        if (el && el.offsetTop <= scrollY) setActiveSection(s.id)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hero])

  const scrollTo = (id: string) => sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  if (loading) return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <div className="text-center py-20 text-wiki-text-muted">載入中...</div>
      <WikiFooter />
    </div>
  )

  if (!hero) return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <div className="text-center py-20 text-wiki-text-muted">角色不存在</div>
      <WikiFooter />
    </div>
  )

  const rarityColor = { '金': 'text-yellow-400', '紫': 'text-purple-400', '藍': 'text-blue-400' }[hero.rarity] || 'text-wiki-text'

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="text-sm text-wiki-text-muted mb-4 flex items-center gap-1.5">
          <Link href="/wiki" className="hover:text-wiki-accent">首頁</Link>
          <span>/</span>
          <Link href="/wiki/characters/heroes" className="hover:text-wiki-accent">英雄圖鑑</Link>
          <span>/</span>
          <span className="text-wiki-text">{hero.name}</span>
        </nav>

        {/* Banner card */}
        <div className="relative w-full rounded-xl overflow-hidden mb-8 bg-wiki-gray-light border border-wiki-border" style={{ minHeight: 220 }}>
          {hero.banner && (
            <img src={hero.banner} alt={hero.name}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: hero.bannerPosition || '50% 50%' }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="relative z-10 flex items-end gap-5 p-6">
            {hero.avatar && (
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-wiki-accent flex-shrink-0 bg-wiki-gray">
                <img src={hero.avatar} alt={hero.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-3xl font-heading font-bold text-white heading-hard">{hero.name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`font-bold text-lg ${rarityColor}`}>{hero.rarity}</span>
                    {traits.map(t => (
                      <span key={t} className="px-2 py-0.5 text-xs bg-wiki-accent/20 text-wiki-accent border border-wiki-accent/40 rounded">{t}</span>
                    ))}
                    {hero.troopType && (
                      <span className="px-2 py-0.5 text-xs bg-white/10 text-white/80 border border-white/20 rounded">{hero.troopType}</span>
                    )}
                    {hero.acquisition && (
                      <span className="text-xs text-white/60">獲取：{hero.acquisition}</span>
                    )}
                  </div>
                </div>
                {hero.story && (
                  <button onClick={() => setStoryOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-wiki-accent text-wiki-accent text-sm font-bold hover:bg-wiki-accent hover:text-wiki-bg transition-colors rounded">
                    英雄故事
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* Sticky left nav */}
          <aside className="hidden lg:block w-44 flex-shrink-0 sticky top-24">
            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-3">
              <nav className="space-y-1">
                {sections.filter(s => s.show).map(s => (
                  <button key={s.id} type="button"
                    onClick={() => scrollTo(s.id)}
                    className={`w-full text-left px-3 py-2 text-sm font-bold transition-colors rounded
                      ${activeSection === s.id ? 'text-wiki-accent border-l-2 border-wiki-accent pl-2' : 'text-wiki-text-muted hover:text-wiki-text'}`}>
                    {s.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 space-y-8 min-w-0">

            {/* 英雄屬性 */}
            <div ref={el => { sectionRefs.current['attributes'] = el }}>
              <Section title="英雄屬性">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-shrink-0">
                    <RadarChart attrs={attrs} />
                    <div className="flex gap-4 justify-center mt-3 text-sm text-wiki-text-muted">
                      <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-blue-400"></span>初始值</span>
                      <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-yellow-500"></span>滿級值</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-wiki-border">
                          <th className="text-left py-2 text-wiki-text-muted font-bold">屬性</th>
                          <th className="text-right py-2 text-blue-400 font-bold">初始值</th>
                          <th className="text-right py-2 text-yellow-500 font-bold">滿級值</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: '攻擊', base: attrs?.attackBase, max: attrs?.attackMax },
                          { label: '防衛', base: attrs?.defenseBase, max: attrs?.defenseMax },
                          { label: '魅帥', base: attrs?.charismaBase, max: attrs?.charismaMax },
                          { label: '速度', base: attrs?.speedBase, max: attrs?.speedMax },
                        ].map(row => (
                          <tr key={row.label} className="border-b border-wiki-border/40">
                            <td className="py-3 text-wiki-text font-bold">{row.label}</td>
                            <td className="py-3 text-right text-blue-300">{row.base || '—'}</td>
                            <td className="py-3 text-right text-yellow-400 font-bold">{row.max || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Section>
            </div>

            {/* 英雄技能 */}
            {skills.length > 0 && (
              <div ref={el => { sectionRefs.current['skills'] = el }}>
                <Section title="英雄技能">
                  <div className="space-y-4">
                    {skills.map((sk, i) => (
                      <div key={i} className="bg-wiki-gray rounded-lg p-4 flex gap-4">
                        {sk.icon ? (
                          <img src={sk.icon} alt={sk.name} className="w-12 h-12 object-contain rounded flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-wiki-border rounded flex-shrink-0 flex items-center justify-center text-wiki-text-muted text-xl">⚔</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-wiki-text">{sk.name}</span>
                            <span className={`px-2 py-0.5 text-xs rounded border
                              ${sk.type === '帶動生效' ? 'bg-blue-900/40 border-blue-500/40 text-blue-300' : 'bg-wiki-accent/10 border-wiki-accent/30 text-wiki-accent'}`}>
                              {sk.type}
                            </span>
                          </div>
                          <p className="text-sm text-wiki-text-muted leading-relaxed">{sk.effect}</p>
                          {sk.multiplier && (
                            <p className="text-xs text-wiki-accent mt-1">升級倍率：{sk.multiplier}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {/* 推薦裝備 */}
            {(hero.equipments?.length ?? 0) > 0 && (
              <div ref={el => { sectionRefs.current['equipment'] = el }}>
                <Section title="推薦裝備">
                  <div className="flex flex-wrap gap-4">
                    {hero.equipments.map(eq => (
                      <a key={eq.id} href="#" className="flex flex-col items-center gap-2 w-20 group">
                        {eq.icon ? (
                          <img src={eq.icon} alt={eq.name} className="w-14 h-14 object-contain rounded border border-wiki-border group-hover:border-wiki-accent transition-colors" />
                        ) : (
                          <div className="w-14 h-14 bg-wiki-gray rounded border border-wiki-border flex items-center justify-center text-wiki-text-muted">?</div>
                        )}
                        <span className="text-xs text-wiki-text-muted text-center group-hover:text-wiki-accent transition-colors line-clamp-2">{eq.name}</span>
                      </a>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {/* 陣容搭配 */}
            {(hero.teamComps?.length ?? 0) > 0 && (
              <div ref={el => { sectionRefs.current['teamcomp'] = el }}>
                <Section title="陣容搭配">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {hero.teamComps.map((tc, i) => (
                      <button key={tc.id}
                        onClick={() => setActiveTeamTab(i)}
                        className={`px-4 py-1.5 text-sm font-bold border transition-colors rounded
                          ${activeTeamTab === i ? 'border-wiki-accent text-wiki-accent bg-wiki-accent/10' : 'border-wiki-border text-wiki-text-muted hover:text-wiki-text'}`}>
                        {tc.name}
                      </button>
                    ))}
                  </div>
                  {hero.teamComps[activeTeamTab] && (
                    <div>
                      <div className="flex gap-4 flex-wrap mb-4">
                        {hero.teamComps[activeTeamTab].members.map(m => (
                          <a key={m.id} href="#" className="flex flex-col items-center gap-2 w-16 group">
                            {m.avatar ? (
                              <img src={m.avatar} alt={m.name} className="w-12 h-12 object-cover rounded-full border-2 border-wiki-border group-hover:border-wiki-accent transition-colors" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-wiki-gray border-2 border-wiki-border flex items-center justify-center text-wiki-text-muted text-lg">?</div>
                            )}
                            <span className="text-xs text-wiki-text-muted text-center group-hover:text-wiki-accent transition-colors">{m.name}</span>
                          </a>
                        ))}
                      </div>
                      {hero.teamComps[activeTeamTab].reason && (
                        <p className="text-sm text-wiki-text-muted leading-relaxed">{hero.teamComps[activeTeamTab].reason}</p>
                      )}
                    </div>
                  )}
                </Section>
              </div>
            )}

            {/* 英雄皮膚 */}
            {(hero.skins?.length ?? 0) > 0 && (
              <div ref={el => { sectionRefs.current['skins'] = el }}>
                <Section title="英雄皮膚">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {hero.skins.map((sk, i) => (
                      <button key={i}
                        onClick={() => setActiveSkinTab(i)}
                        className={`px-4 py-1.5 text-sm font-bold border transition-colors rounded
                          ${activeSkinTab === i ? 'border-wiki-accent text-wiki-accent bg-wiki-accent/10' : 'border-wiki-border text-wiki-text-muted hover:text-wiki-text'}`}>
                        {sk.name || `皮膚 ${i + 1}`}
                      </button>
                    ))}
                  </div>
                  {hero.skins[activeSkinTab] && (
                    <div className="flex gap-6 flex-col md:flex-row">
                      {hero.skins[activeSkinTab].art ? (
                        <div className="flex-shrink-0 flex items-end justify-center bg-wiki-gray rounded-lg overflow-hidden" style={{ minHeight: 280 }}>
                          <img src={hero.skins[activeSkinTab].art} alt={hero.skins[activeSkinTab].name}
                            className="h-72 object-contain object-bottom" />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-40 bg-wiki-gray rounded-lg flex items-center justify-center text-wiki-text-muted" style={{ height: 280 }}>無立繪</div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-wiki-text mb-3">{hero.skins[activeSkinTab].name}</h4>
                        {hero.skins[activeSkinTab].acquisition && (
                          <p className="text-sm text-wiki-text-muted mb-4">獲取途徑：<span className="text-wiki-accent">{hero.skins[activeSkinTab].acquisition}</span></p>
                        )}
                        {(hero.skins[activeSkinTab].bonuses?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-xs text-wiki-text-muted font-bold uppercase tracking-wider mb-2">屬性加成</p>
                            <div className="space-y-1">
                              {hero.skins[activeSkinTab].bonuses.map((b, bi) => (
                                <div key={bi} className="flex justify-between text-sm">
                                  <span className="text-wiki-text-muted">{b.label}</span>
                                  <span className="text-wiki-accent font-bold">{b.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 皮膚羁绊 */}
                  {(hero.skinBonds?.length ?? 0) > 0 && (
                    <div className="mt-6 pt-6 border-t border-wiki-border">
                      <h4 className="font-bold text-wiki-text mb-4">皮膚羁绊</h4>
                      <div className="space-y-3">
                        {hero.skinBonds.map((sb, i) => (
                          <div key={i} className="bg-wiki-gray rounded p-4">
                            <p className="font-bold text-wiki-accent mb-2">{sb.name}</p>
                            {(sb.bonuses?.length ?? 0) > 0 && (
                              <div className="flex flex-wrap gap-x-6 gap-y-1">
                                {sb.bonuses.map((b, bi) => (
                                  <div key={bi} className="flex gap-2 text-sm">
                                    <span className="text-wiki-text-muted">{b.label}</span>
                                    <span className="text-wiki-accent font-bold">{b.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Section>
              </div>
            )}

            {/* 血盟 */}
            {(hero.bloodBonds?.length ?? 0) > 0 && (
              <div ref={el => { sectionRefs.current['bloodbond'] = el }}>
                <Section title="血盟">
                  <div className="space-y-4">
                    {hero.bloodBonds.map((bb, i) => (
                      <div key={bb.id} className="bg-wiki-gray rounded-lg p-4">
                        <div className="flex items-center gap-4 mb-3 flex-wrap">
                          <div className="flex gap-3">
                            {bb.members.map(m => (
                              <a key={m.id} href="#" className="flex flex-col items-center gap-1 group">
                                {m.avatar ? (
                                  <img src={m.avatar} alt={m.name} className="w-10 h-10 object-cover rounded-full border border-wiki-border group-hover:border-wiki-accent transition-colors" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-wiki-bg border border-wiki-border flex items-center justify-center text-wiki-text-muted text-sm">?</div>
                                )}
                                <span className="text-xs text-wiki-text-muted group-hover:text-wiki-accent transition-colors">{m.name}</span>
                              </a>
                            ))}
                          </div>
                          {bb.requiredStars > 0 && (
                            <span className="text-sm text-wiki-text-muted">{'★'.repeat(bb.requiredStars)} 星解鎖</span>
                          )}
                        </div>
                        {(bb.bonuses?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-x-6 gap-y-1">
                            {bb.bonuses.map((b, bi) => (
                              <div key={bi} className="flex gap-2 text-sm">
                                <span className="text-wiki-text-muted">{b.label}</span>
                                <span className="text-wiki-accent font-bold">{b.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

          </div>
        </div>

        {/* 相關攻略 floating button (desktop) */}
        {(hero.relatedArticles?.length ?? 0) > 0 && (
          <div className="fixed bottom-8 right-8 hidden lg:block z-30">
            <details className="group">
              <summary className="btn-hard text-wiki-text px-4 py-2 cursor-pointer list-none flex items-center gap-2">
                相關攻略 ({hero.relatedArticles.length})
              </summary>
              <div className="absolute bottom-full right-0 mb-2 w-64 bg-wiki-gray-light border border-wiki-border rounded-lg shadow-xl overflow-hidden">
                {hero.relatedArticles.map(art => (
                  <Link key={art.id} href={`/wiki/articles/${art.slug}`}
                    className="block px-4 py-3 text-sm text-wiki-text hover:bg-wiki-gray hover:text-wiki-accent transition-colors border-b border-wiki-border/40 last:border-0">
                    {art.title}
                  </Link>
                ))}
              </div>
            </details>
          </div>
        )}
      </main>

      {/* Story Modal */}
      {storyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={e => { if (e.target === e.currentTarget) setStoryOpen(false) }}>
          <div className="bg-wiki-gray-light border border-wiki-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-wiki-border">
              <h3 className="text-lg font-heading font-bold text-wiki-accent heading-hard">{hero.name}的故事</h3>
              <button onClick={() => setStoryOpen(false)} className="text-wiki-text-muted hover:text-wiki-text text-2xl leading-none">×</button>
            </div>
            <div className="overflow-y-auto px-6 py-4">
              {hero.story && <MarkdownRenderer content={hero.story} />}
            </div>
          </div>
        </div>
      )}

      <WikiFooter />
    </div>
  )
}

function tryParse(val: any, fallback: any) {
  if (!val) return fallback
  if (typeof val === 'object') return val
  try { return JSON.parse(val) } catch { return fallback }
}
