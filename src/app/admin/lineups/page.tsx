'use client'

export const runtime = 'edge'

import LineupAdminApp from '@/components/LineupAdminApp'

// 豪傑陣容搭配後台（英雄在 /admin/hero-lineups）
export default function HaojieLineupsAdminPage() {
  return <LineupAdminApp kind="haojie" />
}
