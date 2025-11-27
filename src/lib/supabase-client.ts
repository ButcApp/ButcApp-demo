'use client'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uizazhyshhazgmqrzxfq.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client Component'lerde kullanmak için
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
}

// Export default client for backward compatibility
export const supabase = createClient()