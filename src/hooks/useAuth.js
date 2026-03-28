import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Returns { session, user, profile, loading, signInWithGoogle, signOut }
 * - session: raw Supabase session
 * - user: auth.users record (from session)
 * - profile: public.users row (app profile)
 * - loading: true while fetching initial state
 */
export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        setLoading(true)
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })


    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data ?? null)
    setLoading(false)
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshProfile: () => session?.user?.id && fetchProfile(session.user.id),
    signInWithGoogle,
    signOut,
  }
}
