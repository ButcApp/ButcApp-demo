import { supabase } from './supabase'

// Basit veri senkronizasyon fonksiyonları
export const dataSync = {
  // Mevcut kullanıcı ID'sini al
  async getCurrentUserId() {
    try {
      if (!supabase) {
        console.log('Supabase client not initialized')
        return null
      }
      
      // First try to get the current session (more reliable than getUser)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Error getting session:', sessionError)
        return null
      }
      
      if (session?.user) {
        console.log('Found user session:', session.user.id)
        return session.user.id
      }
      
      // Fallback to getUser if getSession doesn't work
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Error getting current user:', error)
        return null
      }
      if (!user) {
        console.log('No authenticated user found')
        return null
      }
      
      console.log('Found user via getUser:', user.id)
      return user.id
    } catch (error) {
      console.error('Error in getCurrentUserId:', error)
      return null
    }
  },

  // Bakiyeleri getir
  async getBalances() {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.log('No authenticated user found for balances')
        return { cash: 0, bank: 0, savings: 0 }
      }

      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'accounts')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No balances found for user, returning defaults')
          return { cash: 0, bank: 0, savings: 0 }
        }
        console.error('Error getting balances:', error)
        return { cash: 0, bank: 0, savings: 0 }
      }

      // Parse the data and extract only balance values
      try {
        const parsedData = JSON.parse(data?.data || '{}')
        const balances = {
          cash: parsedData.cash || 0,
          bank: parsedData.bank || 0,
          savings: parsedData.savings || 0
        }
        console.log('Balances retrieved from Supabase:', balances)
        return balances
      } catch (parseError) {
        console.error('Error parsing balances data:', parseError)
        return { cash: 0, bank: 0, savings: 0 }
      }
    } catch (error) {
      console.error('Error in getBalances:', error)
      return { cash: 0, bank: 0, savings: 0 }
    }
  },

  // Bakiyeleri güncelle
  async updateBalances(balances: any) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('No user ID found for updating balances')
        return false
      }

      console.log('Updating balances in Supabase:', balances)

      // Get existing accounts data to preserve it
      const { data: existingAccounts, error: accountsError } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'accounts')
        .single()

      let existingData = {}
      if (!accountsError && existingAccounts) {
        try {
          existingData = JSON.parse(existingAccounts.data || '{}')
        } catch (parseError) {
          console.error('Error parsing existing accounts data:', parseError)
        }
      }

      // Merge existing data with new balances
      const updatedData = {
        ...existingData,
        cash: balances.cash,
        bank: balances.bank,
        savings: balances.savings,
        lastUpdated: new Date().toISOString()
      }

      let result;
      if (existingAccounts) {
        // Update existing record
        result = await supabase
          .from('user_data')
          .update({
            data: JSON.stringify(updatedData),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('data_type', 'accounts')
      } else {
        // Insert new record
        result = await supabase
          .from('user_data')
          .insert({
            user_id: userId,
            data_type: 'accounts',
            data: JSON.stringify(updatedData),
            updated_at: new Date().toISOString()
          })
      }

      const { error } = result

      if (error) {
        console.error('Error updating balances:', error)
        return false
      }

      console.log('Balances successfully updated in Supabase')
      return true
    } catch (error) {
      console.error('Error in updateBalances:', error)
      return false
    }
  },

  // İşlemleri getir
  async getTransactions() {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.log('No authenticated user found for transactions')
        return []
      }

      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'transactions')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No transactions found for user')
          return []
        }
        console.error('Error getting transactions:', error)
        return []
      }

      console.log('Transactions retrieved from Supabase:', data?.data?.length || 0)
      return data?.data || []
    } catch (error) {
      console.error('Error in getTransactions:', error)
      return []
    }
  },

  // İşlem ekle
  async addTransaction(transaction: any) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('No user ID found for adding transaction')
        return false
      }

      console.log('Adding transaction to Supabase:', transaction)

      // Mevcut işlemleri getir
      const existingTransactions = await this.getTransactions()
      
      // Aynı ID'ye sahip işlem var mı kontrol et
      const duplicateTransaction = existingTransactions.find(t => 
        t.id === transaction.id || 
        (t.type === transaction.type && 
         t.amount === transaction.amount && 
         t.category === transaction.category && 
         t.account === transaction.account && 
         t.date === transaction.date)
      )

      if (duplicateTransaction) {
        console.error('Duplicate transaction found, not adding:', transaction)
        return false
      }

      const updatedTransactions = [transaction, ...existingTransactions]

      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userId,
          data_type: 'transactions',
          data: updatedTransactions,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,data_type'
        })

      if (error) {
        console.error('Error adding transaction:', error)
        return false
      }

      console.log('Transaction successfully added to Supabase')
      return true
    } catch (error) {
      console.error('Error in addTransaction:', error)
      return false
    }
  },

  // Tekrarlayan işlemleri getir
  async getRecurringTransactions() {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.log('No authenticated user found for recurring transactions')
        return []
      }

      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'recurring_transactions')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No recurring transactions found for user')
          return []
        }
        console.error('Error getting recurring transactions:', error)
        return []
      }

      console.log('Recurring transactions retrieved from Supabase:', data?.data?.length || 0)
      return data?.data || []
    } catch (error) {
      console.error('Error in getRecurringTransactions:', error)
      return []
    }
  },

  // Tekrarlayan işlem ekle
  async addRecurringTransaction(recurring: any) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('No user ID found for adding recurring transaction')
        return false
      }

      console.log('Adding recurring transaction to Supabase:', recurring)

      // Mevcut işlemleri getir
      const existingRecurring = await this.getRecurringTransactions()
      
      // Aynı ID'ye sahip işlem var mı kontrol et
      const duplicateRecurring = existingRecurring.find(r => 
        r.id === recurring.id || 
        (r.type === recurring.type && 
         r.amount === recurring.amount && 
         r.category === recurring.category && 
         r.account === recurring.account && 
         r.frequency === recurring.frequency && 
         r.dayOfMonth === recurring.dayOfMonth && 
         r.startDate === recurring.startDate)
      )

      if (duplicateRecurring) {
        console.error('Duplicate recurring transaction found, not adding:', recurring)
        return false
      }

      const updatedRecurring = [recurring, ...existingRecurring]

      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userId,
          data_type: 'recurring_transactions',
          data: updatedRecurring,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,data_type'
        })

      if (error) {
        console.error('Error adding recurring transaction:', error)
        return false
      }

      console.log('Recurring transaction successfully added to Supabase')
      return true
    } catch (error) {
      console.error('Error in addRecurringTransaction:', error)
      return false
    }
  },

  // Tekrarlayan işlem güncelle
  async updateRecurringTransaction(updatedRecurring: any) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('No user ID found for updating recurring transaction')
        return false
      }

      console.log('Updating recurring transaction in Supabase:', updatedRecurring)

      // Mevcut işlemleri getir ve güncelle
      const existingRecurring = await this.getRecurringTransactions()
      const updatedRecurring = existingRecurring.map(r => 
        r.id === updatedRecurring.id ? updatedRecurring : r
      )

      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userId,
          data_type: 'recurring_transactions',
          data: updatedRecurring,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,data_type'
        })

      if (error) {
        console.error('Error updating recurring transaction:', error)
        return false
      }

      console.log('Recurring transaction successfully updated in Supabase')
      return true
    } catch (error) {
      console.error('Error in updateRecurringTransaction:', error)
      return false
    }
  },

  // Notları getir
  async getNotes() {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.log('No authenticated user found for notes')
        return []
      }

      // Try server-side API first (more reliable)
      try {
        const response = await fetch(`/api/notes?userId=${userId}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            console.log('Notes retrieved via API:', result.data?.length || 0)
            return result.data || []
          }
        }
      } catch (apiError) {
        console.log('API call failed, falling back to client-side:', apiError)
      }

      // Fallback to client-side Supabase
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'notes')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No notes found for user')
          return []
        }
        console.error('Error getting notes:', error)
        return []
      }

      console.log('Notes retrieved from Supabase client:', data?.data?.length || 0)
      return data?.data || []
    } catch (error) {
      console.error('Error in getNotes:', error)
      return []
    }
  },

  // Döviz yatırımı ekle
  async addCurrencyInvestment(investment: any) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('No user ID found for adding currency investment')
        return false
      }

      console.log('Adding currency investment to Supabase:', investment)

      // Mevcut yatırımları getir
      const existingInvestments = await this.getCurrencyInvestments()
      
      // Yeni yatırımı ekle
      const updatedInvestments = [investment, ...existingInvestments]

      // Get existing accounts data to preserve it
      const { data: existingAccounts, error: accountsError } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'accounts')
        .single()

      let existingData = {}
      if (!accountsError && existingAccounts) {
        try {
          existingData = JSON.parse(existingAccounts.data || '{}')
        } catch (parseError) {
          console.error('Error parsing existing accounts data:', parseError)
        }
      }

      // Merge existing data with new currency investments
      const updatedData = {
        ...existingData,
        currencyInvestments: updatedInvestments,
        lastUpdated: new Date().toISOString()
      }

      // Supabase'e kaydet - use 'accounts' data type instead of 'currency_investments'
      let result;
      if (existingAccounts) {
        // Update existing record
        result = await supabase
          .from('user_data')
          .update({
            data: JSON.stringify(updatedData),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('data_type', 'accounts')
          .select()
      } else {
        // Insert new record
        result = await supabase
          .from('user_data')
          .insert({
            user_id: userId,
            data_type: 'accounts',
            data: JSON.stringify(updatedData),
            updated_at: new Date().toISOString()
          })
          .select()
      }

      const { data, error } = result

      if (error) {
        console.error('Error adding currency investment:', error)
        return false
      }

      console.log('Currency investment successfully saved to Supabase')
      return true
    } catch (error) {
      console.error('Error in addCurrencyInvestment:', error)
      return false
    }
  },

  // Döviz yatırımlarını getir
  async getCurrencyInvestments() {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.log('No authenticated user found for currency investments')
        return []
      }

      // Try server-side API first (more reliable)
      try {
        const response = await fetch(`/api/currency-investments?userId=${userId}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            console.log('Currency investments retrieved via API:', result.data?.length || 0)
            return result.data || []
          }
        }
      } catch (apiError) {
        console.log('API call failed, falling back to client-side:', apiError)
      }

      // Fallback to client-side Supabase - read from 'accounts' data type
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'accounts')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No currency investments found for user')
          return []
        }
        console.error('Error getting currency investments:', error)
        return []
      }

      // Parse the data and extract currency investments
      try {
        const parsedData = JSON.parse(data?.data || '{}')
        const currencyInvestments = parsedData.currencyInvestments || []
        console.log('Currency investments retrieved from Supabase client:', currencyInvestments.length)
        return currencyInvestments
      } catch (parseError) {
        console.error('Error parsing currency investments data:', parseError)
        return []
      }
    } catch (error) {
      console.error('Error in getCurrencyInvestments:', error)
      return []
    }
  },

  // Döviz yatırımı sil
  async deleteCurrencyInvestment(investmentId: string) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('No user ID found for deleting currency investment')
        return false
      }

      console.log('Deleting currency investment:', investmentId)

      // Try server-side API first (more reliable)
      try {
        const response = await fetch(`/api/currency-investments?userId=${userId}&investmentId=${investmentId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            console.log('Currency investment successfully deleted via API')
            return true
          }
        }
      } catch (apiError) {
        console.log('API call failed, falling back to client-side:', apiError)
      }

      // Fallback to client-side Supabase
      // Mevcut yatırımları getir
      const existingInvestments = await this.getCurrencyInvestments()
      
      // Yatırımı sil
      const updatedInvestments = existingInvestments.filter(inv => inv.id !== investmentId)

      // Get existing accounts data to preserve it
      const { data: existingAccounts, error: accountsError } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'accounts')
        .single()

      let existingData = {}
      if (!accountsError && existingAccounts) {
        try {
          existingData = JSON.parse(existingAccounts.data || '{}')
        } catch (parseError) {
          console.error('Error parsing existing accounts data:', parseError)
        }
      }

      // Merge existing data with updated currency investments
      const updatedData = {
        ...existingData,
        currencyInvestments: updatedInvestments,
        lastUpdated: new Date().toISOString()
      }

      // Update database using proper update/insert logic
      let result;
      if (existingAccounts) {
        // Update existing record
        result = await supabase
          .from('user_data')
          .update({
            data: JSON.stringify(updatedData),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('data_type', 'accounts')
          .select()
      } else {
        // Insert new record
        result = await supabase
          .from('user_data')
          .insert({
            user_id: userId,
            data_type: 'accounts',
            data: JSON.stringify(updatedData),
            updated_at: new Date().toISOString()
          })
          .select()
      }

      const { data, error } = result

      if (error) {
        console.error('Error deleting currency investment:', error)
        return false
      }

      console.log('Currency investment successfully deleted from Supabase')
      return true
    } catch (error) {
      console.error('Error in deleteCurrencyInvestment:', error)
      return false
    }
  },
  async addNote(note: any) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('No user ID found for adding note')
        return false
      }

      console.log('Adding note to Supabase:', note)

      // Mevcut notları getir
      const existingNotes = await this.getNotes()
      
      // Aynı ID'ye sahip not var mı kontrol et
      const duplicateNote = existingNotes.find(n => 
        n.id === note.id || 
        (n.content === note.content && n.createdAt === note.createdAt)
      )

      if (duplicateNote) {
        console.error('Duplicate note found, not adding:', note)
        return false
      }

      const updatedNotes = [note, ...existingNotes]

      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userId,
          data_type: 'notes',
          data: updatedNotes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,data_type'
        })

      if (error) {
        console.error('Error adding note:', error)
        return false
      }

      console.log('Note successfully added to Supabase')
      return true
    } catch (error) {
      console.error('Error in addNote:', error)
      return false
    }
  },

  // Not sil
  async deleteNote(noteId: string) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('No user ID found for deleting note')
        return false
      }

      console.log('Deleting note from Supabase:', noteId)

      // Mevcut notları getir ve sil
      const existingNotes = await this.getNotes()
      const updatedNotes = existingNotes.filter(note => note.id !== noteId)

      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userId,
          data_type: 'notes',
          data: updatedNotes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,data_type'
        })

      if (error) {
        console.error('Error deleting note:', error)
        return false
      }

      console.log('Note successfully deleted from Supabase')
      return true
    } catch (error) {
      console.error('Error in deleteNote:', error)
      return false
    }
  }
}