'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) {
      router.push('/admin/login')
    } else {
      router.push('/')
    }
  }, [isAdmin, isLoaded, router])

  return (
    <div className="min-h-screen bg-wiki-bg flex items-center justify-center">
      <p className="text-wiki-text-muted">跳转中...</p>
    </div>
  )
}
