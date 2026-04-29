'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  slug: string
  isPublished: boolean
  category: {
    name: string
  }
  views: number
  createdAt: string
}

export default function AdminDashboardPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'articles' | 'categories'>('articles')

  useEffect(() => {
    fetch('/api/admin/articles?limit=20')
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles)
        setLoading(false)
      })
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return

    try {
      await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
      setArticles(articles.filter(a => a.id !== id))
    } catch (err) {
      alert('删除失败')
    }
  }

  return (
    <div className="min-h-screen bg-wiki-dark">
      {/* 管理端头部 */}
      <header className="bg-wiki-darker border-b-2 border-wiki-accent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-wiki-text-muted hover:text-wiki-accent">
                返回玩家端
              </Link>
              <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">
                管理后台
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/articles/new" className="btn-hard text-white text-sm">
                + 新增文章
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 标签页 */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-6 py-3 font-bold uppercase tracking-wider ${
              activeTab === 'articles'
                ? 'bg-wiki-accent text-white'
                : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
            }`}
          >
            文章管理
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 font-bold uppercase tracking-wider ${
              activeTab === 'categories'
                ? 'bg-wiki-accent text-white'
                : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
            }`}
          >
            分类管理
          </button>
        </div>

        {/* 文章列表 */}
        {activeTab === 'articles' && (
          <div className="card-hard rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-wiki-gray">
                <tr>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">
                    标题
                  </th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">
                    分类
                  </th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">
                    状态
                  </th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">
                    浏览量
                  </th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">
                    创建时间
                  </th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-wiki-text-muted">
                      加载中...
                    </td>
                  </tr>
                ) : articles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-wiki-text-muted">
                      暂无文章
                    </td>
                  </tr>
                ) : (
                  articles.map((article) => (
                    <tr key={article.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                      <td className="px-6 py-4">
                        <div className="text-wiki-text font-bold">{article.title}</div>
                        <div className="text-wiki-text-muted text-xs">{article.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-wiki-text-muted">
                        {article.category.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-bold uppercase ${
                          article.isPublished
                            ? 'bg-wiki-success/20 text-wiki-success'
                            : 'bg-wiki-danger/20 text-wiki-danger'
                        }`}>
                          {article.isPublished ? '已发布' : '草稿'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-wiki-text-muted">
                        {article.views}
                      </td>
                      <td className="px-6 py-4 text-wiki-text-muted text-sm">
                        {new Date(article.createdAt).toLocaleDateString('zh-TW')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/articles/edit/${article.id}`}
                            className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30"
                          >
                            编辑
                          </Link>
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-sm font-bold hover:bg-wiki-danger/30"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 分类管理 */}
        {activeTab === 'categories' && (
          <div className="card-hard rounded-lg p-8 text-center text-wiki-text-muted">
            分类管理功能开发中...
          </div>
        )}
      </div>
    </div>
  )
}
