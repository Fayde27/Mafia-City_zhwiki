'use client'

export const runtime = 'edge'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminCharacterNewPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/characters/edit/new')
  }, [router])
  return null
}
