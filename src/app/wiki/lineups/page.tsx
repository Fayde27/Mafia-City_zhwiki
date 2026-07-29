'use client'

export const runtime = 'edge'

import LineupWikiApp from '@/components/LineupWikiApp'

// 豪傑陣容搭配（英雄在 /wiki/hero-lineups）
export default function HaojieLineupsWikiPage() {
  return <LineupWikiApp kind="haojie" />
}
