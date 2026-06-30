'use client'

import { useState, useEffect } from 'react'

interface LikeButtonProps {
  entityType: 'article' | 'character' | 'building' | 'equipment' | 'item' | 'troop' | 'announcement' | 'event'
  entityId: string
  initialLikes?: number
}

export default function LikeButton({ entityType, entityId, initialLikes = 0 }: LikeButtonProps) {
  const storageKey = `liked_${entityType}_${entityId}`
  const [likes, setLikes] = useState(initialLikes)
  const [liked, setLiked] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    setLiked(localStorage.getItem(storageKey) === '1')
  }, [storageKey])

  const handleLike = async () => {
    if (liked || animating) return
    setAnimating(true)
    try {
      const res = await fetch('/api/wiki/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId }),
      })
      if (res.ok) {
        const data = await res.json()
        setLikes(data.likes)
        setLiked(true)
        localStorage.setItem(storageKey, '1')
      }
    } finally {
      setTimeout(() => setAnimating(false), 600)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleLike}
        disabled={liked}
        className={`group flex items-center gap-2 px-6 py-3 rounded-full border-2 transition-all duration-300 ${
          liked
            ? 'border-wiki-accent bg-wiki-accent/10 text-wiki-accent cursor-default'
            : 'border-wiki-border text-wiki-text-muted hover:border-wiki-accent hover:text-wiki-accent hover:bg-wiki-accent/5 cursor-pointer'
        } ${animating ? 'scale-110' : 'scale-100'}`}
      >
        <span className={`text-xl transition-transform duration-300 ${animating ? 'scale-125' : ''}`}>
          {liked ? '👍' : '👍'}
        </span>
        <span className="font-bold text-sm">
          {liked ? '已點讚' : '覺得有用'}
        </span>
        <span className={`text-sm font-bold ${liked ? 'text-wiki-accent' : ''}`}>
          {likes}
        </span>
      </button>
      {liked && (
        <p className="text-wiki-text-muted text-xs">感謝您的支持！</p>
      )}
    </div>
  )
}
