'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  _count: { articles: number }
}

interface Article {
  id: string
  title: string
  slug: string
  summary: string
  coverImage: string
  categoryId: string
  category: { name: string; slug: string }
  isPublished: boolean
  isPinned: boolean
  badges: string
  views: number
  createdAt: string
}

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

interface SidebarNavItem {
  id: string
  section: string
  label: string
  icon: string | null
  href: string
  parentId: string | null
  sortOrder: number
  isActive: boolean
  children?: SidebarNavItem[]
}

interface SidebarSection {
  id: string
  name: string
  slug: string
  sortOrder: number
  isActive: boolean
}

const adminLinks = [
  { href: '/admin/dashboard', icon: '🖥️', label: '管理后台' },
  { href: '/admin/site-config', icon: '⚙️', label: '站点配置' },
  { href: '/admin/categories', icon: '📁', label: '攻略分类管理' },
  { href: '/admin/wiki-categories', icon: '📚', label: '图鉴分类管理' },
  { href: '/admin/announcements', icon: '📢', label: '公告管理' },
  { href: '/admin/sidebar-sections', icon: '📂', label: '侧边栏分类' },
  { href: '/admin/sidebar-nav', icon: '🧭', label: '侧边栏导航' },
]

export default function HomePage() {
  const { isAdmin } = useAdminAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [sidebarNavItems, setSidebarNavItems] = useState<SidebarNavItem[]>([])
  const [sidebarSections, setSidebarSections] = useState<SidebarSection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [adminExpanded, setAdminExpanded] = useState(false)

  // SiteConfig
  const [bannerImage, setBannerImage] = useState('')
  const [bannerPosition, setBannerPosition] = useState('50% 50%')
  const [hotTags, setHotTags] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/wiki/categories').then(r => r.json()),
      fetch('/api/wiki/articles?featured=true&limit=12').then(r => r.json()),
      fetch('/api/wiki/announcements').then(r => r.json()),
      fetch('/api/wiki/sidebar-nav').then(r => r.json()),
      fetch('/api/wiki/sidebar-sections').then(r => r.json()),
      fetch('/api/wiki/site-config').then(r => r.json()),
    ]).then(([cats, arts, anns, navItems, sections, config]) => {
      setCategories(cats || [])
      setArticles(arts?.articles || [])
      setAnnouncements(anns || [])
      const items: SidebarNavItem[] = Array.isArray(navItems) ? navItems : []
      setSidebarNavItems(items)
      setSidebarSections(Array.isArray(sections) ? sections : [])
      // 默认展开所有有子项的导航
      setExpandedItems(items.filter(i => i.children && i.children.length > 0).map(i => i.id))
      // 站点配置
      setBannerImage(config.searchBannerImage || '')
      setBannerPosition(config.searchBannerPosition || '50% 50%')
      setHotTags(
        (config.hotSearchTags || '新手入门,角色攻略,装备图鉴,建筑攻略,阵容搭配,赛事活动')
          .split(',').map((t: string) => t.trim()).filter(Boolean)
      )
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/wiki/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return
    try {
      await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
      setArticles(articles.filter(a => a.id !== id))
    } catch {
      alert('删除失败')
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'new': return 'NEW'
      case 'update': return 'UPDATE'
      case 'important': return '重要'
      default: return '公告'
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const renderNavItem = (item: SidebarNavItem) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleExpand(item.id)}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-wiki-gray transition-colors group text-left"
          >
            {item.icon && <span className="text-lg flex-shrink-0">{item.icon}</span>}
            <span className="text-wiki-text-secondary text-sm group-hover:text-wiki-accent transition-colors flex-1">
              {item.label}
            </span>
            <svg
              className={`w-4 h-4 text-wiki-text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-wiki-border pl-3">
              {item.children!.map(child => (
                <Link
                  key={child.id}
                  href={child.href}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-wiki-gray transition-colors group"
                >
                  {child.icon && <span className="text-base">{child.icon}</span>}
                  <span className="text-wiki-text-secondary text-sm group-hover:text-wiki-accent transition-colors">
                    {child.label}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-wiki-gray transition-colors group"
      >
        {item.icon && <span className="text-lg">{item.icon}</span>}
        <span className="text-wiki-text-secondary text-sm group-hover:text-wiki-accent transition-colors flex-1">
          {item.label}
        </span>
        <svg className="w-4 h-4 text-wiki-text-secondary ml-auto group-hover:text-wiki-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 侧边栏 */}
          <div className="lg:w-72 flex-shrink-0 order-2 lg:order-1">
            <div className="sticky top-20 space-y-6">
              {/* 动态 SidebarSection */}
              {sidebarSections.length > 0 ? sidebarSections.map(section => {
                const sectionItems = sidebarNavItems.filter(item => item.section === section.slug)
                return (
                  <div key={section.id} className="bg-wiki-card border border-wiki-border rounded-xl p-5">
                    <h3 className="text-wiki-text font-bold text-sm mb-4 flex items-center gap-2">
                      <span className="text-wiki-accent">◆</span>
                      {section.name}
                    </h3>
                    <div className="space-y-1">
                      {sectionItems.length > 0
                        ? sectionItems.map(renderNavItem)
                        : <div className="text-wiki-text-muted text-sm text-center py-4">暂无内容，请在管理后台添加</div>
                      }
                    </div>
                  </div>
                )
              }) : (
                <div className="bg-wiki-card border border-wiki-border rounded-xl p-5">
                  <h3 className="text-wiki-text font-bold text-sm mb-4 flex items-center gap-2">
                    <span className="text-wiki-accent">◆</span>快速入口
                  </h3>
                  <div className="space-y-1">
                    {[
                      { label: '游戏图鉴', href: '/wiki', icon: '📚' },
                      { label: '玩法攻略', href: '/wiki/guides', icon: '📖' },
                    ].map(link => (
                      <Link key={link.href} href={link.href} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-wiki-gray transition-colors group">
                        <span className="text-lg">{link.icon}</span>
                        <span className="text-wiki-text-secondary text-sm group-hover:text-wiki-accent transition-colors flex-1">{link.label}</span>
                        <svg className="w-4 h-4 text-wiki-text-secondary group-hover:text-wiki-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 管理入口（仅管理员可见，默认折叠） */}
              {isAdmin && (
                <div className="bg-wiki-card border border-wiki-border rounded-xl p-5">
                  <button
                    onClick={() => setAdminExpanded(v => !v)}
                    className="w-full flex items-center gap-2 text-left"
                  >
                    <span className="text-wiki-accent text-sm">◆</span>
                    <span className="text-wiki-text font-bold text-sm flex-1">管理入口</span>
                    <svg
                      className={`w-4 h-4 text-wiki-text-secondary transition-transform duration-200 ${adminExpanded ? 'rotate-90' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {adminExpanded && (
                    <div className="mt-3 space-y-1">
                      {adminLinks.map(link => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-wiki-gray transition-colors group"
                        >
                          <span className="text-lg">{link.icon}</span>
                          <span className="text-wiki-text-secondary text-sm group-hover:text-wiki-accent transition-colors">
                            {link.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 主内容区 */}
          <div className="flex-1 order-1 lg:order-2">
            {/* 搜索 Banner */}
            <section className="mb-8">
              <div
                className="relative rounded-xl overflow-hidden border border-wiki-border p-8"
                style={bannerImage
                  ? {
                      backgroundImage: `url(${bannerImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: bannerPosition,
                    }
                  : { background: 'var(--wiki-gray-light, #1a1a2e)' }
                }
              >
                {/* 遮罩：有 banner 时加深色蒙层，无 banner 时显示纹理 */}
                {bannerImage ? (
                  <div className="absolute inset-0 bg-black/50" />
                ) : (
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlOGM1NDciIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHY2aDR2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat" />
                  </div>
                )}
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-wiki-accent text-sm font-bold uppercase tracking-wider">玩法攻略</span>
                    <span className="text-wiki-text-muted text-xs">从入门到精通，带你征战天下</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-wiki-text mb-6">
                    黑道風雲 <span className="text-wiki-accent">Wiki</span>
                  </h1>
                  <form onSubmit={handleSearch} className="max-w-xl mb-6">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="搜索攻略、角色、装备..."
                        className="w-full bg-wiki-card border border-wiki-border px-5 py-3 text-wiki-text placeholder-wiki-text-muted focus:border-wiki-accent focus:outline-none rounded-lg"
                      />
                      <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-wiki-text-muted hover:text-wiki-accent">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {hotTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSearchQuery(tag)}
                        className="px-3 py-1.5 bg-wiki-gray text-wiki-text-secondary text-xs rounded-full border border-wiki-border hover:border-wiki-accent hover:text-wiki-accent cursor-pointer transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 热门攻略 */}
            <section className="mb-8 bg-wiki-gray-light border border-wiki-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-wiki-text">
                  <span className="text-wiki-accent mr-2">◆</span>热门攻略
                </h2>
                {isAdmin && (
                  <Link href="/admin/articles/new" className="text-wiki-accent text-xs hover:underline">
                    + 新增文章
                  </Link>
                )}
              </div>
              <div className="space-y-3">
                {articles.map(article => (
                  <Link key={article.id} href={`/wiki/article/${article.slug}`} className="block group">
                    <div className="flex gap-4 bg-wiki-card border border-wiki-border rounded-xl p-4 hover:border-wiki-accent/30 transition-all duration-300 relative">
                      {article.coverImage ? (
                        <div className="w-24 h-24 md:w-32 md:h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 md:w-32 md:h-24 flex-shrink-0 rounded-lg bg-wiki-gray flex items-center justify-center">
                          <span className="text-2xl">{article.category.name?.charAt(0) || '📄'}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-wiki-accent text-xs font-bold">{article.category.name}</span>
                          {article.isPinned && (
                            <span className="px-2 py-0.5 bg-wiki-danger/10 text-wiki-danger text-xs rounded">置顶</span>
                          )}
                          {article.badges && article.badges.split(',').filter(Boolean).map(badge => {
                            const badgeStyle = badge === 'HOT' ? 'bg-wiki-danger/10 text-wiki-danger'
                              : badge === 'NEW' ? 'bg-wiki-accent/10 text-wiki-accent'
                              : 'bg-blue-500/10 text-blue-500'
                            return (
                              <span key={badge} className={`px-2 py-0.5 text-xs rounded ${badgeStyle}`}>
                                {badge}
                              </span>
                            )
                          })}
                        </div>
                        <h3 className="text-wiki-text font-bold text-sm md:text-base mb-1 line-clamp-1 group-hover:text-wiki-accent transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-wiki-text-muted text-xs md:text-sm line-clamp-2 mb-2">
                          {article.summary}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-wiki-text-secondary">
                          <span>{new Date(article.createdAt).toLocaleDateString('zh-TW')}</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {article.views}
                          </span>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/articles/edit/${article.id}`} className="px-2 py-1 bg-wiki-accent/10 text-wiki-accent text-xs rounded hover:bg-wiki-accent/30">
                            编辑
                          </Link>
                          <button
                            onClick={e => { e.preventDefault(); handleDeleteArticle(article.id) }}
                            className="px-2 py-1 bg-wiki-danger/10 text-wiki-danger text-xs rounded hover:bg-wiki-danger/30"
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* 全站公告 */}
            <section className="mb-8 bg-wiki-gray-light border border-wiki-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-wiki-text">
                  <span className="text-wiki-danger mr-2">◆</span>全站公告
                </h2>
                {isAdmin && (
                  <a href="/admin/announcements" className="text-sm text-wiki-accent hover:underline">
                    管理公告 →
                  </a>
                )}
              </div>
              <div className="bg-wiki-card border border-wiki-border rounded-xl p-5">
                {announcements.length === 0 ? (
                  <p className="text-wiki-text-muted text-sm">暂无公告</p>
                ) : (
                  <div className="space-y-3">
                    {announcements.map(ann => (
                      <Link key={ann.id} href={`/wiki/announcements/${ann.id}`} className="block group">
                        <div className="flex items-start gap-3 pb-3 border-b border-wiki-border last:border-0 last:pb-0 hover:bg-wiki-gray/50 -mx-2 px-2 py-1 rounded-lg transition-colors">
                          <span className="text-wiki-accent text-xs font-bold flex-shrink-0 mt-0.5">[{getTypeLabel(ann.type)}]</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-wiki-text text-sm font-bold group-hover:text-wiki-accent transition-colors">{ann.title}</p>
                            <p className="text-wiki-text-muted text-xs mt-1">{ann.content?.replace(/<[^>]*>/g, '').slice(0, 80)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <WikiFooter />
    </div>
  )
}
