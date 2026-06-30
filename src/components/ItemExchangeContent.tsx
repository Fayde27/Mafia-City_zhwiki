'use client'

import MarkdownRenderer from './MarkdownRenderer'

interface ExchangeItem { icon: string; name: string; quantity: string }
interface ExchangeContent { intro: string; items: ExchangeItem[] }

export function parseExchangeContent(raw?: string): ExchangeContent | null {
  if (!raw) return null
  try {
    const d = JSON.parse(raw)
    const items = Array.isArray(d?.items) ? d.items : []
    if (items.length === 0 && !d?.intro) return null
    return { intro: d.intro || '', items }
  } catch { return null }
}

export default function ItemExchangeContent({ raw }: { raw?: string }) {
  const data = parseExchangeContent(raw)
  if (!data || data.items.length === 0) {
    return <p className="text-wiki-text-muted text-sm">暫無兌換內容</p>
  }

  return (
    <div>
      {data.intro && (
        <p className="text-wiki-accent text-sm font-bold mb-4">{data.intro}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.items.map((it, i) => (
          <div key={i} className="flex items-center gap-3 bg-wiki-gray border border-wiki-border rounded-lg p-2.5">
            <div className="w-12 h-12 rounded-md overflow-hidden bg-wiki-gray-light border border-wiki-border flex items-center justify-center flex-shrink-0">
              {it.icon
                ? <img src={it.icon} alt={it.name} className="w-full h-full object-contain p-0.5" />
                : <span className="text-wiki-text-muted text-[10px]">無圖</span>}
            </div>
            <div className="flex-1 text-wiki-text text-sm font-medium min-w-0 break-words [&_*]:inline [&_p]:m-0">
              {it.name ? <MarkdownRenderer content={it.name} /> : '（未命名）'}
            </div>
            {it.quantity && (
              <span className="text-wiki-accent text-sm font-bold flex-shrink-0">× {it.quantity}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
