import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uizazhyshhazgmqrzxfq.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side için client (cookie handling olmadan)
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Server-side için service role client
export const supabaseAdmin = createSupabaseClient(
  supabaseUrl, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export type Database = {
  public: {
    Tables: {
      investments: {
        Row: {
          id: string
          user_id: string
          currency: string
          currency_name: string
          amount: number
          buy_price: number
          buy_date: string
          sell_price?: number
          sell_date?: string
          current_value: number
          profit: number
          profit_percent: number
          status: 'active' | 'sold'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          currency: string
          currency_name: string
          amount: number
          buy_price: number
          buy_date: string
          sell_price?: number
          sell_date?: string
          current_value?: number
          profit?: number
          profit_percent?: number
          status?: 'active' | 'sold'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          currency?: string
          currency_name?: string
          amount?: number
          buy_price?: number
          buy_date?: string
          sell_price?: number
          sell_date?: string
          current_value?: number
          profit?: number
          profit_percent?: number
          status?: 'active' | 'sold'
          updated_at?: string
        }
      }
    }
  }
}