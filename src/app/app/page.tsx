'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, DollarSign, TrendingUp, TrendingDown, Plus, Wallet, PiggyBank, Building, BarChart3, Target, ArrowRightLeft, Clock, X } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { UserAuthButton } from '@/components/auth/UserAuthButton'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { dataSync } from '@/lib/data-sync'
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions'
import Link from 'next/link'
import InvestmentsSection from '@/components/InvestmentsSection'

interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  category: string
  description: string
  date: string
  account: 'cash' | 'bank' | 'savings'
}

interface AccountBalances {
  cash: number
  bank: number
  savings: number
}

export default function CepFinansApp() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { addRecurringTransaction: addRecurringTransactionAPI } = useRecurringTransactions(user?.id || '')
  const [balances, setBalances] = useState<AccountBalances>({ cash: 0, bank: 0, savings: 0 })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>('all')
  
  // Sekme yönetimi için yeni state
  const [activeTab, setActiveTab] = useState<'finance' | 'investments'>('finance')
  
  // Dialog state'leri
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [showRecurringTransaction, setShowRecurringTransaction] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  
  // Form state'leri
  const [newTransaction, setNewTransaction] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: 'Prim / Bonus',
    description: '',
    account: 'cash' as 'cash' | 'bank' | 'savings'
  })
  
  const [newTransfer, setNewTransfer] = useState({
    from: 'cash' as 'cash' | 'bank' | 'savings',
    to: 'bank' as 'cash' | 'bank' | 'savings',
    amount: '',
    description: ''
  })

  const [newRecurringTransaction, setNewRecurringTransaction] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: 'Prim / Bonus',
    description: '',
    account: 'cash' as 'cash' | 'bank' | 'savings',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true
  })

  // Verileri Supabase'den yükle
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        const balancesData = await dataSync.getBalances()
        const transactionsData = await dataSync.getTransactions()

        // Önce veritabanından bakiyeleri yükle
        if (balancesData) {
          setBalances(balancesData)
        } else {
          // Eğer veritabanında bakiye yoksa, işlemlere göre hesapla
          if (transactionsData && transactionsData.length > 0) {
            const calculatedBalances = { cash: 0, bank: 0, savings: 0 }
            
            transactionsData.forEach(transaction => {
              if (transaction.type === 'income') {
                calculatedBalances[transaction.account] += transaction.amount
              } else if (transaction.type === 'expense') {
                calculatedBalances[transaction.account] -= transaction.amount
              } else if (transaction.type === 'transfer' && transaction.transferFrom && transaction.transferTo) {
                calculatedBalances[transaction.transferFrom] -= transaction.amount
                calculatedBalances[transaction.transferTo] += transaction.amount
              }
            })
            
            setBalances(calculatedBalances)
            // Hesaplanan bakiyeleri veritabanına kaydet
            await dataSync.updateBalances(calculatedBalances)
          } else {
            // Hiç işlem yoksa varsayılan bakiyeler
            setBalances({ cash: 0, bank: 0, savings: 0 })
          }
        }
        
        if (transactionsData) {
          setTransactions(transactionsData)
        }
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // İşlem ekleme fonksiyonu
  const addTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description || !newTransaction.category) {
      alert('Lütfen tüm alanları doldurun')
      return
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: newTransaction.type,
      amount: parseFloat(newTransaction.amount),
      category: newTransaction.category,
      description: newTransaction.description,
      account: newTransaction.account,
      date: new Date().toISOString()
    }

    try {
      // Önce state'i güncelle
      setTransactions(prev => [transaction, ...prev])
      
      // Bakiyeleri güncelle
      const newBalances = { ...balances }
      if (transaction.type === 'income') {
        newBalances[transaction.account] += transaction.amount
      } else {
        newBalances[transaction.account] -= transaction.amount
      }
      setBalances(newBalances)
      
      // Supabase'e kaydet
      await dataSync.addTransaction(transaction)
      
      // Bakiyeleri de veritabanına kaydet
      await dataSync.updateBalances(newBalances)
      
      // Formu sıfırla ve dialogu kapat
      setNewTransaction({
        type: 'income',
        amount: '',
        category: 'Prim / Bonus',
        description: '',
        account: 'cash'
      })
      setShowAddTransaction(false)
      
    } catch (error) {
      console.error('İşlem eklenirken hata:', error)
      alert('İşlem eklenemedi. Lütfen tekrar deneyin.')
    }
  }

  // Tekrarlayan işlem ekleme fonksiyonu
  const addRecurringTransaction = async () => {
    if (!newRecurringTransaction.amount || !newRecurringTransaction.description || !newRecurringTransaction.category) {
      alert('Lütfen tüm alanları doldurun')
      return
    }

    if (!user?.id) {
      alert('Kullanıcı girişi gerekli')
      return
    }

    const recurringTransaction = {
      type: newRecurringTransaction.type,
      amount: parseFloat(newRecurringTransaction.amount),
      category: newRecurringTransaction.category,
      description: newRecurringTransaction.description,
      account: newRecurringTransaction.account,
      frequency: newRecurringTransaction.frequency,
      startDate: newRecurringTransaction.startDate,
      endDate: newRecurringTransaction.endDate || undefined,
      isActive: newRecurringTransaction.isActive,
      userId: user.id
    }

    try {
      // API ile tekrarlayan işlemi kaydet
      const response = await fetch('/api/recurring-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recurringTransaction)
      })

      if (!response.ok) {
        throw new Error('Tekrarlayan işlem eklenemedi')
      }

      const savedRecurring = await response.json()
      
      // İlk işlemi hemen oluştur (başlangıç tarihi bugün veya öncekiyse)
      const startDate = new Date(newRecurringTransaction.startDate)
      const today = new Date()
      
      if (startDate <= today) {
        const firstTransaction: Transaction = {
          id: `rec_${Date.now()}`,
          type: newRecurringTransaction.type,
          amount: parseFloat(newRecurringTransaction.amount),
          category: newRecurringTransaction.category,
          description: `${newRecurringTransaction.description} (Tekrarlayan)`,
          account: newRecurringTransaction.account,
          date: new Date().toISOString()
        }

        // İlk işlemi normal transaction olarak ekle
        setTransactions(prev => [firstTransaction, ...prev])
        
        // Bakiyeleri güncelle
        const newBalances = { ...balances }
        if (firstTransaction.type === 'income') {
          newBalances[firstTransaction.account] += firstTransaction.amount
        } else {
          newBalances[firstTransaction.account] -= firstTransaction.amount
        }
        setBalances(newBalances)
        
        // Veritabanına kaydet
        await dataSync.addTransaction(firstTransaction)
        await dataSync.updateBalances(newBalances)
        
        // Tekrarlayan işlemin son işlem tarihini güncelle
        await fetch('/api/recurring-transactions', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            recurringId: savedRecurring.id,
            lastProcessed: new Date().toISOString()
          })
        })
      }
      
      // Formu sıfırla ve dialogu kapat
      setNewRecurringTransaction({
        type: 'income',
        amount: '',
        category: 'Prim / Bonus',
        description: '',
        account: 'cash',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true
      })
      setShowRecurringTransaction(false)
      
      alert('Tekrarlayan işlem başarıyla oluşturuldu!')
      
    } catch (error) {
      console.error('Tekrarlayan işlem eklenirken hata:', error)
      alert('Tekrarlayan işlem eklenemedi. Lütfen tekrar deneyin.')
    }
  }
  const makeTransfer = async () => {
    if (!newTransfer.amount || !newTransfer.description) {
      alert('Lütfen tüm alanları doldurun')
      return
    }

    if (newTransfer.from === newTransfer.to) {
      alert('Kaynak ve hedef hesap aynı olamaz')
      return
    }

    const amount = parseFloat(newTransfer.amount)
    if (amount <= 0) {
      alert('Transfer tutarı 0\'dan büyük olmalıdır')
      return
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'transfer',
      amount: amount,
      category: 'Transfer',
      description: newTransfer.description,
      account: newTransfer.from,
      date: new Date().toISOString(),
      transferFrom: newTransfer.from,
      transferTo: newTransfer.to
    }

    try {
      // Önce state'i güncelle
      setTransactions(prev => [transaction, ...prev])
      
      // Bakiyeleri güncelle
      const newBalances = { ...balances }
      newBalances[newTransfer.from] -= amount
      newBalances[newTransfer.to] += amount
      setBalances(newBalances)
      
      // Supabase'e kaydet
      await dataSync.addTransaction(transaction)
      
      // Bakiyeleri de veritabanına kaydet
      await dataSync.updateBalances(newBalances)
      
      // Formu sıfırla ve dialogu kapat
      setNewTransfer({
        from: 'cash',
        to: 'bank',
        amount: '',
        description: ''
      })
      setShowTransferDialog(false)
      
    } catch (error) {
      console.error('Transfer yapılırken hata:', error)
      alert('Transfer yapılamadı. Lütfen tekrar deneyin.')
    }
  }

  // Bakiye hesaplamaları
  const totalBalance = (balances?.cash || 0) + (balances?.bank || 0) + (balances?.savings || 0)
  const filteredTransactions = selectedDate === 'all' 
    ? transactions 
    : transactions.filter(t => t.date.startsWith(selectedDate))
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const netAmount = totalIncome - totalExpense

  // Son işlemleri ve değişimleri hesapla
  const recentTransactions = filteredTransactions.slice(0, 5)
  const cashTransactions = filteredTransactions.filter(t => t.account === 'cash').slice(0, 3)
  const bankTransactions = filteredTransactions.filter(t => t.account === 'bank').slice(0, 3)

  // Kullanıcı giriş yapmamışsa yükleme göster
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Kullanıcı giriş yapmamışsa giriş formu göster
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">CepFinans</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Kişisel finans yönetim uygulamanıza hoş geldiniz
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <UserAuthButton onAuthClick={() => {}} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto p-4 md:p-6 pb-32">
        {/* Header */}
        <header className="mb-8 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-80 transition-opacity duration-200">
              <img
                src="/favicon.png"
                alt="CepFinans"
                className="w-10 h-10 rounded-lg"
              />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                CepFinans
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Kişisel Finans Yönetimi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <UserAuthButton onAuthClick={() => {}} />
          </div>
        </header>

        {/* Sekme Navigasyonu */}
        <div className="mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1">
            <Button
              variant={activeTab === 'finance' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('finance')}
              className={`px-6 py-2 font-medium transition-all duration-300 ${
                activeTab === 'finance' 
                  ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <TrendingUp className="mr-2 w-4 h-4" />
              Finans
            </Button>
            <Button
              variant={activeTab === 'investments' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('investments')}
              className={`px-6 py-2 font-medium transition-all duration-300 ${
                activeTab === 'investments' 
                  ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <BarChart3 className="mr-2 w-4 h-4" />
              Yatırımlar
            </Button>
          </div>
        </div>

        {activeTab === 'finance' ? (
          // Finans Sekmesi İçeriği
          <div>
            {/* Bakiye Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className={`${
                cashTransactions.length > 0 && cashTransactions.some(t => t.type === 'income') ? 'bg-green-100 dark:bg-green-900/30' :
                cashTransactions.length > 0 && cashTransactions.some(t => t.type === 'expense') ? 'bg-red-100 dark:bg-red-900/30' :
                'bg-green-50 dark:bg-green-900/20'
              } border-green-200 dark:border-green-800 transition-all duration-300`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Nakit
                    {cashTransactions.length > 0 && (
                      <span className="ml-2 text-sm">
                        {cashTransactions.filter(t => t.type === 'income').length} gelir / {cashTransactions.filter(t => t.type === 'expense').length} gider
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    ₺{(balances?.cash || 0).toFixed(2)}
                  </div>
                  {cashTransactions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {cashTransactions.slice(0, 3).map((transaction, index) => (
                        <div key={transaction.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400 truncate">
                            {transaction.description}
                          </span>
                          <span className={`font-medium ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}₺{transaction.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={`${
                bankTransactions.length > 0 && bankTransactions.some(t => t.type === 'income') ? 'bg-blue-100 dark:bg-blue-900/30' :
                bankTransactions.length > 0 && bankTransactions.some(t => t.type === 'expense') ? 'bg-red-100 dark:bg-red-900/30' :
                'bg-blue-50 dark:bg-blue-900/20'
              } border-blue-200 dark:border-blue-800 transition-all duration-300`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Banka
                    {bankTransactions.length > 0 && (
                      <span className="ml-2 text-sm">
                        {bankTransactions.filter(t => t.type === 'income').length} gelir / {bankTransactions.filter(t => t.type === 'expense').length} gider
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    ₺{(balances?.bank || 0).toFixed(2)}
                  </div>
                  {bankTransactions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {bankTransactions.slice(0, 3).map((transaction, index) => (
                        <div key={transaction.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400 truncate">
                            {transaction.description}
                          </span>
                          <span className={`font-medium ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}₺{transaction.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-purple-800 dark:text-purple-200 flex items-center gap-2">
                    <PiggyBank className="h-5 w-5" />
                    Birikim
                    {balances?.savings && balances?.savings > 0 && (
                      <span className="ml-2 text-sm text-purple-600 dark:text-purple-400">
                        +₺{balances.savings.toFixed(2)}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    ₺{(balances?.savings || 0).toFixed(2)}
                  </div>
                  {balances?.savings && balances?.savings > 0 && (
                    <div className="mt-2 text-sm text-purple-600 dark:text-purple-400">
                      Toplam Birikim
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Toplam Bakiye ve İstatistikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="bg-white dark:bg-gray-800 shadow-sm border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Toplam Bakiye
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    ₺{totalBalance.toFixed(2)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Toplam Gelir</span>
                      <div className="text-lg font-semibold text-green-600">+₺{totalIncome.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Toplam Gider</span>
                      <div className="text-lg font-semibold text-red-600">-₺{totalExpense.toFixed(2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 shadow-sm border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Net Tutar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold mb-4 ${
                    netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {netAmount >= 0 ? '+' : ''}₺{netAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {netAmount >= 0 ? 'Pozitif bakiye' : 'Negatif bakiye'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hızlı İşlemler */}
            <div className="flex flex-wrap gap-4 mb-8">
              <Button 
                onClick={() => setShowAddTransaction(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                İşlem Ekle
              </Button>
              <Button 
                onClick={() => setShowRecurringTransaction(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Clock className="mr-2 h-4 w-4" />
                Tekrarlayan İşlem
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowTransferDialog(true)}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Transfer
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowStatsDialog(true)}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                İstatistikler
              </Button>
            </div>

            {/* Tarih Filtresi */}
            <div className="mb-6">
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-full md:w-64">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tarih Seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İşlemler</SelectItem>
                  {Array.from(new Set(transactions.map(t => t.date.split('T')[0])))
                    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                    .slice(0, 30)
                    .map(date => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString('tr-TR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* İşlem Listesi */}
            <Card className="bg-white dark:bg-gray-800 shadow-sm border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Son İşlemler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredTransactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Henüz işlem bulunmuyor</p>
                  ) : (
                    filteredTransactions.slice(0, 10).map(transaction => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900' :
                              transaction.type === 'expense' ? 'bg-red-100 dark:bg-red-900' :
                              'bg-blue-100 dark:bg-blue-900'
                            }`}>
                              {transaction.type === 'income' && <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />}
                              {transaction.type === 'expense' && <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />}
                              {transaction.type === 'transfer' && <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {transaction.description}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {transaction.category} • {transaction.account}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(transaction.date).toLocaleString('tr-TR')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' :
                            transaction.type === 'expense' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {transaction.type === 'income' && '+'}
                            {transaction.type === 'expense' && '-'}
                            ₺{transaction.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Yatırımlar Sekmesi İçeriği
          <InvestmentsSection />
        )}
      </div>

      {/* İşlem Ekleme Dialog */}
      {showAddTransaction && (
        <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Yeni İşlem Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">İşlem Türü</label>
                  <Select value={newTransaction.type} onValueChange={(value: 'income' | 'expense') => setNewTransaction(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Gelir</SelectItem>
                      <SelectItem value="expense">Gider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Hesap</label>
                  <Select value={newTransaction.account} onValueChange={(value: 'cash' | 'bank' | 'savings') => setNewTransaction(prev => ({ ...prev, account: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Nakit</SelectItem>
                      <SelectItem value="bank">Banka</SelectItem>
                      <SelectItem value="savings">Birikim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Tutar</label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Kategori</label>
                <Select
                  value={newTransaction.category}
                  onValueChange={(value) => setNewTransaction(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {newTransaction.type === 'income' ? (
                      <>
                        <SelectItem value="Prim / Bonus">Prim / Bonus</SelectItem>
                        <SelectItem value="Telif Geliri">Telif Geliri</SelectItem>
                        <SelectItem value="Kripto / Döviz Kazancı">Kripto / Döviz Kazancı</SelectItem>
                        <SelectItem value="Satış Geliri">Satış Geliri</SelectItem>
                        <SelectItem value="Hediye / Bağış">Hediye / Bağış</SelectItem>
                        <SelectItem value="Proje Geliri">Proje Geliri</SelectItem>
                        <SelectItem value="Miras / Tazminat">Miras / Tazminat</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Market">Market</SelectItem>
                        <SelectItem value="Fatura">Fatura</SelectItem>
                        <SelectItem value="Ulaşım">Ulaşım</SelectItem>
                        <SelectItem value="Eğlence">Eğlence</SelectItem>
                        <SelectItem value="Sağlık">Sağlık</SelectItem>
                        <SelectItem value="Eğitim">Eğitim</SelectItem>
                        <SelectItem value="Giyim">Giyim</SelectItem>
                        <SelectItem value="Restoran">Restoran</SelectItem>
                        <SelectItem value="Diğer">Diğer</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Açıklama</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="İşlem açıklaması..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddTransaction(false)}>
                  İptal
                </Button>
                <Button onClick={addTransaction} className="bg-green-600 hover:bg-green-700">
                  Ekle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Transfer Dialog */}
      {showTransferDialog && (
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Hesaplar Arası Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Kaynak Hesap</label>
                  <Select value={newTransfer.from} onValueChange={(value: 'cash' | 'bank' | 'savings') => setNewTransfer(prev => ({ ...prev, from: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Nakit</SelectItem>
                      <SelectItem value="bank">Banka</SelectItem>
                      <SelectItem value="savings">Birikim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Hedef Hesap</label>
                  <Select value={newTransfer.to} onValueChange={(value: 'cash' | 'bank' | 'savings') => setNewTransfer(prev => ({ ...prev, to: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Nakit</SelectItem>
                      <SelectItem value="bank">Banka</SelectItem>
                      <SelectItem value="savings">Birikim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Tutar</label>
                <input
                  type="number"
                  value={newTransfer.amount}
                  onChange={(e) => setNewTransfer(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Açıklama</label>
                <input
                  type="text"
                  value={newTransfer.description}
                  onChange={(e) => setNewTransfer(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Transfer açıklaması..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                  İptal
                </Button>
                <Button onClick={makeTransfer} className="bg-green-600 hover:bg-green-700">
                  Transfer Yap
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* İstatistikler Dialog */}
      {showStatsDialog && (
        <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Finansal İstatistikler</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    ₺{totalIncome.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Toplam Gelir
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                    ₺{totalExpense.toFixed(2)}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">
                    Toplam Gider
                  </div>
                </div>
              </div>
              
              <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className={`text-3xl font-bold ${
                  netAmount >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {netAmount >= 0 ? '+' : ''}₺{netAmount.toFixed(2)}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Net Durum
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {filteredTransactions.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Toplam İşlem
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    ₺{totalBalance.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Toplam Bakiye
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {netAmount >= 0 ? '+' : '-'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Trend
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => setShowStatsDialog(false)}>
                  Kapat
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Tekrarlayan İşlem Dialog */}
      {showRecurringTransaction && (
        <Dialog open={showRecurringTransaction} onOpenChange={setShowRecurringTransaction}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Yeni Tekrarlayan İşlem</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">İşlem Tipi</label>
                  <Select
                    value={newRecurringTransaction.type}
                    onValueChange={(value: 'income' | 'expense') => setNewRecurringTransaction(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Gelir</SelectItem>
                      <SelectItem value="expense">Gider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Hesap</label>
                  <Select
                    value={newRecurringTransaction.account}
                    onValueChange={(value: 'cash' | 'bank' | 'savings') => setNewRecurringTransaction(prev => ({ ...prev, account: value }))}
                  >
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Nakit</SelectItem>
                      <SelectItem value="bank">Banka</SelectItem>
                      <SelectItem value="savings">Birikim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tutar</label>
                  <input
                    type="number"
                    value={newRecurringTransaction.amount}
                    onChange={(e) => setNewRecurringTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Kategori</label>
                  <Select
                    value={newRecurringTransaction.category}
                    onValueChange={(value) => setNewRecurringTransaction(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {newRecurringTransaction.type === 'income' ? (
                        <>
                          <SelectItem value="Prim / Bonus">Prim / Bonus</SelectItem>
                          <SelectItem value="Telif Geliri">Telif Geliri</SelectItem>
                          <SelectItem value="Kripto / Döviz Kazancı">Kripto / Döviz Kazancı</SelectItem>
                          <SelectItem value="Satış Geliri">Satış Geliri</SelectItem>
                          <SelectItem value="Hediye / Bağış">Hediye / Bağış</SelectItem>
                          <SelectItem value="Proje Geliri">Proje Geliri</SelectItem>
                          <SelectItem value="Miras / Tazminat">Miras / Tazminat</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Market">Market</SelectItem>
                          <SelectItem value="Fatura">Fatura</SelectItem>
                          <SelectItem value="Ulaşım">Ulaşım</SelectItem>
                          <SelectItem value="Eğlence">Eğlence</SelectItem>
                          <SelectItem value="Sağlık">Sağlık</SelectItem>
                          <SelectItem value="Eğitim">Eğitim</SelectItem>
                          <SelectItem value="Giyim">Giyim</SelectItem>
                          <SelectItem value="Restoran">Restoran</SelectItem>
                          <SelectItem value="Diğer">Diğer</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tekrar Sıklığı</label>
                  <Select
                    value={newRecurringTransaction.frequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => setNewRecurringTransaction(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Günlük</SelectItem>
                      <SelectItem value="weekly">Haftalık</SelectItem>
                      <SelectItem value="monthly">Aylık</SelectItem>
                      <SelectItem value="yearly">Yıllık</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={newRecurringTransaction.startDate}
                    onChange={(e) => setNewRecurringTransaction(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Bitiş Tarihi (Opsiyonel)</label>
                <input
                  type="date"
                  value={newRecurringTransaction.endDate}
                  onChange={(e) => setNewRecurringTransaction(prev => ({ ...prev, endDate: e.target.value }))}
                  placeholder="Bitiş tarihi yoksa boş bırakın"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Açıklama</label>
                <input
                  type="text"
                  value={newRecurringTransaction.description}
                  onChange={(e) => setNewRecurringTransaction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Örn: Aylık maaş, kira ödemesi..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setShowRecurringTransaction(false)}>
                  İptal
                </Button>
                <Button onClick={addRecurringTransaction} className="bg-blue-600 hover:bg-blue-700">
                  Tekrarlayan İşlem Oluştur
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}