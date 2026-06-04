'use client'

import { useState, useEffect } from 'react'

interface BgConfig {
  enabled: boolean
  left: { url: string; opacity: number; scale: number; offsetY: number; flip: boolean }
  right: { url: string; opacity: number; scale: number; offsetY: number; flip: boolean }
}

const DEFAULT_SIDE = { url: '', opacity: 0.85, scale: 1, offsetY: 0, flip: false }

export default function ArticleBackground() {
  const [cfg, setCfg] = useState<BgConfig | null>(null)

  useEffect(() => {
    fetch('/api/wiki/site-config')
      .then(r => r.json())
      .then((c: Record<string, string>) => {
        if (c.articleBgEnabled !== '1') return
        setCfg({
          enabled: true,
          left: {
            url: c.articleBgLeftUrl || '',
            opacity: parseFloat(c.articleBgLeftOpacity || '0.85'),
            scale: parseFloat(c.articleBgLeftScale || '1'),
            offsetY: parseInt(c.articleBgLeftOffsetY || '0'),
            flip: c.articleBgLeftFlip === '1',
          },
          right: {
            url: c.articleBgRightUrl || '',
            opacity: parseFloat(c.articleBgRightOpacity || '0.85'),
            scale: parseFloat(c.articleBgRightScale || '1'),
            offsetY: parseInt(c.articleBgRightOffsetY || '0'),
            flip: c.articleBgRightFlip === '1',
          },
        })
      })
      .catch(() => {})
  }, [])

  if (!cfg) return null

  const sideStyle = (s: typeof DEFAULT_SIDE, isLeft: boolean) => ({
    opacity: s.opacity,
    transform: `scaleX(${isLeft !== s.flip ? 1 : -1}) scale(${s.scale})`,
    transformOrigin: isLeft ? 'left bottom' : 'right bottom',
    bottom: `${s.offsetY}px`,
  })

  return (
    <>
      {/* 左側立繪 */}
      {cfg.left.url && (
        <div className="hidden xl:block fixed left-0 bottom-0 z-0 pointer-events-none select-none"
          style={{ maxWidth: 'calc((100vw - 56rem) / 2)' }}>
          <img
            src={cfg.left.url}
            alt=""
            className="block max-h-[80vh] w-auto object-contain object-bottom"
            style={sideStyle(cfg.left, true)}
            draggable={false}
          />
        </div>
      )}

      {/* 右側立繪 */}
      {cfg.right.url && (
        <div className="hidden xl:block fixed right-0 bottom-0 z-0 pointer-events-none select-none"
          style={{ maxWidth: 'calc((100vw - 56rem) / 2)' }}>
          <img
            src={cfg.right.url}
            alt=""
            className="block max-h-[80vh] w-auto object-contain object-bottom"
            style={sideStyle(cfg.right, false)}
            draggable={false}
          />
        </div>
      )}
    </>
  )
}
