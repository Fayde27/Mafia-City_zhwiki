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
    <header className="sticky top-0 z-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="text-xl font-bold text-[#e8c547]">
                黑道風雲
              </div>
              <div className="hidden sm:block text-gray-500 text-xs">
                Wiki 攻略站
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.slice(0, 6).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-sm transition-colors rounded ${
                    pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                      ? 'text-[#e8c547] bg-[#e8c547]/10'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索攻略..."
                  className="bg-gray-100 border border-gray-200 px-3 py-1.5 text-sm text-gray-900 w-48 focus:border-[#e8c547] focus:outline-none rounded"
                />
                <button type="submit" className="absolute right-2 text-gray-500 hover:text-[#e8c547]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

              {isAdmin ? (
                <button
                  onClick={handleLogout}
                  className="text-red-500 text-xs hover:text-red-600"
                >
                  退出
                </button>
              ) : (
                <Link
                  href="/admin/login"
                  className="text-gray-500 text-xs hover:text-[#e8c547]"
                >
                  管理
                </Link>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-[#e8c547] text-xl"
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm rounded ${
                  pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                    ? 'text-[#e8c547] bg-[#e8c547]/10'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <form onSubmit={handleSearch} className="relative pt-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索攻略..."
                className="w-full bg-gray-100 border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#e8c547] focus:outline-none rounded"
              />
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
