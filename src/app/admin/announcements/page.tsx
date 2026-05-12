'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

export default function AdminAnnouncementsPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    fetchAnnouncements()
  }, [isAdmin, isLoaded, router])

  const fetchAnnouncements = () => {
    fetch('/api/admin/announcements')
      .then(res => res.json())
      .then(data => {
        setAnnouncements(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个公告吗？')) return

    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchAnnouncements()
      } else {
        alert('删除失败')
      }
    } catch (err) {
      alert('网络错误')
    }
  }

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      const res = await fetch(`/api/admin/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...announcement,
          isActive: !announcement.isActive,
        }),
      })
      if (res.ok) {
        fetchAnnouncements()
      }
    } catch (err) {
      alert('操作失败')
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'new': return 'bg-wiki-accent/20 text-wiki-accent'
      case 'update': return 'bg-blue-500/20 text-blue-400'
      case 'important': return 'bg-wiki-danger/20 text-wiki-danger'
      default: return 'bg-wiki-gray text-wiki-text-muted'
    }
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">
              公告管理
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">管理全站公告，新增、编辑或删除公告</p>
          </div>
          <Link href="/admin/announcements/new" className="btn-hard text-wiki-text text-sm">
            + 新增公告
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-wiki-text-muted">暂无公告</div>
        ) : (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-wiki-border">
                  <th className="px-6 py-3 text-left text-xs font-bold text-wiki-text-muted uppercase tracking-wider">类型</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-wiki-text-muted uppercase tracking-wider">标题</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-wiki-text-muted uppercase tracking-wider">内容</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-wiki-text-muted uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-wiki-text-muted uppercase tracking-wider">排序</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-wiki-text-muted uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wiki-border">
                {announcements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-wiki-gray/50">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold ${getTypeColor(announcement.type)}`}>
                        {getTypeLabel(announcement.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-wiki-text font-bold">{announcement.title}</td>
                    <td className="px-6 py-4 text-wiki-text-muted text-sm max-w-xs truncate">{announcement.content}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(announcement)}
                        className={`px-2 py-1 text-xs font-bold ${
                          announcement.isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-wiki-danger/20 text-wiki-danger'
                        }`}
                      >
                        {announcement.isActive ? '已启用' : '已禁用'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-wiki-text-muted">{announcement.sortOrder}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/admin/announcements/edit/${announcement.id}`}
                          className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-sm font-bold hover:bg-wiki-danger/30"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <WikiFooter />
    </div>
  )
}