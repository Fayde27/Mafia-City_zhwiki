'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface Category {
  id: string
  name: string
  slug: string
}

export default function WikiHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAdmin, logout } = useAdminAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navCategories, setNavCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch('/api/wiki/categories')
      .then(res => res.json())
      .then(data => setNavCategories(data))
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

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/wiki', label: '图鉴' },
    { href: '/wiki/characters/characters', label: '角色图鉴' },
    ...navCategories.map(cat => ({ href: `/wiki/${cat.slug}`, label: cat.name })),
  ]

  return (
    <header className="bg-wiki-darker border-b-2 border-wiki-accent">
      <div className="bg-gradient-to-r from-wiki-darker via-wiki-dark to-wiki-darker py-4 md:py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <div className="text-2xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">
                黑道風雲
              </div>
              <div className="hidden sm:block text-wiki-text-muted text-xs md:text-sm uppercase tracking-widest">
                Wiki 攻略站
              </div>
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              {isAdmin ? (
                <>
                  <span className="hidden md:block text-wiki-accent text-xs uppercase tracking-wider">
                    管理员已登录
                  </span>
                  <button
                    onClick={handleLogout}
                    className="hidden md:block text-wiki-danger text-xs hover:text-wiki-danger/80 uppercase tracking-wider"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <Link
                  href="/admin/login"
                  className="hidden md:block text-wiki-text-muted text-xs hover:text-wiki-accent uppercase tracking-wider"
                >
                  管理后台
                </Link>
              )}
              <form onSubmit={handleSearch} className="relative hidden md:block">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索攻略..."
                  className="bg-wiki-gray border-2 border-wiki-border px-4 py-2 text-wiki-text w-48 lg:w-64 focus:border-wiki-accent focus:outline-none"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-wiki-accent">🔍</button>
              </form>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-wiki-accent text-2xl"
              >
                ☰
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="mt-4 md:hidden space-y-3">
              {isAdmin ? (
                <>
                  <span className="text-wiki-accent text-xs uppercase tracking-wider">
                    管理员已登录
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-wiki-danger text-xs hover:text-wiki-danger/80 uppercase tracking-wider"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <Link
                  href="/admin/login"
                  className="text-wiki-text-muted text-xs hover:text-wiki-accent uppercase tracking-wider"
                >
                  管理后台
                </Link>
              )}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索攻略..."
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-wiki-accent">🔍</button>
              </form>
            </div>
          )}
        </div>
      </div>
      
      <nav className="bg-wiki-gray border-b border-wiki-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 md:px-4 py-2 md:py-3 font-bold uppercase tracking-wider transition-colors whitespace-nowrap text-sm md:text-base ${
                  pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                    ? 'text-wiki-accent border-b-2 border-wiki-accent'
                    : 'text-wiki-text-muted hover:text-wiki-text'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  )
}
