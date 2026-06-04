'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

interface Submission {
  id: string
  title: string
  content: string
  gameId: string
  category: string
  status: 'pending' | 'reviewed' | 'approved' | 'rejected'
  adminNote: string
  createdAt: string
  updatedAt: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: '待審核', color: 'text-wiki-accent bg-wiki-accent/10' },
  reviewed: { label: '已查看', color: 'text-blue-400 bg-blue-400/10' },
  approved: { label: '已採用', color: 'text-green-400 bg-green-400/10' },
  rejected: { label: '已拒絕', color: 'text-wiki-danger bg-wiki-danger/10' },
}

export default function SubmissionsAdminPage() {
  const { isAdmin, isLoaded } = useAdminAuth()
  const router = useRouter()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [selected, setSelected] = useState<Submission | null>(null)
  const [editNote, setEditNote] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isLoaded && !isAdmin) router.push('/admin/login')
  }, [isAdmin, isLoaded, router])

  const fetchSubmissions = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterCategory) params.set('category', filterCategory)
    const q = params.toString() ? `?${params.toString()}` : ''
    fetch(`/api/admin/submissions${q}`)
      .then(r => r.json())
      .then(data => { setSubmissions(data.submissions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { if (isAdmin) fetchSubmissions() }, [isAdmin, filterStatus, filterCategory])

  const openDetail = (s: Submission) => {
    setSelected(s)
    setEditNote(s.adminNote || '')
    setEditStatus(s.status)
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await fetch(`/api/admin/submissions/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus, adminNote: editNote }),
      })
      setSelected(null)
      fetchSubmissions()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除這條投稿？')) return
    await fetch(`/api/admin/submissions/${id}`, { method: 'DELETE' })
    setSelected(null)
    fetchSubmissions()
  }

  if (!isLoaded || loading) {
    return <div className="min-h-screen bg-wiki-bg flex items-center justify-center text-wiki-text-muted">載入中...</div>
  }

  return (
    <div className="min-h-screen bg-wiki-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-wiki-text">
            <span className="text-wiki-accent mr-2">◆</span>投稿管理
          </h1>
          <button onClick={() => router.push('/admin/dashboard')} className="text-wiki-text-muted text-sm hover:text-wiki-accent">
            ← 返回後台
          </button>
        </div>

        {/* 狀態篩選 */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {[['', '全部'], ['pending', '待審核'], ['reviewed', '已查看'], ['approved', '已採用'], ['rejected', '已拒絕']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filterStatus === val
                  ? 'bg-wiki-accent text-wiki-dark border-wiki-accent font-bold'
                  : 'border-wiki-border text-wiki-text-muted hover:border-wiki-accent hover:text-wiki-accent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 類型篩選 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[['', '所有類型'], ['糾錯', '⚠️ 糾錯'], ['疑問', '💬 疑問']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterCategory(val)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filterCategory === val
                  ? 'bg-wiki-accent text-wiki-dark border-wiki-accent font-bold'
                  : 'border-wiki-border text-wiki-text-muted hover:border-wiki-accent hover:text-wiki-accent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 列表 */}
        {submissions.length === 0 ? (
          <div className="text-center py-16 text-wiki-text-muted">暫無投稿</div>
        ) : (
          <div className="space-y-3">
            {submissions.map(s => {
              const st = STATUS_LABELS[s.status] || STATUS_LABELS.pending
              return (
                <div
                  key={s.id}
                  className="bg-wiki-card border border-wiki-border rounded-xl p-4 flex items-start gap-4 hover:border-wiki-accent/30 transition-colors cursor-pointer"
                  onClick={() => openDetail(s)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded font-bold ${st.color}`}>{st.label}</span>
                      {s.category && <span className="text-wiki-text-muted text-xs">{s.category}</span>}
                    </div>
                    <h3 className="text-wiki-text font-bold text-sm mb-1 line-clamp-1">{s.title}</h3>
                    <p className="text-wiki-text-muted text-xs line-clamp-1">{s.content}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {s.gameId && (
                      <a
                        href={`/wiki/article/${s.gameId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-wiki-accent text-xs font-bold hover:underline block"
                      >
                        查看文章 ↗
                      </a>
                    )}
                    <p className="text-wiki-text-muted text-xs mt-1">{new Date(s.createdAt).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 詳情彈窗 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div
            className="bg-wiki-card border border-wiki-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-wiki-text font-bold text-lg pr-4">{selected.title}</h2>
                <button onClick={() => setSelected(null)} className="text-wiki-text-muted hover:text-wiki-accent flex-shrink-0">✕</button>
              </div>

              <div className="flex gap-3 mb-4 text-xs">
                <span className="text-wiki-text-muted">遊戲ID：<span className="text-wiki-accent font-bold">{selected.gameId}</span></span>
                {selected.category && <span className="text-wiki-text-muted">分類：{selected.category}</span>}
                <span className="text-wiki-text-muted">{new Date(selected.createdAt).toLocaleString('zh-CN')}</span>
              </div>

              <div className="bg-wiki-bg rounded-lg p-4 mb-5 text-wiki-text text-sm whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border border-wiki-border">
                {selected.content}
              </div>

              {/* 編輯狀態 */}
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-wiki-text text-sm font-bold mb-1.5 block">處理狀態</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_LABELS).map(([val, { label, color }]) => (
                      <button
                        key={val}
                        onClick={() => setEditStatus(val)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors font-bold ${
                          editStatus === val ? color + ' border-current' : 'border-wiki-border text-wiki-text-muted hover:border-wiki-accent'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-wiki-text text-sm font-bold mb-1.5 block">內部備註</label>
                  <textarea
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    rows={3}
                    placeholder="記錄處理情況（僅管理員可見）"
                    className="w-full bg-wiki-bg border border-wiki-border rounded-lg px-3 py-2 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-wiki-accent text-wiki-dark text-sm font-bold rounded-lg hover:bg-wiki-accent/90 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="px-5 py-2.5 bg-wiki-danger/10 text-wiki-danger text-sm font-bold rounded-lg hover:bg-wiki-danger/20"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
