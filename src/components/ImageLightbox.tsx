'use client'

import { useEffect } from 'react'

interface ImageLightboxProps {
  images: string[]
  currentIndex: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function ImageLightbox({ images, currentIndex, onClose, onPrev, onNext }: ImageLightboxProps) {
  const total = images.length
  const src = images[currentIndex]

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && total > 1) onPrev()
      if (e.key === 'ArrowRight' && total > 1) onNext()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext, total])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      {/* 關閉按鈕 */}
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none z-10 transition-colors"
        onClick={onClose}
        aria-label="關閉"
      >
        ✕
      </button>

      {/* 圖片計數 */}
      {total > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm z-10">
          {currentIndex + 1} / {total}
        </div>
      )}

      {/* 左箭頭 */}
      {total > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl z-10 transition-colors select-none px-2"
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          aria-label="上一張"
        >
          ‹
        </button>
      )}

      {/* 右箭頭 */}
      {total > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl z-10 transition-colors select-none px-2"
          onClick={(e) => { e.stopPropagation(); onNext() }}
          aria-label="下一張"
        >
          ›
        </button>
      )}

      {/* 圖片 */}
      <img
        src={src}
        alt=""
        className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
