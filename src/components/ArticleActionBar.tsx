'use client'

import { useState, useEffect } from 'react'

interface ArticleActionBarProps {
  articleId: string
  articleTitle: string
  articleSlug: string
  initialLikes: number
}

export default function ArticleActionBar({
  articleId,
  articleTitle,
  articleSlug,
  initialLikes,
}: ArticleActionBarProps) {
  const storageKey = `liked_article_${articleId}`

  const [likes, setLikes] = useState(initialLikes)
  const [liked, setLiked] = useState(false)
  const [likeAnimating, setLikeAnimating] = useState(false)

  const [copied, setCopied] = useState(false)

  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'糾錯' | '疑問'>('糾錯')
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackDone, setFeedbackDone] = useState(false)

  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    setLiked(localStorage.getItem(storageKey) === '1')
  }, [storageKey])

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLike = async () => {
    if (liked || likeAnimating) return
    setLikeAnimating(true)
    try {
      const res = await fetch('/api/wiki/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'article', entityId: articleId }),
      })
      if (res.ok) {
        const data = await res.json()
        setLikes(data.likes)
        setLiked(true)
        localStorage.setItem(storageKey, '1')
      }
    } finally {
      setTimeout(() => setLikeAnimating(false), 600)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // fallback for non-secure contexts
      const el = document.createElement('textarea')
      el.value = window.location.href
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedbackSubmit = async () => {
    if (!feedbackContent.trim()) return
    setFeedbackSubmitting(true)
    try {
      await fetch('/api/wiki/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${feedbackType} - ${articleTitle}`,
          content: feedbackContent.trim(),
          gameId: articleSlug,
          category: feedbackType,
        }),
      })
      setFeedbackDone(true)
      setFeedbackContent('')
      setTimeout(() => {
        setFeedbackDone(false)
        setShowFeedback(false)
      }, 2000)
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  // 共用按鈕樣式
  const btnBase = 'flex flex-col items-center gap-1 transition-all duration-200'
  const iconBase = 'w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-200'

  return (
    <>
      {/* ── 桌面：左側懸浮欄 ── */}
      <div className="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 flex-col items-center gap-3 z-40">
        {/* 點讚 */}
        <button onClick={handleLike} disabled={liked} className={btnBase} title={liked ? '已點讚' : '覺得有用'}>
          <div className={`${iconBase} ${liked ? 'border-wiki-accent bg-wiki-accent/15 text-wiki-accent' : 'border-wiki-border text-wiki-text-muted hover:border-wiki-accent hover:text-wiki-accent hover:bg-wiki-accent/5'} ${likeAnimating ? 'scale-125' : ''}`}>
            <span className="text-lg">👍</span>
          </div>
          <span className={`text-xs font-bold ${liked ? 'text-wiki-accent' : 'text-wiki-text-muted'}`}>{likes}</span>
        </button>

        <div className="w-6 border-t border-wiki-border/50" />

        {/* 分享 */}
        <button onClick={handleShare} className={btnBase} title="複製文章鏈接">
          <div className={`${iconBase} ${copied ? 'border-green-500 bg-green-500/15 text-green-400' : 'border-wiki-border text-wiki-text-muted hover:border-wiki-accent hover:text-wiki-accent hover:bg-wiki-accent/5'}`}>
            <span className="text-lg">{copied ? '✓' : '🔗'}</span>
          </div>
          <span className={`text-xs font-bold ${copied ? 'text-green-400' : 'text-wiki-text-muted'}`}>{copied ? '已複製' : '分享'}</span>
        </button>

        <div className="w-6 border-t border-wiki-border/50" />

        {/* 糾錯/疑問 */}
        <button onClick={() => setShowFeedback(true)} className={btnBase} title="糾錯 / 我有疑問">
          <div className={`${iconBase} border-wiki-border text-wiki-text-muted hover:border-wiki-accent hover:text-wiki-accent hover:bg-wiki-accent/5`}>
            <span className="text-lg">❓</span>
          </div>
          <span className="text-xs font-bold text-wiki-text-muted">回饋</span>
        </button>

        {/* 返回頂部 */}
        {showScrollTop && (
          <>
            <div className="w-6 border-t border-wiki-border/50" />
            <button onClick={scrollToTop} className={btnBase} title="返回頂部">
              <div className={`${iconBase} border-wiki-border text-wiki-text-muted hover:border-wiki-accent hover:text-wiki-accent hover:bg-wiki-accent/5`}>
                <span className="text-lg">⬆</span>
              </div>
              <span className="text-xs font-bold text-wiki-text-muted">頂部</span>
            </button>
          </>
        )}
      </div>

      {/* ── 手機：底部固定欄 ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-wiki-gray border-t border-wiki-border flex items-center justify-around px-4 py-2">
        {/* 點讚 */}
        <button onClick={handleLike} disabled={liked} className="flex flex-col items-center gap-0.5">
          <span className={`text-xl transition-transform ${likeAnimating ? 'scale-125' : ''}`}>👍</span>
          <span className={`text-xs font-bold ${liked ? 'text-wiki-accent' : 'text-wiki-text-muted'}`}>{likes}</span>
        </button>

        {/* 分享 */}
        <button onClick={handleShare} className="flex flex-col items-center gap-0.5">
          <span className="text-xl">{copied ? '✓' : '🔗'}</span>
          <span className={`text-xs font-bold ${copied ? 'text-green-400' : 'text-wiki-text-muted'}`}>{copied ? '已複製' : '分享'}</span>
        </button>

        {/* 糾錯/疑問 */}
        <button onClick={() => setShowFeedback(true)} className="flex flex-col items-center gap-0.5">
          <span className="text-xl">❓</span>
          <span className="text-xs font-bold text-wiki-text-muted">回饋</span>
        </button>

        {/* 返回頂部 */}
        <button onClick={scrollToTop} className={`flex flex-col items-center gap-0.5 transition-opacity ${showScrollTop ? 'opacity-100' : 'opacity-30'}`}>
          <span className="text-xl">⬆</span>
          <span className="text-xs font-bold text-wiki-text-muted">頂部</span>
        </button>
      </div>

      {/* 分享提示 Toast（桌面） */}
      {copied && (
        <div className="hidden lg:block fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-wiki-gray border border-wiki-border px-5 py-2.5 text-wiki-text text-sm font-bold shadow-lg animate-fade-in">
          已複製文章鏈接！
        </div>
      )}

      {/* ── 糾錯/疑問 彈窗 ── */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowFeedback(false)}>
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-bold text-wiki-accent heading-hard">文章回饋</h3>
              <button onClick={() => setShowFeedback(false)} className="text-wiki-text-muted hover:text-wiki-text text-xl leading-none">✕</button>
            </div>

            {feedbackDone ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-wiki-text font-bold">感謝您的回饋！</p>
                <p className="text-wiki-text-muted text-sm mt-1">我們會盡快處理</p>
              </div>
            ) : (
              <>
                {/* 類型選擇 */}
                <div className="flex gap-3 mb-4">
                  {(['糾錯', '疑問'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setFeedbackType(type)}
                      className={`flex-1 py-2 text-sm font-bold border-2 transition-colors ${
                        feedbackType === type
                          ? 'border-wiki-accent bg-wiki-accent/10 text-wiki-accent'
                          : 'border-wiki-border text-wiki-text-muted hover:border-wiki-accent/50'
                      }`}
                    >
                      {type === '糾錯' ? '⚠️ 內容糾錯' : '💬 我有疑問'}
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <label className="block text-wiki-text text-sm font-bold mb-2">
                    {feedbackType === '糾錯' ? '請描述哪裡有錯誤' : '請描述您的疑問'}
                  </label>
                  <textarea
                    value={feedbackContent}
                    onChange={e => setFeedbackContent(e.target.value)}
                    rows={4}
                    placeholder={feedbackType === '糾錯' ? '例如：第二段的數據有誤，正確應該是...' : '例如：文中提到的XX技能在哪裡解鎖？'}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none resize-none"
                  />
                </div>

                <p className="text-wiki-text-muted text-xs mb-4">文章：{articleTitle}</p>

                <div className="flex gap-3">
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={feedbackSubmitting || !feedbackContent.trim()}
                    className="flex-1 py-2.5 bg-wiki-accent text-wiki-darker text-sm font-bold hover:bg-wiki-accent/90 disabled:opacity-50 transition-opacity"
                  >
                    {feedbackSubmitting ? '提交中...' : '提交'}
                  </button>
                  <button
                    onClick={() => setShowFeedback(false)}
                    className="px-5 py-2.5 bg-wiki-gray text-wiki-text text-sm font-bold hover:bg-wiki-gray/70"
                  >
                    取消
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
