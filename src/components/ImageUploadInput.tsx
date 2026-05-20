'use client'

import { useState, useRef, useEffect } from 'react'

interface ImageUploadInputProps {
  label: string
  value: string
  position?: string
  onChange: (url: string) => void
  onPositionChange: (pos: string) => void
  previewHeight?: string
}

export default function ImageUploadInput({
  label,
  value,
  position = '50% 50%',
  onChange,
  onPositionChange,
  previewHeight = 'h-40',
}: ImageUploadInputProps) {
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [displayPosition, setDisplayPosition] = useState(position)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDraggingRef = useRef(false)
  const dragDataRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null)
  const displayPositionRef = useRef(position)
  const onPositionChangeRef = useRef(onPositionChange)
  const isActiveRef = useRef(false)

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange
  }, [onPositionChange])

  // 全局 Ctrl+V 粘貼監聽：鼠標懸停在組件上時激活
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (!isActiveRef.current) return
      const items = e.clipboardData ? Array.from(e.clipboardData.items) : []
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) uploadFile(file)
          return
        }
      }
    }
    document.addEventListener('paste', handleGlobalPaste)
    return () => document.removeEventListener('paste', handleGlobalPaste)
  }, [])

  useEffect(() => {
    setDisplayPosition(position)
    displayPositionRef.current = position
  }, [position])

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        onChange(data.url)
      } else {
        alert(`圖片上傳失敗\n${data.error || '未知錯誤'}`)
      }
    } catch (err) {
      alert(`圖片上傳失敗\n網絡錯誤：${err instanceof Error ? err.message : '請檢查網絡連線'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) uploadFile(file)
        return
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!value) return
    e.preventDefault()
    const parts = displayPositionRef.current.split(' ')
    dragDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: parseFloat(parts[0]) || 50,
      posY: parseFloat(parts[1]) || 50,
    }
    isDraggingRef.current = true
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragDataRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dx = (e.clientX - dragDataRef.current.startX) / rect.width * 100
      const dy = (e.clientY - dragDataRef.current.startY) / rect.height * 100
      const newX = Math.max(0, Math.min(100, dragDataRef.current.posX - dx))
      const newY = Math.max(0, Math.min(100, dragDataRef.current.posY - dy))
      const pos = `${newX.toFixed(1)}% ${newY.toFixed(1)}%`
      displayPositionRef.current = pos
      setDisplayPosition(pos)
    }

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        dragDataRef.current = null
        setIsDragging(false)
        onPositionChangeRef.current(displayPositionRef.current)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <div>
      <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">{label}</label>

      {value ? (
        <div
          ref={containerRef}
          className={`relative ${previewHeight} rounded-lg overflow-hidden bg-wiki-gray mb-2 select-none focus:outline-none focus:ring-2 focus:ring-wiki-accent ${isActive ? 'ring-2 ring-wiki-accent' : ''}`}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onPaste={handlePaste}
          onMouseEnter={() => { isActiveRef.current = true; setIsActive(true) }}
          onMouseLeave={() => { isActiveRef.current = false; setIsActive(false) }}
          tabIndex={0}
        >
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover pointer-events-none"
            style={{ objectPosition: displayPosition }}
            draggable={false}
          />
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none">
            {isActive ? '🖼️ Ctrl+V 粘貼 · 拖動調整位置' : '拖動調整顯示區域'}
          </div>
        </div>
      ) : (
        <div
          className={`${previewHeight} rounded-lg border-2 border-dashed bg-wiki-gray mb-2 flex flex-col items-center justify-center text-wiki-text-muted text-sm gap-1 focus:outline-none transition-colors ${isActive ? 'border-wiki-accent ring-2 ring-wiki-accent' : 'border-wiki-border'}`}
          onPaste={handlePaste}
          onMouseEnter={() => { isActiveRef.current = true; setIsActive(true) }}
          onMouseLeave={() => { isActiveRef.current = false; setIsActive(false) }}
          tabIndex={0}
        >
          <span>{uploading ? '上傳中...' : '暫無圖片'}</span>
          <span className="text-xs opacity-60">{isActive ? '🖼️ 現在可以 Ctrl+V 粘貼圖片' : '懸停後可 Ctrl+V 粘貼'}</span>
        </div>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none mb-2"
        placeholder="直接輸入圖片 URL，或使用下方按鈕上傳"
      />

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-wiki-gray border border-wiki-border text-wiki-text text-sm hover:border-wiki-accent disabled:opacity-50"
        >
          {uploading ? '上傳中...' : '選擇文件上傳'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); onPositionChange('50% 50%') }}
            className="px-4 py-2 bg-wiki-gray border border-wiki-border text-wiki-text-muted text-sm hover:border-red-500 hover:text-red-500"
          >
            清除
          </button>
        )}
        {value && (
          <span className="text-wiki-text-muted text-xs">位置: {displayPosition}</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
