'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Plus, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface RecurringTransaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  account: 'cash' | 'bank' | 'savings'
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  customFrequency?: string
  dayOfWeek?: number  // Haftalık için (1-7, 1=Pazartesi)
  startDate: string
  endDate?: string
  isActive: boolean
}

interface RecurringTransactionsListProps {
  recurringTransactions: RecurringTransaction[]
  setRecurringTransactions: React.Dispatch<React.SetStateAction<RecurringTransaction[]>>
  onEditRecurring: (recurring: RecurringTransaction) => void
}

export default function RecurringTransactionsList({ 
  recurringTransactions, 
  setRecurringTransactions, 
  onEditRecurring 
}: RecurringTransactionsListProps) {
  const { t } = useLanguage()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: 0,
    category: '',
    description: '',
    account: 'cash',
    frequency: 'monthly',
    customFrequency: '',
    dayOfWeek: 1, // Haftalık için (1-7, 1=Pazartesi)
    startDate: new Date().toISOString().split('T')[0],
    isActive: true
  })

  const frequencyOptions = [
    { value: 'daily', label: 'Günlük', icon: Calendar },
    { value: 'weekly', label: 'Haftalık', icon: Calendar },
    { value: 'monthly', label: 'Aylık', icon: Calendar },
    { value: 'yearly', label: 'Yıllık', icon: Calendar },
    { value: 'custom', label: 'Diğer', icon: Calendar }
  ]

  const getFrequencyLabel = (frequency: string) => {
    const option = frequencyOptions.find(opt => opt.value === frequency)
    return option?.label || frequency
  }

  const getNextOccurrence = (recurring: RecurringTransaction) => {
    if (!recurring.isActive) return null

    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    const currentDay = today.getDate()
    const currentWeekDay = today.getDay() // 0 = Pazar, 1 = Pazartesi

    let nextDate = new Date()

    switch (recurring.frequency) {
      case 'daily':
        nextDate = new Date(currentYear, currentMonth, currentDay + 1)
        break
      case 'weekly':
        if (recurring.dayOfWeek) {
          // JavaScript'te: 0=Pazar, 1=Pazartesi
          // Bizim sistemimizde: 1=Pazartesi, 7=Pazar
          const jsDayOfWeek = recurring.dayOfWeek === 7 ? 0 : recurring.dayOfWeek
          const daysUntilNext = (jsDayOfWeek - currentWeekDay + 7) % 7
          nextDate = new Date(currentYear, currentMonth, currentDay + daysUntilNext)
        }
        break
      case 'monthly':
        nextDate = new Date(currentYear, currentMonth + 1, currentDay)
        break
      case 'yearly':
        nextDate = new Date(currentYear + 1, currentMonth, currentDay)
        break
      case 'custom':
        // Özel periyot için bir sonraki tarihi hesaplamak karmaşık olabilir
        // Şimdilik bir ay sonraya ayarlayalım
        nextDate = new Date(currentYear, currentMonth + 1, currentDay)
        break
      default:
        return null
    }

    return nextDate
  }

  const addRecurringTransaction = () => {
    // Validasyon
    if (newTransaction.frequency === 'custom' && !newTransaction.customFrequency.trim()) {
      alert('Özel periyot seçildiğinde periyot açıklaması zorunludur.')
      return
    }

    const id = Date.now().toString()
    const newRecurring: RecurringTransaction = {
      ...newTransaction,
      id,
      startDate: new Date().toISOString().split('T')[0]
    }

    setRecurringTransactions(prev => [...prev, newRecurring])
    setShowAddDialog(false)
    setNewTransaction({
      type: 'expense',
      amount: 0,
      category: '',
      description: '',
      account: 'cash',
      frequency: 'monthly',
      customFrequency: '',
      dayOfWeek: 1,
      startDate: new Date().toISOString().split('T')[0],
      isActive: true
    })
  }

  const toggleRecurringTransaction = (id: string) => {
    setRecurringTransactions(prev => 
      prev.map(r => 
        r.id === id ? { ...r, isActive: !r.isActive } : r
      )
    )
  }

  const deleteRecurringTransaction = (id: string) => {
    if (confirm('Bu tekrarlayan işlemi silmek istediğinizden emin misiniz?')) {
      setRecurringTransactions(prev => prev.filter(r => r.id !== id))
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const formatFrequency = (recurring: RecurringTransaction) => {
    const labels = {
      daily: 'Günlük',
      monthly: 'Aylık',
      yearly: 'Yıllık',
      custom: recurring.customFrequency || 'Diğer'
    }
    return labels[recurring.frequency] || recurring.frequency
  }

  const activeTransactions = recurringTransactions.filter(r => r.isActive)
  const inactiveTransactions = recurringTransactions.filter(r => !r.isActive)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tekrarlayan İşlemler
        </h2>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni İşlem
        </Button>
      </div>

      {/* Add Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Yeni Tekrarlayan İşlem
              </h3>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setShowAddDialog(false)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    İşlem Tipi
                  </label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="expense">Gider</option>
                    <option value="income">Gelir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tutar
                  </label>
                  <input
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Örn: Kira, Faturalar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hesap
                  </label>
                  <select
                    value={newTransaction.account}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, account: e.target.value as 'cash' | 'bank' | 'savings' }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="cash">Nakit</option>
                    <option value="bank">Banka</option>
                    <option value="savings">Birikim</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sıklık
                  </label>
                  <select
                    value={newTransaction.frequency}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, frequency: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {frequencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={newTransaction.startDate}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {newTransaction.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Haftanın Günü
                  </label>
                  <select
                    value={newTransaction.dayOfWeek?.toString()}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="1">Pazartesi</option>
                    <option value="2">Salı</option>
                    <option value="3">Çarşamba</option>
                    <option value="4">Perşembe</option>
                    <option value="5">Cuma</option>
                    <option value="6">Cumartesi</option>
                    <option value="7">Pazar</option>
                  </select>
                </div>
              )}

              {newTransaction.frequency === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Özel Periyot
                  </label>
                  <input
                    type="text"
                    value={newTransaction.customFrequency}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, customFrequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Örn: 15 günde bir, 2 ayda bir"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="İşlem açıklaması..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={addRecurringTransaction}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Ekle
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
              >
                İptal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Transactions */}
      {activeTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Aktif Tekrarlayan İşlemler
            </CardTitle>
            <CardDescription>
              Aşağıdaki işlemler otomatik olarak tekrarlanmaktadır
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTransactions.map((recurring) => {
                const nextOccurrence = getNextOccurrence(recurring)
                return (
                  <div key={recurring.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          recurring.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {recurring.type === 'income' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {recurring.description || recurring.category}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {recurring.account} • {formatFrequency(recurring)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-gray-900 dark:text-white">
                          {formatAmount(recurring.amount)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {recurring.category}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {nextOccurrence ? (
                          <span>
                            {nextOccurrence.toLocaleDateString('tr-TR', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </span>
                        ) : (
                          <span>Belirlenmedi</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditRecurring(recurring)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleRecurringTransaction(recurring.id)}
                        >
                          <AlertCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRecurringTransaction(recurring.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inactive Transactions */}
      {inactiveTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-600" />
              Pasif Tekrarlayan İşlemler
            </CardTitle>
            <CardDescription>
              Bu işlemler şu anda devre dışı bırakılmış durumda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inactiveTransactions.map((recurring) => (
                <div key={recurring.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-100 dark:bg-gray-900 opacity-75">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        recurring.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {recurring.type === 'income' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">
                          {recurring.description || recurring.category}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                          {recurring.account} • {formatFrequency(recurring)} • Pasif
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-700 dark:text-gray-300">
                        {formatAmount(recurring.amount)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        {recurring.category}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditRecurring(recurring)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleRecurringTransaction(recurring.id)}
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRecurringTransaction(recurring.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {recurringTransactions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Tekrarlayan İşlem Bulunamadı
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Otomatik olarak tekrarlanmasını istediğiniz işlemleri buradan ekleyebilirsiniz.
            </p>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              İlk Tekrarlayan İşlemi Oluştur
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}