'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface WikiSection {
  label: string
  href: string
}

const navSections: WikiSection[] = [
  { label: '首頁', href: '/' },
  { label: '遊戲圖鑑', href: '/wiki' },
  { label: '排行榜', href: '/wiki/rankings' },
  { label: '玩法攻略', href: '/wiki/guides' },
  { label: '活動一覽', href: '/wiki/events' },
  { label: '遊戲工具', href: '/wiki/tools' },
]

export default function WikiHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAdmin, logout } = useAdminAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/wiki/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/'
    if (href === '/wiki') return pathname === '/wiki' || pathname === '/wiki/'
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <header className="sticky top-0 z-50" style={{ overflow: 'visible' }} ref={dropdownRef}>
      <div className="bg-wiki-dark border-b border-wiki-border/20" style={{ overflow: 'visible' }}>
        <div className="container mx-auto px-4" style={{ overflow: 'visible' }}>
          <div className="flex items-center justify-between py-3" style={{ overflow: 'visible' }}>
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="text-xl font-bold text-wiki-accent">黑道風雲</div>
              <div className="hidden sm:block text-wiki-text-muted text-xs">Wiki 攻略站</div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 overflow-visible">
              {navSections.map(section => (
                <Link
                  key={section.href}
                  href={section.href}
                  className={`px-3 py-1.5 text-sm transition-colors rounded ${
                    isActive(section.href)
                      ? 'text-wiki-accent bg-wiki-accent/10'
                      : 'text-wiki-text-muted hover:text-white'
                  }`}
                >
                  {section.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索攻略..."
                  className="bg-wiki-darker border border-wiki-border/30 px-3 py-1.5 text-sm text-white w-48 focus:border-wiki-accent focus:outline-none rounded"
                />
                <button type="submit" className="absolute right-2 text-wiki-text-muted hover:text-wiki-accent">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

              {isAdmin && (
                <button onClick={handleLogout} className="text-wiki-danger text-xs hover:text-wiki-danger/80 transition-colors">
                  退出
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-wiki-accent text-xl"
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-wiki-dark border-b border-wiki-border/20">
          <div className="container mx-auto px-4 py-3 space-y-1">
            {navSections.map(section => (
              <Link
                key={section.href}
                href={section.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm rounded ${
                  isActive(section.href)
                    ? 'text-wiki-accent bg-wiki-accent/10'
                    : 'text-wiki-text-muted hover:text-white'
                }`}
              >
                {section.label}
              </Link>
            ))}
            <form onSubmit={handleSearch} className="relative pt-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索攻略..."
                className="w-full bg-wiki-darker border border-wiki-border/30 px-3 py-2 text-sm text-white focus:border-wiki-accent focus:outline-none rounded"
              />
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
