import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create clients if environment variables are available
let supabase: ReturnType<typeof createClient> | null = null
let supabaseAdmin: ReturnType<typeof createClient> | null = null

if (typeof window !== 'undefined') {
  // Client side - only use anon key
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          'Accept': 'application/json'
        }
      }
    })
  }
} else {
  // Server side - can use service role key
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          'Accept': 'application/json'
        }
      }
    })
  }
  if (supabaseUrl && supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'Accept': 'application/json'
        }
      }
    })
  }
}

export { supabase, supabaseAdmin }

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_data: {
        Row: {
          id: string
          user_id: string
          data_type: 'accounts' | 'transactions' | 'recurring_transactions' | 'notes' | 'settings'
          data: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data_type: 'accounts' | 'transactions' | 'recurring_transactions' | 'notes' | 'settings'
          data: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          data_type?: 'accounts' | 'transactions' | 'recurring_transactions' | 'notes' | 'settings'
          data?: any
          created_at?: string
          updated_at?: string
        }
      }
      exchange_rates: {
        Row: {
          id: string
          currency_code: string
          currency_name: string
          buy_rate: number
          sell_rate: number
          change_rate: number | null
          change_percent: number | null
          flag: string
          source: string
          last_update: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          currency_code: string
          currency_name: string
          buy_rate: number
          sell_rate: number
          change_rate?: number | null
          change_percent?: number | null
          flag: string
          source?: string
          last_update?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          currency_code?: string
          currency_name?: string
          buy_rate?: number
          sell_rate?: number
          change_rate?: number | null
          change_percent?: number | null
          flag?: string
          source?: string
          last_update?: string
          created_at?: string
          updated_at?: string
        }
      }
      exchange_rate_history: {
        Row: {
          id: string
          currency_code: string
          currency_name: string
          buy_rate: number
          sell_rate: number
          change_rate: number | null
          change_percent: number | null
          flag: string
          source: string
          record_date: string
          created_at: string
        }
        Insert: {
          id?: string
          currency_code: string
          currency_name: string
          buy_rate: number
          sell_rate: number
          change_rate?: number | null
          change_percent?: number | null
          flag: string
          source?: string
          record_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          currency_code?: string
          currency_name?: string
          buy_rate?: number
          sell_rate?: number
          change_rate?: number | null
          change_percent?: number | null
          flag?: string
          source?: string
          record_date?: string
          created_at?: string
        }
      }
    }
    Functions: {
      update_exchange_rate: {
        Args: {
          p_currency_code: string
          p_currency_name: string
          p_buy_rate: number
          p_sell_rate: number
          p_change_rate?: number | null
          p_change_percent?: number | null
          p_flag: string
          p_source?: string
        }
        Returns: boolean
      }
      get_exchange_rates: {
        Args: Record<PropertyKey, never>
        Returns: {
          currency_code: string
          currency_name: string
          buy_rate: number
          sell_rate: number
          change_rate: number | null
          change_percent: number | null
          flag: string
          source: string
          last_update: string
        }[]
      }
      get_exchange_rate_history: {
        Args: {
          p_currency_code?: string | null
          p_days?: number
        }
        Returns: {
          currency_code: string
          currency_name: string
          buy_rate: number
          sell_rate: number
          change_rate: number | null
          change_percent: number | null
          flag: string
          source: string
          record_date: string
        }[]
      }
    }
  }
}