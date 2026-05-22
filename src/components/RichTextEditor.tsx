'use client'

import { useEditor, EditorContent, Editor, Extension } from '@tiptap/react'
import { ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import ImageNodeView from './ImageNode'
import { useEffect, useRef, useState } from 'react'

// 自訂 FontSize extension（inline，僅作用於選取的文字）
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize?.replace('px', '') || null,
          renderHTML: attrs => attrs.fontSize
            ? { style: `font-size: ${attrs.fontSize}px` }
            : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: any) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    } as any
  },
})

const FONT_SIZES = ['8','9','10','11','12','14','16','18','20','24','28','32','36','48','72']

// 自訂 Image extension（支援 width 和 align 屬性 + NodeView）
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: el => {
          const s = el.style.width; if (s) return parseInt(s)
          const a = el.getAttribute('width'); return a ? Number(a) : null
        },
        renderHTML: () => ({}), // 統一由 renderHTML 處理
      },
      align: {
        default: 'left',
        parseHTML: el => el.getAttribute('data-align') || 'left',
        renderHTML: () => ({}), // 統一由 renderHTML 處理
      },
    }
  },
  renderHTML({ HTMLAttributes }) {
    const { src, alt, width, align, ...rest } = HTMLAttributes
    const styles: string[] = ['max-width: 100%']
    if (align === 'center') styles.push('display: block', 'margin-left: auto', 'margin-right: auto')
    else if (align === 'right') styles.push('display: block', 'margin-left: auto')
    else styles.push('display: block')
    if (width) styles.push(`width: ${width}px`)
    return ['img', { ...rest, src, alt: alt || '', 'data-align': align || 'left', style: styles.join('; ') }]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },
})

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

const PRESET_COLORS = [
  '#e8e0d0', '#b8960c', '#e8c840', '#ff4444', '#ff8800',
  '#44cc44', '#44aaff', '#aa44ff', '#ffffff', '#aaaaaa',
  '#666666', '#333333',
]

