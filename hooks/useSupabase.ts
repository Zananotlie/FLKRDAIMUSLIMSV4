"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://envaobpjzsnjbnlhxwoe.supabase.co"
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudmFvYnBqenNuamJubGh4d29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDg0MzYsImV4cCI6MjA2Njg4NDQzNn0.MW_u9UJF6iu07uoF-yGAE0HEBfWAZs86oGFg4P9WFuY"

const supabase = createClient(supabaseUrl, supabaseKey)

export function useSupabase() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setIsLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null)
      setIsLoading(false)

      // Create or update user profile
      if (session?.user) {
        const { error } = await supabase.from("profiles").upsert({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          avatar_url: session.user.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        if (error) console.error("Error updating profile:", error)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error("Google sign-in error:", error)
      return { data: null, error }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    user,
    isLoading,
    signInWithGoogle,
    signOut,
    supabase,
  }
}
