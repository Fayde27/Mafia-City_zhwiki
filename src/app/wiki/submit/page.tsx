'use client'

export const runtime = 'edge'

import { useState } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'

const CATEGORIES = ['新手入門', '角色攻略', '裝備圖鑑', '建築攻略', '陣容搭配', '賽事活動', '其他']

export default function SubmitPage() {
  const [form, setForm] = useState({ title: '', content: '', gameId: '', category: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim() || !form.gameId.trim()) {
      setError('請填寫標題、內容和遊戲ID')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/wiki/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '提交失敗')
      }
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || '提交失敗，請稍後重試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="text-sm text-wiki-text-muted mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">攻略投稿</span>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-wiki-text mb-2">
            <span className="text-wiki-accent mr-2">◆</span>攻略投稿
          </h1>
          <p className="text-wiki-text-muted text-sm mb-8">
            歡迎分享你的遊戲心得！優質投稿將被選中發佈，並為您提供遊戲內獎勵。
          </p>

          {success ? (
            <div className="bg-wiki-card border border-wiki-accent/30 rounded-xl p-10 text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-wiki-accent text-xl font-bold mb-3">提交成功！</h2>
              <p className="text-wiki-text text-sm leading-relaxed mb-6">
                感謝您的積極投稿<br />
                若您的投稿被選中，我們將為您提供遊戲內獎勵！
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setSuccess(false); setForm({ title: '', content: '', gameId: '', category: '' }) }}
                  className="px-5 py-2 bg-wiki-accent text-wiki-dark text-sm font-bold rounded-lg hover:bg-wiki-accent/90 transition-colors"
                >
                  繼續投稿
                </button>
                <Link
                  href="/"
                  className="px-5 py-2 bg-wiki-gray border border-wiki-border text-wiki-text-secondary text-sm rounded-lg hover:text-wiki-accent transition-colors"
                >
                  返回首頁
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-wiki-card border border-wiki-border rounded-xl p-6 space-y-5">
              {/* 標題 */}
              <div>
                <label className="block text-wiki-text text-sm font-bold mb-1.5">
                  投稿標題 <span className="text-wiki-danger">*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="例：新手必看——快速提升戰力攻略"
                  maxLength={100}
                  className="w-full bg-wiki-bg border border-wiki-border rounded-lg px-4 py-2.5 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none"
                />
              </div>

              {/* 分類 */}
              <div>
                <label className="block text-wiki-text text-sm font-bold mb-1.5">
                  攻略分類
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full bg-wiki-bg border border-wiki-border rounded-lg px-4 py-2.5 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none"
                >
                  <option value="">請選擇分類（可選）</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 內容 */}
              <div>
                <label className="block text-wiki-text text-sm font-bold mb-1.5">
                  投稿內容 <span className="text-wiki-danger">*</span>
                </label>
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  placeholder="請詳細描述你的攻略內容..."
                  rows={10}
                  className="w-full bg-wiki-bg border border-wiki-border rounded-lg px-4 py-2.5 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none resize-y"
                />
              </div>

              {/* 遊戲ID */}
              <div>
                <label className="block text-wiki-text text-sm font-bold mb-1.5">
                  遊戲 ID <span className="text-wiki-danger">*</span>
                </label>
                <input
                  name="gameId"
                  value={form.gameId}
                  onChange={handleChange}
                  placeholder="請填寫您的遊戲內 ID"
                  maxLength={50}
                  className="w-full bg-wiki-bg border border-wiki-border rounded-lg px-4 py-2.5 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none"
                />
                <p className="text-wiki-text-muted text-xs mt-1">用於投稿被採用時聯繫您發放獎勵</p>
              </div>

              {error && (
                <p className="text-wiki-danger text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-wiki-accent text-wiki-dark font-bold rounded-lg hover:bg-wiki-accent/90 transition-colors disabled:opacity-50"
              >
                {submitting ? '提交中...' : '提交投稿'}
              </button>
            </form>
          )}
        </div>
      </main>
      <WikiFooter />
    </div>
  )
}
