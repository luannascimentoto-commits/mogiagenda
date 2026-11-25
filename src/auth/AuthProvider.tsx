import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { AuthContext, type AuthState, type Clinic, type Profile } from './auth-context'

interface Loaded {
  userId: string
  profile: Profile | null
  clinic: Clinic | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  // 1) Descobre se já existe um login salvo e acompanha entradas e saídas.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // 2) Com alguém logado, busca o perfil (papel) e a clínica dessa pessoa.
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load(id: string) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, clinic_id, full_name, role, is_active')
        .eq('id', id)
        .maybeSingle()

      let clinic: Clinic | null = null
      if (profile) {
        const { data } = await supabase
          .from('clinics')
          .select('id, name, slug')
          .eq('id', profile.clinic_id)
          .maybeSingle()
        clinic = data
      }
      if (!cancelled) setLoaded({ userId: id, profile, clinic })
    }

    void load(userId)
    return () => {
      cancelled = true
    }
  }, [userId])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? 'E-mail ou senha incorretos.' : null
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    // Esquece os dados em memória: o próximo login nunca vê dados do anterior.
    queryClient.clear()
  }, [queryClient])

  const isCurrent = !!userId && loaded?.userId === userId
  const value = useMemo<AuthState>(
    () => ({
      session,
      profile: isCurrent ? loaded.profile : null,
      clinic: isCurrent ? loaded.clinic : null,
      loading: sessionLoading || (!!userId && !isCurrent),
      signIn,
      signOut,
    }),
    [session, loaded, isCurrent, sessionLoading, userId, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
