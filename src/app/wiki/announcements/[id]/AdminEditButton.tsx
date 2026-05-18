'use client'

import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminEditButton({ announcementId }: { announcementId: string }) {
  const { isAdmin, isLoaded } = useAdminAuth()

  if (!isLoaded || !isAdmin) return null

  return (
    <Link
      href={`/admin/announcements/edit/${announcementId}`}
      className="inline-flex items-center gap-2 px-4 py-2 bg-wiki-accent/10 text-wiki-accent text-sm font-bold rounded-lg hover:bg-wiki-accent/20 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      編輯公告
    </Link>
  )
}
