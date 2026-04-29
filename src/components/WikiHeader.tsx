'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function WikiHeader() {
  const pathname = usePathname()
  
  return (
    <header className="bg-wiki-darker border-b-2 border-wiki-accent">
      {/* 顶部横幅 */}
      <div className="bg-gradient-to-r from-wiki-darker via-wiki-dark to-wiki-darker py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4">
              <div className="text-4xl font-heading font-bold text-wiki-accent heading-hard">
                黑道風雲
              </div>
              <div className="text-wiki-text-muted text-sm uppercase tracking-widest">
                Wiki 攻略站
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索攻略..."
                  className="bg-wiki-gray border-2 border-wiki-border px-4 py-2 text-wiki-text w-64 focus:border-wiki-accent focus:outline-none"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-wiki-accent">
                  🔍
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 导航栏 */}
      <nav className="bg-wiki-gray border-b border-wiki-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            <Link
              href="/"
              className={`px-4 py-3 font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                pathname === '/'
                  ? 'text-wiki-accent border-b-2 border-wiki-accent'
                  : 'text-wiki-text-muted hover:text-wiki-text'
              }`}
            >
              首页
            </Link>
            <Link
              href="/wiki/characters"
              className={`px-4 py-3 font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                pathname?.startsWith('/wiki/characters')
                  ? 'text-wiki-accent border-b-2 border-wiki-accent'
                  : 'text-wiki-text-muted hover:text-wiki-text'
              }`}
            >
              角色图鉴
            </Link>
            <Link
              href="/wiki/weapons"
              className={`px-4 py-3 font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                pathname?.startsWith('/wiki/weapons')
                  ? 'text-wiki-accent border-b-2 border-wiki-accent'
                  : 'text-wiki-text-muted hover:text-wiki-text'
              }`}
            >
              武器装备
            </Link>
            <Link
              href="/wiki/missions"
              className={`px-4 py-3 font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                pathname?.startsWith('/wiki/missions')
                  ? 'text-wiki-accent border-b-2 border-wiki-accent'
                  : 'text-wiki-text-muted hover:text-wiki-text'
              }`}
            >
              任务攻略
            </Link>
            <Link
              href="/wiki/maps"
              className={`px-4 py-3 font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                pathname?.startsWith('/wiki/maps')
                  ? 'text-wiki-accent border-b-2 border-wiki-accent'
                  : 'text-wiki-text-muted hover:text-wiki-text'
              }`}
            >
              地图探索
            </Link>
            <Link
              href="/wiki/guides"
              className={`px-4 py-3 font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                pathname?.startsWith('/wiki/guides')
                  ? 'text-wiki-accent border-b-2 border-wiki-accent'
                  : 'text-wiki-text-muted hover:text-wiki-text'
              }`}
            >
              新手指南
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
