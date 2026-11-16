import type { Session } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { AuthContext, type AuthContextValue } from './AuthContext'

const NOT_CONFIGURED =
  'Supabase is not connected yet. Add the project keys to .env to log in.'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null
    const metaName = user?.user_metadata?.display_name

    return {
      session,
      user,
      displayName: typeof metaName === 'string' ? metaName : null,
      loading,
      configured: isSupabaseConfigured,
      async signIn(email, password) {
        if (!supabase) return { error: NOT_CONFIGURED }
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        return error ? { error: error.message } : {}
      },
      async signUp(email, password, displayName) {
        if (!supabase) return { error: NOT_CONFIGURED }
        // display_name is copied into public.profiles by a DB trigger (Phase 1).
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        })
        return error ? { error: error.message } : {}
      },
      async signOut() {
        await supabase?.auth.signOut()
      },
    }
  }, [session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
