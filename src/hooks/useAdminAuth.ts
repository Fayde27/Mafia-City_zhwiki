'use client'

import { useState, useEffect } from 'react'

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setIsAdmin(true)
      setToken(storedToken)
    }
    setIsLoaded(true)
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    setIsAdmin(false)
    setToken(null)
  }

  return { isAdmin, token, isLoaded, logout }
}
