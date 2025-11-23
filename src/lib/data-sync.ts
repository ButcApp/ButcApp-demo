import { supabase } from './supabase'

export interface SyncData {
  accounts?: any
  transactions?: any[]
  recurring_transactions?: any[]
  notes?: any[]
  settings?: any
}

export class DataSyncService {
  private static instance: DataSyncService
  private userId: string | null = null
  private syncInProgress = false

  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService()
    }
    return DataSyncService.instance
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  // Verileri Supabase'e yükle
  async uploadToSupabase(dataType: keyof SyncData, data: any): Promise<boolean> {
    if (!this.userId) {
      console.error('User ID not set')
      return false
    }

    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: this.userId,
          data_type: dataType,
          data: data,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error uploading to Supabase:', error)
        return false
      }

      console.log(`Successfully uploaded ${dataType} to Supabase`)
      return true
    } catch (error) {
      console.error('Error in uploadToSupabase:', error)
      return false
    }
  }

  // Verileri Supabase'den indir
  async downloadFromSupabase(dataType: keyof SyncData): Promise<any | null> {
    if (!this.userId) {
      console.error('User ID not set')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', this.userId)
        .eq('data_type', dataType)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return null
        }
        console.error('Error downloading from Supabase:', error)
        return null
      }

      return data?.data || null
    } catch (error) {
      console.error('Error in downloadFromSupabase:', error)
      return null
    }
  }

  // Tüm verileri indir
  async downloadAllData(): Promise<SyncData | null> {
    if (!this.userId) {
      console.error('User ID not set')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('data_type, data')
        .eq('user_id', this.userId)

      if (error) {
        console.error('Error downloading all data:', error)
        return null
      }

      const result: SyncData = {}
      data?.forEach(item => {
        result[item.data_type as keyof SyncData] = item.data
      })

      return result
    } catch (error) {
      console.error('Error in downloadAllData:', error)
      return null
    }
  }

  // Tüm verileri yükle
  async uploadAllData(data: SyncData): Promise<boolean> {
    if (!this.userId) {
      console.error('User ID not set')
      return false
    }

    if (this.syncInProgress) {
      console.log('Sync already in progress')
      return false
    }

    this.syncInProgress = true

    try {
      const uploadPromises = Object.entries(data).map(([dataType, value]) =>
        this.uploadToSupabase(dataType as keyof SyncData, value)
      )

      const results = await Promise.all(uploadPromises)
      const allSuccessful = results.every(result => result)

      if (allSuccessful) {
        console.log('All data uploaded successfully')
      } else {
        console.error('Some data uploads failed')
      }

      return allSuccessful
    } catch (error) {
      console.error('Error in uploadAllData:', error)
      return false
    } finally {
      this.syncInProgress = false
    }
  }

  // Local storage'dan verileri al
  getLocalData(): SyncData {
    const data: SyncData = {}

    try {
      // Accounts
      const accounts = localStorage.getItem('cepfinans-accounts')
      if (accounts) {
        data.accounts = JSON.parse(accounts)
      }

      // Transactions
      const transactions = localStorage.getItem('cepfinans-transactions')
      if (transactions) {
        data.transactions = JSON.parse(transactions)
      }

      // Recurring transactions
      const recurring = localStorage.getItem('cepfinans-recurring')
      if (recurring) {
        data.recurring_transactions = JSON.parse(recurring)
      }

      // Notes
      const notes = localStorage.getItem('cepfinans-notes')
      if (notes) {
        data.notes = JSON.parse(notes)
      }

      // Settings
      const settings = localStorage.getItem('cepfinans-settings')
      if (settings) {
        data.settings = JSON.parse(settings)
      }
    } catch (error) {
      console.error('Error getting local data:', error)
    }

    return data
  }

  // Local storage'a verileri kaydet
  saveLocalData(data: SyncData): void {
    try {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          localStorage.setItem(`cepfinans-${key}`, JSON.stringify(value))
        }
      })
    } catch (error) {
      console.error('Error saving local data:', error)
    }
  }

  // İki yönlü senkronizasyon
  async syncData(): Promise<boolean> {
    if (!this.userId) {
      console.error('User ID not set')
      return false
    }

    if (this.syncInProgress) {
      console.log('Sync already in progress')
      return false
    }

    this.syncInProgress = true

    try {
      console.log('Starting data synchronization...')

      // Local verileri al
      const localData = this.getLocalData()

      // Supabase verilerini al
      const supabaseData = await this.downloadAllData()

      if (!supabaseData) {
        // Supabase'de veri yok, local verileri yükle
        console.log('No data in Supabase, uploading local data')
        return await this.uploadAllData(localData)
      }

      // Verileri birleştir (basit bir strateji: en güncel veriyi koru)
      const mergedData: SyncData = {}

      Object.keys(localData).forEach(key => {
        const dataType = key as keyof SyncData
        const localValue = localData[dataType]
        const supabaseValue = supabaseData[dataType]

        if (!supabaseValue) {
          // Supabase'de bu veri tipi yoksa local veriyi kullan
          mergedData[dataType] = localValue
        } else if (!localValue) {
          // Local'de bu veri tipi yoksa Supabase verisini kullan
          mergedData[dataType] = supabaseValue
        } else {
          // İkisinde de varsa, local veriyi kullan (son değişiklik)
          mergedData[dataType] = localValue
        }
      })

      // Birleştirilmiş verileri hem Supabase'e yükle hem de local'e kaydet
      await this.uploadAllData(mergedData)
      this.saveLocalData(mergedData)

      console.log('Data synchronization completed successfully')
      return true
    } catch (error) {
      console.error('Error during sync:', error)
      return false
    } finally {
      this.syncInProgress = false
    }
  }

  // Verileri sil
  async deleteData(dataType: keyof SyncData): Promise<boolean> {
    if (!this.userId) {
      console.error('User ID not set')
      return false
    }

    try {
      const { error } = await supabase
        .from('user_data')
        .delete()
        .eq('user_id', this.userId)
        .eq('data_type', dataType)

      if (error) {
        console.error('Error deleting data:', error)
        return false
      }

      // Local storage'dan da sil
      localStorage.removeItem(`cepfinans-${dataType}`)

      console.log(`Successfully deleted ${dataType}`)
      return true
    } catch (error) {
      console.error('Error in deleteData:', error)
      return false
    }
  }

  // Tüm verileri sil
  async deleteAllData(): Promise<boolean> {
    if (!this.userId) {
      console.error('User ID not set')
      return false
    }

    try {
      const { error } = await supabase
        .from('user_data')
        .delete()
        .eq('user_id', this.userId)

      if (error) {
        console.error('Error deleting all data:', error)
        return false
      }

      // Local storage'dan da temizle
      const keys = ['accounts', 'transactions', 'recurring_transactions', 'notes', 'settings']
      keys.forEach(key => {
        localStorage.removeItem(`cepfinans-${key}`)
      })

      console.log('Successfully deleted all data')
      return true
    } catch (error) {
      console.error('Error in deleteAllData:', error)
      return false
    }
  }
}

export const dataSyncService = DataSyncService.getInstance()