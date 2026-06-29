'use client'

export const runtime = 'edge'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TroopCategoryRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/wiki/troops') }, [])
  return null
}