async function uploadImageFile(file: File): Promise<string | null> {
  const fd = new FormData()
  fd.append('file', file)
  try {
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) {
      alert(`圖片上傳失敗\n${data.error || '未知錯誤'}`)
      return null
    }
    return data.url || null
  } catch (err) {
    alert(`圖片上傳失敗\n網絡錯誤：${err instanceof Error ? err.message : '請檢查網絡連線'}`)
    return null
  }
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '請輸入內容...',
  minHeight = 'min-h-[200px]',
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontSize,
      CustomImage.configure({ allowBase64: true, inline: false }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none ${minHeight} px-4 py-3`,
        'data-placeholder': placeholder,
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || [])
        // 優先處理直接粘貼的圖片文件（截圖、複製的圖片文件）
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) {
              ;(async () => {
                setUploading(true)
                try {
                  const url = await uploadImageFile(file)
                  if (url) {
                    editorRef.current?.chain().focus().setImage({ src: url }).run()
                  }
                } finally {
                  setUploading(false)
                }
              })()
              return true // 阻止預設粘貼行為
            }
          }
        }
        // 其餘情況（含外鏈圖片的 HTML 等）交給 TipTap 預設處理
        return false
      },
    },
  })

  // 同步 editor ref，供 handlePaste 閉包使用
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  // 點擊外部關閉顏色選擇器
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // 本地文件上傳
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    e.target.value = ''
    setUploading(true)
    try {
      const url = await uploadImageFile(file)
      if (url) editor.chain().focus().setImage({ src: url }).run()
    } finally {
      setUploading(false)
    }
  }

  // 輸入 URL 插入圖片
  const handleInsertUrl = () => {
    const url = prompt('請輸入圖片 URL：')
    if (url?.trim()) {
      editor?.chain().focus().setImage({ src: url.trim() }).run()
    }
  }

  if (!editor) return null

  const btn = (active: boolean) =>
    `px-2 py-1 text-xs rounded transition-colors ${active ? 'bg-wiki-accent text-wiki-darker font-bold' : 'text-gray-700 hover:bg-black/10'}`

  const currentColor = editor.getAttributes('textStyle').color || '#e8e0d0'

  return (
    <div className="border-2 border-wiki-border rounded-lg overflow-hidden focus-within:border-wiki-accent" style={{ background: '#f5f5f0' }}>
      {/* 工具欄 */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-wiki-border" style={{ background: '#e8e0d0' }}>
        {/* 字號選擇 */}
        <select
          title="字號"
          value={editor.getAttributes('textStyle').fontSize || ''}
          onChange={e => {
            const size = e.target.value
            if (size) {
              (editor.chain().focus() as any).setFontSize(size).run()
            } else {
              (editor.chain().focus() as any).unsetFontSize().run()
            }
          }}
          className="text-xs bg-white border border-wiki-border rounded px-1 py-0.5 text-gray-700 h-[26px] w-16 cursor-pointer focus:outline-none focus:border-wiki-accent"
        >
          <option value="">字號</option>
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="w-px bg-wiki-border mx-0.5" />

        {/* 格式 */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="粗體"><strong>B</strong></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="斜體"><em>I</em></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'))} title="下劃線"><span className="underline">U</span></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))} title="刪除線"><span className="line-through">S</span></button>

        {/* 字體顏色 */}
        <div className="relative" ref={colorPickerRef}>
          <button
            type="button"
            onClick={() => setShowColorPicker(v => !v)}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-black/10 text-gray-700"
            title="字體顏色"
          >
            <span style={{ color: currentColor }}>A</span>
            <span className="w-3 h-1.5 rounded-sm border border-wiki-border" style={{ backgroundColor: currentColor }} />
            <span className="text-wiki-text-muted">▾</span>
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-300 rounded-lg p-2 shadow-lg min-w-[160px]">
              <div className="grid grid-cols-6 gap-1 mb-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false) }}
                    className="w-5 h-5 rounded border border-wiki-border hover:scale-125 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  defaultValue={currentColor}
                  onChange={e => editor.chain().focus().setColor(e.target.value).run()}
                  className="w-8 h-7 cursor-pointer rounded border border-wiki-border bg-transparent"
                  title="自定義顏色"
                />
                <span className="text-wiki-text-muted text-xs">自定義</span>
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false) }}
                  className="ml-auto text-xs text-gray-500 hover:text-gray-800"
                >
                  重置
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px bg-wiki-border mx-0.5" />

        {/* 標題 */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive('heading', { level: 1 }))} title="標題1">H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))} title="標題2">H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))} title="標題3">H3</button>

        <div className="w-px bg-wiki-border mx-0.5" />

        {/* 對齊 */}
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btn(editor.isActive({ textAlign: 'left' }))} title="左對齊">⬛</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btn(editor.isActive({ textAlign: 'center' }))} title="居中">≡</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btn(editor.isActive({ textAlign: 'right' }))} title="右對齊">⬛</button>

        <div className="w-px bg-wiki-border mx-0.5" />

        {/* 列表/引用/代碼 */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))} title="無序列表">• 列表</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="有序列表">1. 列表</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))} title="引用">❝</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btn(editor.isActive('codeBlock'))} title="代碼塊">{`</>`}</button>

        <div className="w-px bg-wiki-border mx-0.5" />

        {/* 連結 */}
        <button
          type="button"
          onClick={() => {
            const url = prompt('輸入連結 URL:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          className={btn(editor.isActive('link'))}
          title="插入連結"
        >🔗</button>
        <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className={btn(false)} title="移除連結">✕連結</button>

        <div className="w-px bg-wiki-border mx-0.5" />

        {/* 圖片插入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`${btn(false)} ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="上傳圖片"
        >
          {uploading ? '上傳中…' : '🖼️上傳'}
        </button>
        <button
          type="button"
          onClick={handleInsertUrl}
          className={btn(false)}
          title="輸入圖片URL"
        >
          🔗圖片
        </button>

        <div className="w-px bg-wiki-border mx-0.5" />

        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn(false)} title="分割線">—</button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn(false)} title="撤銷">↩</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn(false)} title="重做">↪</button>
      </div>

      {/* 編輯區域 */}
      <EditorContent editor={editor} />
    </div>
  )
}
