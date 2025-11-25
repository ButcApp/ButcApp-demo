import { useEffect, useState } from 'react'

interface RecurringTransaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  account: 'cash' | 'bank' | 'savings'
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  startDate: string
  endDate?: string
  isActive: boolean
  lastProcessed?: string
  createdAt: string
}

export function useRecurringTransactions(userId: string) {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])

  // Tekrarlayan işlemleri kontrol et ve gerekirse yeni işlem oluştur
  const processRecurringTransactions = async () => {
    if (!userId) return

    try {
      // Veritabanından tekrarlayan işlemleri al
      const response = await fetch('/api/recurring-transactions')
      if (!response.ok) return

      const data = await response.json()
      const transactions: RecurringTransaction[] = data.transactions || []

      const today = new Date()
      today.setHours(0, 0, 0, 0) // Günün başlangıcı

      for (const recurring of transactions) {
        if (!recurring.isActive) continue

        const startDate = new Date(recurring.startDate)
        const lastProcessed = recurring.lastProcessed ? new Date(recurring.lastProcessed) : null
        const endDate = recurring.endDate ? new Date(recurring.endDate) : null

        // Bitiş tarihi geçmişse atla
        if (endDate && endDate < today) continue

        // Son işlemden beri yeni işlem oluşturulmalı mı?
        let shouldCreate = false
        let nextDate = new Date(startDate)

        if (!lastProcessed) {
          // Hiç işlem yapılmamışsa, başlangıç tarihinden itibaren kontrol et
          shouldCreate = startDate <= today
        } else {
          // Son işlemden sonraki tarihi hesapla
          nextDate = calculateNextDate(lastProcessed, recurring.frequency)
          shouldCreate = nextDate <= today
        }

        if (shouldCreate) {
          // Yeni işlem oluştur
          await createRecurringTransaction(recurring, today)
          
          // Son işlem tarihini güncelle
          await updateLastProcessedDate(recurring.id, today.toISOString())
        }
      }
    } catch (error) {
      console.error('Tekrarlayan işlemler kontrol edilirken hata:', error)
    }
  }

  // Bir sonraki işlem tarihini hesapla
  const calculateNextDate = (lastDate: Date, frequency: string): Date => {
    const next = new Date(lastDate)
    
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1)
        break
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1)
        break
    }
    
    return next
  }

  // Tekrarlayan işlem için normal transaction oluştur
  const createRecurringTransaction = async (recurring: RecurringTransaction, date: Date) => {
    const transaction = {
      type: recurring.type,
      amount: recurring.amount,
      category: recurring.category,
      description: `${recurring.description} (Tekrarlayan)`,
      account: recurring.account,
      date: date.toISOString()
    }

    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transaction)
    })

    if (!response.ok) {
      throw new Error('Tekrarlayan işlem oluşturulamadı')
    }

    return response.json()
  }

  // Son işlem tarihini güncelle
  const updateLastProcessedDate = async (recurringId: string, date: string) => {
    const response = await fetch('/api/recurring-transactions', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recurringId,
        lastProcessed: date
      })
    })

    if (!response.ok) {
      throw new Error('Son işlem tarihi güncellenemedi')
    }

    return response.json()
  }

  // Yeni tekrarlayan işlem ekle
  const addRecurringTransaction = async (transaction: Omit<RecurringTransaction, 'id' | 'createdAt' | 'lastProcessed'>) => {
    const response = await fetch('/api/recurring-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transaction)
    })

    if (!response.ok) {
      throw new Error('Tekrarlayan işlem eklenemedi')
    }

    const newTransaction = await response.json()
    setRecurringTransactions(prev => [...prev, newTransaction])
    
    // İlk işlemi hemen oluştur
    if (new Date(transaction.startDate) <= new Date()) {
      await createRecurringTransaction(newTransaction, new Date())
      await updateLastProcessedDate(newTransaction.id, new Date().toISOString())
    }

    return newTransaction
  }

  // Sayfa yüklendiğinde ve her dakikada tekrarlayan işlemleri kontrol et
  useEffect(() => {
    if (!userId) return

    // İlk kontrol
    processRecurringTransactions()

    // Her dakika kontrol et
    const interval = setInterval(processRecurringTransactions, 60000) // 1 dakika

    return () => clearInterval(interval)
  }, [userId])

  return {
    recurringTransactions,
    addRecurringTransaction,
    processRecurringTransactions
  }
}