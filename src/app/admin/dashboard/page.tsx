'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

interface Stats {
  articles: number
  announcements: number
  lineups: number
  items: number
  events: number
  submissions: number
  drafts: number
}

const NAV_SECTIONS = [
  {
    title: '內容管理',
    links: [
      { label: '攻略文章', href: '/admin/articles', icon: '📝', desc: '文章列表、分類管理' },
      { label: '全站公告', href: '/admin/announcements', icon: '📢', desc: '公告新增與管理' },
      { label: '攻略投稿', href: '/admin/submissions', icon: '📬', desc: '玩家投稿審核' },
      { label: '草稿箱', href: '/admin/drafts', icon: '📂', desc: '未發佈內容' },
    ],
  },
  {
    title: '內容模塊',
    links: [
      { label: '陣容搭配', href: '/admin/lineups', icon: '🎯', desc: '豪傑陣容 · 角色/武器/戰徽/流派' },
      { label: '道具介紹', href: '/admin/items', icon: '🎒', desc: '稀有道具列表、分類、篩選' },
      { label: '活動一覽', href: '/admin/events', icon: '🎉', desc: '活動列表、分類管理' },
    ],
  },
  {
    title: '站點管理',
    links: [
      { label: '側邊欄', href: '/admin/sidebar', icon: '📋', desc: '導航管理、分區管理' },
      { label: '輪播 Banner', href: '/admin/banner-articles', icon: '🎠', desc: '選擇首頁輪播展示的文章' },
      { label: '站點配置', href: '/admin/site-config', icon: '⚙️', desc: '首頁 Banner、熱門標籤' },
    ],
  },
]

export default function AdminDashboardPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    fetchStats()
  }, [isAdmin, isLoaded, router])

  const fetchStats = async () => {
    try {
      const [artRes, annRes, lineupRes, itemRes, eventRes, subRes] = await Promise.all([
        fetch('/api/admin/articles?limit=1').then(r => r.json()),
        fetch('/api/admin/announcements').then(r => r.json()),
        fetch('/api/admin/lineups').then(r => r.json()),
        fetch('/api/admin/items?limit=1').then(r => r.json()),
        fetch('/api/admin/events').then(r => r.json()),
        fetch('/api/admin/submissions').then(r => r.json()),
      ])
      const draftRes = await fetch('/api/admin/articles?draft=true&limit=1').then(r => r.json())
      setStats({
        articles: artRes?.pagination?.total || 0,
        announcements: Array.isArray(annRes) ? annRes.length : 0,
        lineups: Array.isArray(lineupRes?.lineups) ? lineupRes.lineups.length : 0,
        items: itemRes?.pagination?.total || 0,
        events: Array.isArray(eventRes?.events) ? eventRes.events.length : (Array.isArray(eventRes) ? eventRes.length : 0),
        submissions: Array.isArray(subRes?.submissions) ? subRes.submissions.length : 0,
        drafts: draftRes?.pagination?.total || 0,
      })
    } catch {}
  }

  if (!isAdmin) return null

  const statCards = stats ? [
    { label: '攻略文章', value: stats.articles, href: '/admin/articles', color: 'text-wiki-accent' },
    { label: '全站公告', value: stats.announcements, href: '/admin/announcements', color: 'text-blue-400' },
    { label: '陣容搭配', value: stats.lineups, href: '/admin/lineups', color: 'text-purple-400' },
    { label: '道具', value: stats.items, href: '/admin/items', color: 'text-green-400' },
    { label: '活動', value: stats.events, href: '/admin/events', color: 'text-orange-400' },
    { label: '待審投稿', value: stats.submissions, href: '/admin/submissions', color: 'text-pink-400' },
    { label: '草稿', value: stats.drafts, href: '/admin/drafts', color: 'text-wiki-text-muted' },
  ] : []

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">管理後台</h1>
          <p className="text-wiki-text-muted text-sm mt-1">黑道風雲 Wiki 攻略站管理中心</p>
        </div>

        {/* 統計數據 */}
        {stats && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-3 mb-8">
            {statCards.map(card => (
              <Link key={card.label} href={card.href} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-4 text-center hover:border-wiki-accent/50 transition-colors">
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                <div className="text-wiki-text-muted text-xs mt-1">{card.label}</div>
              </Link>
            ))}
          </div>
        )}

        {/* 快速導航 */}
        <div className="space-y-6">
          {NAV_SECTIONS.map(section => (
            <div key={section.title}>
              <h2 className="text-lg font-bold text-wiki-text mb-3">{section.title}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {section.links.map(link => (
                  <Link key={link.href} href={link.href} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-4 hover:border-wiki-accent/60 hover:bg-wiki-gray transition-colors group">
                    <div className="text-2xl mb-2">{link.icon}</div>
                    <div className="text-wiki-text font-bold text-sm group-hover:text-wiki-accent transition-colors">{link.label}</div>
                    <div className="text-wiki-text-muted text-xs mt-1">{link.desc}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <WikiFooter />
    </div>
  )
}
