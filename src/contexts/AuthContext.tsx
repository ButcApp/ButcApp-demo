'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  full_name?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any | null }>
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any | null }>
  updateUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Local storage'dan user'ı kontrol et
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      console.log('Attempting to sign up with email:', email)
      
      // Mock signup - her zaman başarılı
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: email.trim().toLowerCase(),
        full_name: fullName || null,
        name: fullName || email.split('@')[0]
      }

      // Local storage'a kaydet
      localStorage.setItem('user', JSON.stringify(newUser))
      setUser(newUser)

      // App sayfasına yönlendir
      router.push('/app')
      
      return { error: null }
    } catch (error) {
      console.error('Signup error:', error)
      return { error: error as any }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with email:', email)
      
      // Mock authentication
      if (email === 'admin@butcapp.com' && password === 'admin123') {
        const adminUser: User = {
          id: 'admin123',
          email: 'admin@butcapp.com',
          name: 'Admin',
          full_name: 'ButcApp Admin'
        }

        localStorage.setItem('user', JSON.stringify(adminUser))
        setUser(adminUser)
        router.push('/app')
        return { error: null }
      }

      // Regular user login
      const regularUser: User = {
        id: `user_${Date.now()}`,
        email: email.trim().toLowerCase(),
        name: email.split('@')[0]
      }

      localStorage.setItem('user', JSON.stringify(regularUser))
      setUser(regularUser)
      router.push('/app')
      
      return { error: null }
    } catch (error) {
      console.error('Signin error:', error)
      return { error: error as any }
    }
  }

  const signOut = async () => {
    try {
      localStorage.removeItem('user')
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log('Password reset requested for email:', email)
      // Mock password reset - her zaman başarılı
      return { error: null }
    } catch (error) {
      console.error('Password reset error:', error)
      return { error: error as any }
    }
  }

  const updateUser = async () => {
    try {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}