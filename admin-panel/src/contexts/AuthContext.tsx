'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AdminUser } from '@/lib/api'
import { apiClient } from '@/lib/api'

interface AuthContextType {
  user: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; message?: string }>
  verify2FA: (token: string, code: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        if (token) {
          apiClient.setToken(token)
          // You might want to add a verify token endpoint
          // await refreshUser()
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('admin_token')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await apiClient.login(email, password)
      
      if (response.success) {
        apiClient.setToken(response.data.token)
        setUser(response.data.user)
        return { success: true, requires2FA: response.data.requires2FA }
      } else {
        return { success: false, message: response.message || 'Login failed' }
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const verify2FA = async (token: string, code: string) => {
    try {
      setIsLoading(true)
      const response = await apiClient.verify2FA(token, code)
      
      if (response.success) {
        apiClient.setToken(response.data.token)
        setUser(response.data.user)
        return { success: true }
      } else {
        return { success: false, message: response.message || '2FA verification failed' }
      }
    } catch (error: any) {
      return { success: false, message: error.message || '2FA verification failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    apiClient.logout()
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      // This would be implemented when you add a verify token endpoint
      // const response = await apiClient.getProfile()
      // setUser(response.data)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      logout()
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    verify2FA,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
