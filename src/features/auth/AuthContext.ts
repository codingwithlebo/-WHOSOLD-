import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export interface AuthResult {
  error?: string
}

export interface AuthContextValue {
  session: Session | null
  user: User | null
  displayName: string | null
  /** True while the saved session is being restored on first load. */
  loading: boolean
  /** False when Supabase keys are missing from the environment. */
  configured: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<AuthResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
