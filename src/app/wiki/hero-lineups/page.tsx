'use client'

export const runtime = 'edge'

import LineupWikiApp from '@/components/LineupWikiApp'

// 英雄陣容搭配（豪傑在 /wiki/lineups）
export default function HeroLineupsWikiPage() {
  return <LineupWikiApp kind="hero" />
}
