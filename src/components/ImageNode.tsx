'use client'

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useRef, useCallback } from 'react'

export default function ImageNode({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, width, align } = node.attrs
  const imgRef = useRef<HTMLImageElement>(null)

  // 拖動右下角把手縮放
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = imgRef.current?.offsetWidth || 400

    const onMove = (ev: MouseEvent) => {
      const next = Math.max(40, startWidth + (ev.clientX - startX))
      updateAttributes({ width: Math.round(next) })
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [updateAttributes])

  const justifyMap: Record<string, string> = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  }

  const btnClass = (active: boolean) =>
    `px-1.5 py-0.5 text-xs rounded transition-colors ${active ? 'bg-wiki-accent text-black font-bold' : 'text-white hover:bg-white/20'}`

  return (
    <NodeViewWrapper
      as="div"
      contentEditable={false}
      style={{
        display: 'flex',
        justifyContent: justifyMap[align] || 'flex-start',
        margin: '8px 0',
      }}
    >
      <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>

        {/* 選中時顯示工具列 */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              top: '-36px',
              left: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              padding: '3px 6px',
              zIndex: 50,
              whiteSpace: 'nowrap',
            }}
          >
            {/* 對齊 */}
            <button type="button" onClick={() => updateAttributes({ align: 'left' })} className={btnClass(align === 'left')} title="靠左">◀ 左</button>
            <button type="button" onClick={() => updateAttributes({ align: 'center' })} className={btnClass(align === 'center')} title="居中">≡ 中</button>
            <button type="button" onClick={() => updateAttributes({ align: 'right' })} className={btnClass(align === 'right')} title="靠右">右 ▶</button>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', height: '14px', margin: '0 2px' }} />
            {/* 寬度輸入 */}
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>寬</span>
            <input
              type="number"
              min={40}
              max={2000}
              value={width || ''}
              onChange={e => updateAttributes({ width: e.target.value ? Number(e.target.value) : null })}
              placeholder="自動"
              style={{
                width: '56px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '11px',
                padding: '1px 4px',
                outline: 'none',
              }}
            />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>px</span>
            {width && (
              <button
                type="button"
                onClick={() => updateAttributes({ width: null })}
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', cursor: 'pointer' }}
                title="重置寬度"
              >✕</button>
            )}
          </div>
        )}

        {/* 圖片 */}
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          style={{
            display: 'block',
            width: width ? `${width}px` : 'auto',
            maxWidth: '100%',
            outline: selected ? '2px solid #e8c547' : 'none',
            outlineOffset: '2px',
            borderRadius: '2px',
            cursor: 'default',
          }}
          draggable={false}
        />

        {/* 右下角縮放把手 */}
        {selected && (
          <div
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '14px',
              height: '14px',
              background: '#e8c547',
              borderRadius: '2px 0 2px 0',
              cursor: 'se-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="#1a1a2e">
              <path d="M1 7L7 1M4 7L7 4M7 7V4H4" stroke="#1a1a2e" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
