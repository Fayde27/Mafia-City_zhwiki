export const runtime = 'edge'

import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import AdminEditButton from './AdminEditButton'
import LikeButton from '@/components/LikeButton'

interface Announcement {
  id: string
  title: string
  content: string
  banner: string | null
  type: string
  isActive: boolean
  sortOrder: number
  likes?: number
  createdAt: string
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'new': return 'NEW'
    case 'update': return 'UPDATE'
    case 'important': return '重要'
    default: return '公告'
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'new': return 'text-wiki-accent'
    case 'update': return 'text-blue-500'
    case 'important': return 'text-wiki-danger'
    default: return 'text-wiki-accent'
  }
}

export default async function AnnouncementPage({ params }: { params: { id: string } }) {
  let announcement: Announcement | null = null

  try {
    const { data } = await supabase
      .from('Announcement')
      .select('*')
      .eq('id', params.id)
      .single()

    announcement = data
  } catch (error) {
    console.error('Failed to fetch announcement:', error)
  }

  if (!announcement) {
    notFound()
  }

  const { data } = await supabase
    .from('Announcement')
    .select('*')
    .eq('isActive', true)
    .order('createdAt', { ascending: false })

  const announcements: any[] = data || []

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-72 flex-shrink-0 order-2 lg:order-1">
            <div className="sticky top-20">
              <div className="bg-wiki-card border border-wiki-border rounded-xl p-5">
                <h3 className="text-wiki-text font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="text-wiki-accent">◆</span>
                  公告列表
                </h3>
                <div className="space-y-2">
                  {announcements.length === 0 ? (
                    <p className="text-wiki-text-muted text-sm">暫無公告</p>
                  ) : (
                    announcements.map((ann: any) => (
                      <Link
                        key={ann.id}
                        href={`/wiki/announcements/${ann.id}`}
                        className={`block p-2.5 rounded-lg transition-colors group ${
                          ann.id === announcement!.id
                            ? 'bg-wiki-accent/10 border border-wiki-accent/30'
                            : 'hover:bg-wiki-gray'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${getTypeColor(ann.type)}`}>
                            [{getTypeLabel(ann.type)}]
                          </span>
                          <span className={`text-sm line-clamp-1 ${
                            ann.id === announcement!.id
                              ? 'text-wiki-accent font-medium'
                              : 'text-wiki-text-secondary group-hover:text-wiki-accent'
                          }`}>
                            {ann.title}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 order-1 lg:order-2">
            <div className="bg-wiki-card border border-wiki-border rounded-xl p-6">
              {announcement.banner && (
                <div className="mb-6 rounded-lg overflow-hidden w-full aspect-[3/1]">
                  <img
                    src={announcement.banner}
                    alt="公告 Banner"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${getTypeColor(announcement.type)}`}>
                    [{getTypeLabel(announcement.type)}]
                  </span>
                  <span className="text-wiki-text-muted text-xs">
                    {new Date(announcement.createdAt).toLocaleDateString('zh-TW')}
                  </span>
                </div>
                <AdminEditButton announcementId={announcement.id} />
              </div>

              <h1 className="text-2xl font-bold text-wiki-text mb-6">
                {announcement.title}
              </h1>

              <div className="prose prose-wiki max-w-none">
                {announcement.content?.trim().startsWith('<') ? (
                  <div
                    className="rich-content text-wiki-text leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                  />
                ) : (
                  <div className="text-wiki-text leading-relaxed whitespace-pre-wrap">
                    {announcement.content}
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-wiki-border flex justify-center">
                <LikeButton entityType="announcement" entityId={announcement.id} initialLikes={announcement.likes || 0} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <WikiFooter />
    </div>
  )
}