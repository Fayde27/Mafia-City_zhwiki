'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import { useEffect, useRef, useState } from 'react'

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
    if (!res.ok) return null
    const data = await res.json()
    return data.url || null
  } catch {
    return null
  }
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
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
      Image.configure({ allowBase64: true, inline: false }),
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
        // 优先处理直接粘贴的图片文件（截图、复制的图片文件）
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
              return true // 阻止默认粘贴行为
            }
          }
        }
        // 其余情况（含外链图片的 HTML 等）交给 TipTap 默认处理
        return false
      },
    },
  })

  // 同步 editor ref，供 handlePaste 闭包使用
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  // 点击外部关闭颜色选择器
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // 本地文件上传
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

  // 输入 URL 插入图片
  const handleInsertUrl = () => {
    const url = prompt('请输入图片 URL：')
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
      {/* 工具栏 */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-wiki-border" style={{ background: '#e8e0d0' }}>
        {/* 格式 */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="粗体"><strong>B</strong></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="斜体"><em>I</em></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'))} title="下划线"><span className="underline">U</span></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))} title="删除线"><span className="line-through">S</span></button>

        {/* 字体颜色 */}
        <div className="relative" ref={colorPickerRef}>
          <button
            type="button"
            onClick={() => setShowColorPicker(v => !v)}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-black/10 text-gray-700"
            title="字体颜色"
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
                  title="自定义颜色"
                />
                <span className="text-wiki-text-muted text-xs">自定义</span>
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

        {/* 标题 */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive('heading', { level: 1 }))} title="标题1">H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))} title="标题2">H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))} title="标题3">H3</button>

        <div className="w-px bg-wiki-border mx-0.5" />

        {/* 对齐 */}
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btn(editor.isActive({ textAlign: 'left' }))} title="左对齐">⬛</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btn(editor.isActive({ textAlign: 'center' }))} title="居中">≡</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btn(editor.isActive({ textAlign: 'right' }))} title="右对齐">⬛</button>

        <div className="w-px bg-wiki-border mx-0.5" />

        {/* 列表/引用/代码 */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))} title="无序列表">• 列表</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="有序列表">1. 列表</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))} title="引用">❝</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btn(editor.isActive('codeBlock'))} title="代码块">{`</>`}</button>

        <div className="w-px bg-wiki-border mx-0.5" />

        {/* 链接 */}
        <button
          type="button"
          onClick={() => {
            const url = prompt('输入链接 URL:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          className={btn(editor.isActive('link'))}
          title="插入链接"
        >🔗</button>
        <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className={btn(false)} title="移除链接">✕链接</button>

        <div className="w-px bg-wiki-border mx-0.5" />

        {/* 图片插入 */}
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
          title="上传图片"
        >
          {uploading ? '上传中…' : '🖼️上传'}
        </button>
        <button
          type="button"
          onClick={handleInsertUrl}
          className={btn(false)}
          title="输入图片URL"
        >
          🔗图片
        </button>

        <div className="w-px bg-wiki-border mx-0.5" />

        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn(false)} title="分割线">—</button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn(false)} title="撤销">↩</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn(false)} title="重做">↪</button>
      </div>

      {/* 编辑区域 */}
      <EditorContent editor={editor} />
    </div>
  )
}
