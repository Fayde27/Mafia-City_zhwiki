'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
  minHeight = 'min-h-[200px]',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose prose-invert max-w-none focus:outline-none ${minHeight} px-4 py-3 text-wiki-text`,
        'data-placeholder': placeholder,
      },
    },
  })

  // 外部 value 变化时同步（如 useEffect 加载数据后）
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) return null

  const btn = (active: boolean) =>
    `px-2 py-1 text-sm rounded transition-colors ${active ? 'bg-wiki-accent text-wiki-darker font-bold' : 'text-wiki-text hover:bg-wiki-gray'}`

  return (
    <div className="border-2 border-wiki-border bg-wiki-gray rounded-lg overflow-hidden focus-within:border-wiki-accent">
      {/* 工具栏 */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-wiki-border bg-wiki-gray-light">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="粗体">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="斜体">
          <em>I</em>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'))} title="下划线">
          <span className="underline">U</span>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))} title="删除线">
          <span className="line-through">S</span>
        </button>

        <div className="w-px bg-wiki-border mx-1" />

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive('heading', { level: 1 }))} title="标题1">H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))} title="标题2">H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))} title="标题3">H3</button>

        <div className="w-px bg-wiki-border mx-1" />

        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btn(editor.isActive({ textAlign: 'left' }))} title="左对齐">≡</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btn(editor.isActive({ textAlign: 'center' }))} title="居中">≡</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btn(editor.isActive({ textAlign: 'right' }))} title="右对齐">≡</button>

        <div className="w-px bg-wiki-border mx-1" />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))} title="无序列表">• 列表</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="有序列表">1. 列表</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))} title="引用">❝</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btn(editor.isActive('codeBlock'))} title="代码块">{`</>`}</button>

        <div className="w-px bg-wiki-border mx-1" />

        <button
          type="button"
          onClick={() => {
            const url = prompt('输入链接 URL:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          className={btn(editor.isActive('link'))}
          title="插入链接"
        >
          🔗
        </button>
        <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className={btn(false)} title="移除链接">
          🔗✕
        </button>

        <div className="w-px bg-wiki-border mx-1" />

        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn(false)} title="分割线">—</button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn(false)} title="撤销">↩</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn(false)} title="重做">↪</button>
      </div>

      {/* 编辑区域 */}
      <EditorContent editor={editor} />
    </div>
  )
}
