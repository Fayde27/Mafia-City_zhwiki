// 統一的 Wiki 內容模塊卡片：灰色標題條 + 內容區
export default function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-wiki-gray-light border border-wiki-border rounded-xl mb-5">
      <div className="px-5 py-3 border-b border-wiki-border">
        <h2 className="text-sm font-bold text-wiki-accent uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}
