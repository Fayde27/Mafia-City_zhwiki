'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/admin/dashboard')
      } else {
        setError(data.error || '登录失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-wiki-dark flex items-center justify-center px-4">
      <div className="card-hard rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold text-wiki-accent heading-hard mb-2">
            黑道風雲
          </h1>
          <p className="text-wiki-text-muted uppercase tracking-widest">
            管理后台登录
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-wiki-danger/20 border-2 border-wiki-danger text-wiki-danger px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">
              账号
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              placeholder="请输入管理员账号"
              required
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-hard text-white disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <div className="text-center text-wiki-text-muted text-sm">
            <a href="/" className="hover:text-wiki-accent">
              返回玩家端
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
