'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type SupabaseAuthContextType = {
  user: User | null
  loading: boolean
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  user: null,
  loading: true,
})

export function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 获取初始 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听 auth 状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // 当用户登录时，同步用户信息到 users 表
      if (event === 'SIGNED_IN' && session?.user) {
        await syncUserToDatabase(session.user)
      }

      // 刷新页面以更新 Server Components
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  return (
    <SupabaseAuthContext.Provider value={{ user, loading }}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext)
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider')
  }
  return context
}

/**
 * 同步 Supabase Auth 用户到 users 表
 */
async function syncUserToDatabase(user: User) {
  try {
    await fetch('/api/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uuid: user.id,
        email: user.email,
        nickname: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        signin_provider: user.app_metadata?.provider || 'email',
      }),
    })
  } catch (error) {
    console.error('Failed to sync user to database:', error)
  }
}

