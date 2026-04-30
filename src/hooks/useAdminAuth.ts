'use client'

import { useState, useEffect } from 'react'

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(() => {
    return !!localStorage.getItem('token')
  })
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token')
  })

  const logout = () => {
    localStorage.removeItem('token')
    setIsAdmin(false)
    setToken(null)
  }

  return { isAdmin, token, logout }
}
