'use client'

import { useEffect, useRef, useState } from 'react'

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

  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // 拖動狀態
  const isDragging = useRef(false)
  const hasDragged = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  // 捏合縮放狀態
  const lastPinchDist = useRef<number | null>(null)
  const pinchStartScale = useRef(1)

  // 滑動切換（scale=1 時）
  const swipeStartX = useRef<number | null>(null)

  const reset = () => { setScale(1); setOffset({ x: 0, y: 0 }) }

  // 切換圖片時重置
  useEffect(() => { reset() }, [currentIndex])

  // 鍵盤
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && total > 1) { reset(); onPrev() }
      if (e.key === 'ArrowRight' && total > 1) { reset(); onNext() }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext, total])

  // ── 滾輪縮放 ──────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.2 : 0.2
    setScale(s => {
      const next = Math.min(5, Math.max(1, s + delta))
      if (next === 1) setOffset({ x: 0, y: 0 })
      return next
    })
  }

  // ── 滑鼠拖動 ──────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    isDragging.current = true
    hasDragged.current = false
    lastPos.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    setOffset(o => ({ x: o.x + dx, y: o.y + dy }))
  }

  const handleMouseUp = () => { isDragging.current = false }

  // ── 觸控（捏合縮放 + 單指拖動/滑動） ──────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastPinchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      pinchStartScale.current = scale
    } else if (e.touches.length === 1) {
      const x = e.touches[0].clientX
      swipeStartX.current = x
      if (scale > 1) {
        isDragging.current = true
        hasDragged.current = false
        lastPos.current = { x, y: e.touches[0].clientY }
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const next = Math.min(5, Math.max(1, pinchStartScale.current * (dist / lastPinchDist.current)))
      setScale(next)
      if (next === 1) setOffset({ x: 0, y: 0 })
    } else if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastPos.current.x
      const dy = e.touches[0].clientY - lastPos.current.y
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged.current = true
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      setOffset(o => ({ x: o.x + dx, y: o.y + dy }))
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    lastPinchDist.current = null
    isDragging.current = false
    // scale=1 時，單指左右滑動切換圖片
    if (scale === 1 && total > 1 && swipeStartX.current !== null && e.changedTouches.length > 0) {
      const dx = e.changedTouches[0].clientX - swipeStartX.current
      if (Math.abs(dx) > 50) {
        if (dx < 0) onNext(); else onPrev()
      }
    }
    swipeStartX.current = null
  }

  // 點擊遮罩關閉（排除拖動）
  const handleOverlayClick = () => {
    if (!hasDragged.current) onClose()
    hasDragged.current = false
  }

  const cursor = scale > 1 ? (isDragging.current ? 'grabbing' : 'grab') : 'default'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 select-none"
      onClick={handleOverlayClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 關閉 */}
      <button
        className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl z-10 transition-colors w-10 h-10 flex items-center justify-center"
        onClick={(e) => { e.stopPropagation(); onClose() }}
      >✕</button>

      {/* 圖片計數 */}
      {total > 1 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-sm z-10 pointer-events-none">
          {currentIndex + 1} / {total}
        </div>
      )}

      {/* 左箭頭 */}
      {total > 1 && (
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-5xl z-10 transition-colors px-2 py-4"
          onClick={(e) => { e.stopPropagation(); reset(); onPrev() }}
        >‹</button>
      )}

      {/* 右箭頭 */}
      {total > 1 && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-5xl z-10 transition-colors px-2 py-4"
          onClick={(e) => { e.stopPropagation(); reset(); onNext() }}
        >›</button>
      )}

      {/* 縮放比例提示 */}
      {scale > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/40 text-xs z-10 pointer-events-none">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* 圖片容器 */}
      <div
        className="flex items-center justify-center"
        style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleMouseDown}
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            cursor,
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        />
      </div>
    </div>
  )
}
