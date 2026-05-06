'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { isAdmin } = useAdminAuth()

  useEffect(() => {
    if (!isAdmin) {
      router.push('/admin/login')
    } else {
      router.push('/')
    }
  }, [isAdmin, router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-900-muted">跳转中...</p>
    </div>
  )
}
