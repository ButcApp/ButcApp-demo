'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, TrendingDown, Plus, DollarSign, Coins, Bitcoin, ArrowUpDown, Calculator, Calendar, RefreshCw, Eye, Home, ArrowLeft, Table as TableIcon } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { dataSync } from '@/lib/data-sync'
import Link from 'next/link'

interface ExchangeRate {
  code: string
  name: string
  buyRate: number
  sellRate: number
  flag: string
  lastUpdate: string
}

interface CurrencyInvestment {
  id: string
  currency: string
  currencyCode: string
  buyDate: string
  buyAmount: number
  buyRate: number
  currentRate: number
  totalValue: number
  profit: number
  profitPercentage: number
  buyAmountTL: number // Alım tutarı TL (o günkü kur ile)
  currentValueTL: number // Güncel değer TL (bugünkü kur ile)
  historicalRateUsed?: boolean // Geçmiş kur kullanıldı mı?
  actualBuyDate?: string // Gerçek kullanılan tarih
  dateComparison?: {
    oldRate: number
    newRate: number
    rateDifference: number
    rateDifferencePercent: number
  }
}

interface MetalInvestment {
  id: string
  metal: string
  metalCode: string
  buyDate: string
  buyAmount: number
  buyPrice: number
  currentPrice: number
  totalValue: number
  profit: number
  profitPercentage: number
}

interface CryptoInvestment {
  id: string
  crypto: string
  cryptoCode: string
  buyDate: string
  buyAmount: number
  buyPrice: number
  currentPrice: number
  totalValue: number
  profit: number
  profitPercentage: number
}

export default function InvestmentsPage() {
  const { t } = useLanguage()
  const [currencyInvestments, setCurrencyInvestments] = useState<CurrencyInvestment[]>([])
  const [metalInvestments, setMetalInvestments] = useState<MetalInvestment[]>([])
  const [cryptoInvestments, setCryptoInvestments] = useState<CryptoInvestment[]>([])
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [loadingRates, setLoadingRates] = useState(false)
  const [loadingHistorical, setLoadingHistorical] = useState(false)
  const [historicalRates, setHistoricalRates] = useState<ExchangeRate[]>([])
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'error', message: string } | null>(null)
  
  const [showAddCurrency, setShowAddCurrency] = useState(false)
  const [showAddMetal, setShowAddMetal] = useState(false)
  const [showAddCrypto, setShowAddCrypto] = useState(false)
  const [showQuickInvest, setShowQuickInvest] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<ExchangeRate | null>(null)
  
  // Form states for currency
  const [currencyForm, setCurrencyForm] = useState({
    currency: '',
    currencyCode: '',
    buyDate: '',
    buyAmount: '',
    buyRate: ''
  })
  
  // Form states for metal
  const [metalForm, setMetalForm] = useState({
    metal: '',
    metalCode: '',
    buyDate: '',
    buyAmount: '',
    buyPrice: ''
  })
  
  // Form states for crypto
  const [cryptoForm, setCryptoForm] = useState({
    crypto: '',
    cryptoCode: '',
    buyDate: '',
    buyAmount: '',
    buyPrice: ''
  })

  // Quick investment form
  const [quickInvestForm, setQuickInvestForm] = useState({
    buyDate: '',
    buyAmount: '',
    buyRate: '' // Geçmiş kur için eklendi
  })
  
  // Hızlı yatırım için geçmiş kurlar
  const [quickHistoricalRates, setQuickHistoricalRates] = useState<ExchangeRate[]>([])
  const [loadingQuickHistorical, setLoadingQuickHistorical] = useState(false)

  const metals = [
    { name: 'Altın', code: 'XAU' },
    { name: 'Gümüş', code: 'XAG' },
    { name: 'Platin', code: 'XPT' },
    { name: 'Paladyum', code: 'XPD' }
  ]

  const cryptos = [
    { name: 'Bitcoin', code: 'BTC' },
    { name: 'Ethereum', code: 'ETH' },
    { name: 'Binance Coin', code: 'BNB' },
    { name: 'Cardano', code: 'ADA' },
    { name: 'Solana', code: 'SOL' },
    { name: 'Ripple', code: 'XRP' },
    { name: 'Dogecoin', code: 'DOGE' },
    { name: 'Polkadot', code: 'DOT' }
  ]

  // Döviz kurlarını çek
  useEffect(() => {
    fetchExchangeRates()
    // Döviz yatırımlarını Supabase'den yükle
    loadCurrencyInvestments()
  }, [])

  // Döviz yatırımlarını Supabase'den yükle
  const loadCurrencyInvestments = async () => {
    try {
      const investments = await dataSync.getCurrencyInvestments()
      console.log('Loaded currency investments from Supabase:', investments)
      setCurrencyInvestments(investments)
    } catch (error) {
      console.error('Döviz yatırımları yüklenirken hata:', error)
    }
  }

  const fetchExchangeRates = async () => {
    setLoadingRates(true)
    try {
      const response = await fetch('/api/exchange-rates')
      const data = await response.json()
      
      if (data.success) {
        setExchangeRates(data.data)
        
        // Mevcut yatırımların kar/zararını güncelle
        updateInvestmentsWithCurrentRates(data.data)
      }
    } catch (error) {
      console.error('Döviz kurları çekilemedi:', error)
    } finally {
      setLoadingRates(false)
    }
  }

  const fetchHistoricalRates = async (date: string, currencyCode: string) => {
    console.log('🔍 FETCHING HISTORICAL RATES:')
    console.log('- Date:', date)
    console.log('- Currency:', currencyCode)
    
    setLoadingHistorical(true)
    try {
      const response = await fetch(`/api/historical-rates?date=${date}&currency=${currencyCode}`)
      const data = await response.json()
      
      console.log('📡 API Response:', data)
      
      if (data.success && data.data.length > 0) {
        const rate = data.data[0]
        console.log('✅ Historical rate found:', rate)
        setHistoricalRates(data.data)
        
        // Formdaki alım kuru alanını otomatik doldur
        setCurrencyForm(prev => {
          const updated = {
            ...prev,
            buyRate: rate.sellRate.toString()
          }
          console.log('📝 Form updated with historical rate:', updated)
          return updated
        })
        
        // Kullanıcıyı bilgilendir - isteğe göre özel mesaj
        if (data.isPreviousDay) {
          console.log('⚠️ Previous day rate used')
          setNotification({
            type: 'warning',
            message: data.message || `Seçilen tarihte kur yok, ${data.actualDate} tarihinin kuru kullanıldı.`
          })
        } else {
          console.log('✅ Exact date rate found')
          setNotification({
            type: 'success',
            message: `${date} tarihli TCMB kuru başarıyla bulundu: ${rate.sellRate.toFixed(4)} TRY`
          })
        }
      } else {
        console.log('❌ No historical rates found')
        setNotification({
          type: 'error',
          message: data.error || 'Belirtilen tarihte veya önceki iş günlerinde kur bulunamadı. Lütfen farklı bir tarih deneyin.'
        })
      }
    } catch (error) {
      console.error('💥 Geçmiş kurlar çekilemedi:', error)
      setNotification({
        type: 'error',
        message: 'Kurlar alınırken hata oluştu'
      })
    } finally {
      setLoadingHistorical(false)
      
      // Bildirimi 7 saniye sonra kaldır
      setTimeout(() => setNotification(null), 7000)
    }
  }

  const fetchQuickHistoricalRates = async (date: string, currencyCode: string) => {
    console.log('🔍 QUICK INVESTMENT - FETCHING HISTORICAL RATES:')
    console.log('- Date:', date)
    console.log('- Currency:', currencyCode)
    
    setLoadingQuickHistorical(true)
    try {
      const response = await fetch(`/api/historical-rates?date=${date}&currency=${currencyCode}`)
      const data = await response.json()
      
      console.log('📡 Quick Investment API Response:', data)
      
      if (data.success && data.data.length > 0) {
        const rate = data.data[0]
        console.log('✅ Quick Investment historical rate found:', rate)
        setQuickHistoricalRates(data.data)
        
        // Formdaki alım kuru alanını otomatik doldur
        setQuickInvestForm(prev => {
          const updated = {
            ...prev,
            buyRate: rate.sellRate.toString()
          }
          console.log('📝 Quick Investment form updated with historical rate:', updated)
          return updated
        })
        
        // Kullanıcıyı bilgilendir
        if (data.isPreviousDay) {
          console.log('⚠️ Quick Investment previous day rate used')
          setNotification({
            type: 'warning',
            message: data.message || `Hızlı yatırım: Seçilen tarihte kur yok, ${data.actualDate} tarihinin kuru kullanıldı.`
          })
        } else {
          console.log('✅ Quick Investment exact date rate found')
          setNotification({
            type: 'success',
            message: `Hızlı yatırım: ${date} tarihli TCMB kuru başarıyla bulundu: ${rate.sellRate.toFixed(4)} TRY`
          })
        }
      } else {
        console.log('❌ Quick Investment no historical rates found')
        setNotification({
          type: 'error',
          message: data.error || 'Hızlı yatırım: Belirtilen tarihte veya önceki iş günlerinde kur bulunamadı. Lütfen farklı bir tarih deneyin.'
        })
      }
    } catch (error) {
      console.error('💥 Quick Investment geçmiş kurlar çekilemedi:', error)
      setNotification({
        type: 'error',
        message: 'Hızlı yatırım: Kurlar alınırken hata oluştu'
      })
    } finally {
      setLoadingQuickHistorical(false)
      
      // Bildirimi 7 saniye sonra kaldır
      setTimeout(() => setNotification(null), 7000)
    }
  }

  const updateInvestmentsWithCurrentRates = (currentRates: ExchangeRate[]) => {
    // Döviz yatırımlarını güncelle
    setCurrencyInvestments(prev => prev.map(investment => {
      const currentRate = currentRates.find(r => r.code === investment.currencyCode)?.sellRate || investment.currentRate
      
      // İstenen hesaplama formülü:
      // Alım Tutarı (TL) = Alım Miktarı × Alım Tarihi Kuru (o günkü kur)
      const buyAmountTL = investment.buyAmount * investment.buyRate
      
      // Güncel Değer (TL) = Alım Miktarı × Bugünkü Kur
      const currentValueTL = investment.buyAmount * currentRate
      
      // Kar/Zarar (TL) = Güncel Değer − Alım Tutarı
      const profit = currentValueTL - buyAmountTL
      
      // Kar/Zarar (%) = (Kar/Zarar / Alım Tutarı) × 100
      const profitPercentage = buyAmountTL > 0 ? (profit / buyAmountTL) * 100 : 0

      // Kur karşılaştırma bilgileri
      const rateDifference = currentRate - investment.buyRate
      const rateDifferencePercent = investment.buyRate > 0 ? (rateDifference / investment.buyRate) * 100 : 0

      return {
        ...investment,
        currentRate,
        totalValue: currentValueTL,
        profit,
        profitPercentage,
        buyAmountTL,
        currentValueTL,
        dateComparison: {
          oldRate: investment.buyRate,
          newRate: currentRate,
          rateDifference,
          rateDifferencePercent
        }
      }
    }))
  }

  const addCurrencyInvestment = async () => {
    console.log('=== FORM SUBMISSION DEBUG ===')
    console.log('Form data:', currencyForm)
    console.log('Historical rates available:', historicalRates.length > 0)
    if (historicalRates.length > 0) {
      console.log('Historical rate data:', historicalRates[0])
    }
    console.log('Current exchange rates:', exchangeRates.find(r => r.code === currencyForm.currencyCode))
    
    if (!currencyForm.currency || !currencyForm.buyDate || !currencyForm.buyAmount || !currencyForm.buyRate) {
      console.log('❌ Form validation failed - missing fields')
      setNotification({
        type: 'error',
        message: 'Lütfen tüm alanları doldurun: Döviz türü, alım tarihi, miktar ve kur.'
      })
      return
    }

    // Eğer tarih seçiliyse ama tarihsel kur bulunamadıysa uyar
    if (currencyForm.buyDate && historicalRates.length === 0) {
      console.log('❌ Historical rate validation failed')
      setNotification({
        type: 'error',
        message: 'Seçilen tarihte kur bulunamadı. Lütfen "Kur Getir" butonuna basarak kur bulmayı deneyin veya farklı bir tarih seçin.'
      })
      return
    }

    const buyAmount = parseFloat(currencyForm.buyAmount)
    const buyRate = parseFloat(currencyForm.buyRate)
    const currentRate = exchangeRates.find(r => r.code === currencyForm.currencyCode)?.sellRate || buyRate
    
    console.log('💰 CALCULATION DEBUG - IMPORTANT:')
    console.log('- Buy Amount:', buyAmount)
    console.log('- Buy Rate (HISTORICAL TCMB):', buyRate)
    console.log('- Current Rate (TODAY):', currentRate)
    console.log('- Buy Date:', currencyForm.buyDate)
    console.log('🚨 CRITICAL RULE: Buy amount TL calculation uses ONLY historical rate!')
    
    // İstenen hesaplama formülü:
    // Alım Tutarı (TL) = Alım Miktarı × Alım Tarihi Kuru (SADECE tarihsel kur)
    const buyAmountTL = buyAmount * buyRate
    
    // Güncel Değer (TL) = Alım Miktarı × Bugünkü Kur (SADECE karşılaştırma için)
    const currentValueTL = buyAmount * currentRate
    
    // Kar/Zarar (TL) = Güncel Değer − Alım Tutarı
    const profit = currentValueTL - buyAmountTL
    
    // Kar/Zarar (%) = (Kar/Zarar / Alım Tutarı) × 100
    const profitPercentage = buyAmountTL > 0 ? (profit / buyAmountTL) * 100 : 0

    console.log('📊 CALCULATION RESULTS:')
    console.log('- Buy Amount TL (HISTORICAL ONLY):', buyAmountTL)
    console.log('- Current Value TL (TODAY RATE):', currentValueTL)
    console.log('- Profit TL:', profit)
    console.log('- Profit %:', profitPercentage)
    console.log('✅ Verification: Buy amount calculated with historical rate only!')

    // Kur karşılaştırma bilgileri
    const rateDifference = currentRate - buyRate
    const rateDifferencePercent = buyRate > 0 ? (rateDifference / buyRate) * 100 : 0
    
    const newInvestment: CurrencyInvestment = {
      id: Date.now().toString(),
      currency: currencyForm.currency,
      currencyCode: currencyForm.currencyCode,
      buyDate: currencyForm.buyDate,
      buyAmount,
      buyRate,
      currentRate,
      totalValue: currentValueTL,
      profit,
      profitPercentage,
      buyAmountTL,
      currentValueTL,
      historicalRateUsed: historicalRates.length > 0,
      actualBuyDate: historicalRates.length > 0 ? historicalRates[0]?.date : currencyForm.buyDate,
      dateComparison: {
        oldRate: buyRate,
        newRate: currentRate,
        rateDifference,
        rateDifferencePercent
      }
    }

    console.log('✅ Investment created:', newInvestment)
    console.log('=== END DEBUG ===')

    // Supabase'e kaydet
    try {
      const success = await dataSync.addCurrencyInvestment(newInvestment)
      if (success) {
        console.log('✅ Currency investment saved to Supabase')
        setCurrencyInvestments(prev => [newInvestment, ...prev])
        
        // Formu temizle
        setCurrencyForm({
          currency: '',
          currencyCode: '',
          buyDate: '',
          buyAmount: '',
          buyRate: ''
        })
        setHistoricalRates([])
        setShowAddCurrency(false)

        // Kullanıcıyı bilgilendir
        if (rateDifference !== 0) {
          setNotification({
            type: rateDifference > 0 ? 'success' : 'warning',
            message: `${currencyForm.currencyCode} kur farkı: ${rateDifference > 0 ? '+' : ''}${formatNumber(rateDifferencePercent)}% (${rateDifference > 0 ? 'artış' : 'düşüş'})`
          })
        }
      } else {
        console.log('❌ Failed to save currency investment to Supabase')
        setNotification({
          type: 'error',
          message: 'Döviz yatırımı kaydedilirken hata oluştu. Lütfen tekrar deneyin.'
        })
      }
    } catch (error) {
      console.error('❌ Error saving currency investment:', error)
      setNotification({
        type: 'error',
        message: 'Döviz yatırımı kaydedilirken hata oluştu. Lütfen tekrar deneyin.'
      })
    }
  }

  const addQuickInvestment = async () => {
    console.log('=== QUICK INVESTMENT SUBMISSION DEBUG ===')
    console.log('Selected currency:', selectedCurrency)
    console.log('Quick form data:', quickInvestForm)
    console.log('Quick historical rates available:', quickHistoricalRates.length > 0)
    
    if (!selectedCurrency || !quickInvestForm.buyDate || !quickInvestForm.buyAmount) {
      console.log('❌ Quick Investment validation failed - missing fields')
      setNotification({
        type: 'error',
        message: 'Lütfen tüm alanları doldurun: Tarih, miktar.'
      })
      return
    }

    // Eğer tarih seçiliyse ama tarihsel kur bulunamadıysa uyar
    if (quickInvestForm.buyDate && quickHistoricalRates.length === 0) {
      console.log('❌ Quick Investment historical rate validation failed')
      setNotification({
        type: 'error',
        message: 'Hızlı yatırım: Seçilen tarihte kur bulunamadı. Lütfen "Kur Getir" butonuna basarak kur bulmayı deneyin veya farklı bir tarih seçin.'
      })
      return
    }

    const buyAmount = parseFloat(quickInvestForm.buyAmount)
    const buyRate = parseFloat(quickInvestForm.buyRate) || selectedCurrency.sellRate
    const currentRate = exchangeRates.find(r => r.code === selectedCurrency.code)?.sellRate || buyRate
    
    console.log('💰 QUICK INVESTMENT CALCULATION DEBUG:')
    console.log('- Buy Amount:', buyAmount)
    console.log('- Buy Rate (HISTORICAL TCMB):', buyRate)
    console.log('- Current Rate (TODAY):', currentRate)
    console.log('- Buy Date:', quickInvestForm.buyDate)
    console.log('🚨 CRITICAL RULE: Quick investment buy amount uses ONLY historical rate!')
    
    // İstenen hesaplama formülü:
    // Alım Tutarı (TL) = Alım Miktarı × Alım Tarihi Kuru (SADECE tarihsel kur)
    const buyAmountTL = buyAmount * buyRate
    
    // Güncel Değer (TL) = Alım Miktarı × Bugünkü Kur (SADECE karşılaştırma için)
    const currentValueTL = buyAmount * currentRate
    
    // Kar/Zarar (TL) = Güncel Değer − Alım Tutarı
    const profit = currentValueTL - buyAmountTL
    
    // Kar/Zarar (%) = (Kar/Zarar / Alım Tutarı) × 100
    const profitPercentage = buyAmountTL > 0 ? (profit / buyAmountTL) * 100 : 0

    console.log('📊 QUICK INVESTMENT RESULTS:')
    console.log('- Buy Amount TL (HISTORICAL ONLY):', buyAmountTL)
    console.log('- Current Value TL (TODAY RATE):', currentValueTL)
    console.log('- Profit TL:', profit)
    console.log('- Profit %:', profitPercentage)
    console.log('✅ Quick Investment Verification: Buy amount calculated with historical rate only!')

    // Kur karşılaştırma bilgileri
    const rateDifference = currentRate - buyRate
    const rateDifferencePercent = buyRate > 0 ? (rateDifference / buyRate) * 100 : 0
    
    const newInvestment: CurrencyInvestment = {
      id: Date.now().toString(),
      currency: selectedCurrency.name,
      currencyCode: selectedCurrency.code,
      buyDate: quickInvestForm.buyDate,
      buyAmount,
      buyRate,
      currentRate,
      totalValue: currentValueTL,
      profit,
      profitPercentage,
      buyAmountTL,
      currentValueTL,
      historicalRateUsed: quickHistoricalRates.length > 0,
      actualBuyDate: quickHistoricalRates.length > 0 ? quickHistoricalRates[0]?.date : quickInvestForm.buyDate,
      dateComparison: {
        oldRate: buyRate,
        newRate: currentRate,
        rateDifference,
        rateDifferencePercent
      }
    }

    console.log('✅ Quick Investment created:', newInvestment)
    console.log('=== END QUICK DEBUG ===')

    // Supabase'e kaydet
    try {
      const success = await dataSync.addCurrencyInvestment(newInvestment)
      if (success) {
        console.log('✅ Quick investment saved to Supabase')
        setCurrencyInvestments(prev => [newInvestment, ...prev])
        
        // Formu temizle
        setQuickInvestForm({
          buyDate: '',
          buyAmount: '',
          buyRate: ''
        })
        setQuickHistoricalRates([])
        setSelectedCurrency(null)
        setShowQuickInvest(false)

        // Kullanıcıyı bilgilendir
        const rateDiff = currentRate - buyRate
        const rateDiffPercent = buyRate > 0 ? (rateDiff / buyRate) * 100 : 0
        if (rateDiff !== 0) {
          setNotification({
            type: rateDiff > 0 ? 'success' : 'warning',
            message: `Hızlı yatırım: ${selectedCurrency.code} kur farkı: ${rateDiff > 0 ? '+' : ''}${formatNumber(rateDiffPercent)}% (${rateDiff > 0 ? 'artış' : 'düşüş'})`
          })
        }
      } else {
        console.log('❌ Failed to save quick investment to Supabase')
        setNotification({
          type: 'error',
          message: 'Hızlı döviz yatırımı kaydedilirken hata oluştu. Lütfen tekrar deneyin.'
        })
      }
    } catch (error) {
      console.error('❌ Error saving quick investment:', error)
      setNotification({
        type: 'error',
        message: 'Hızlı döviz yatırımı kaydedilirken hata oluştu. Lütfen tekrar deneyin.'
      })
    }
  }

  const addMetalInvestment = () => {
    if (!metalForm.metal || !metalForm.buyDate || !metalForm.buyAmount || !metalForm.buyPrice) {
      return
    }

    const buyAmount = parseFloat(metalForm.buyAmount)
    const buyPrice = parseFloat(metalForm.buyPrice)
    const currentPrice = buyPrice * 1.08 // Simüle edilmiş mevcut fiyat (%8 artış)
    
    const newInvestment: MetalInvestment = {
      id: Date.now().toString(),
      metal: metalForm.metal,
      metalCode: metalForm.metalCode,
      buyDate: metalForm.buyDate,
      buyAmount,
      buyPrice,
      currentPrice,
      totalValue: buyAmount * currentPrice,
      profit: (currentPrice - buyPrice) * buyAmount,
      profitPercentage: ((currentPrice - buyPrice) / buyPrice) * 100
    }

    setMetalInvestments(prev => [newInvestment, ...prev])
    setMetalForm({
      metal: '',
      metalCode: '',
      buyDate: '',
      buyAmount: '',
      buyPrice: ''
    })
    setShowAddMetal(false)
  }

  const addCryptoInvestment = () => {
    if (!cryptoForm.crypto || !cryptoForm.buyDate || !cryptoForm.buyAmount || !cryptoForm.buyPrice) {
      return
    }

    const buyAmount = parseFloat(cryptoForm.buyAmount)
    const buyPrice = parseFloat(cryptoForm.buyPrice)
    const currentPrice = buyPrice * 1.12 // Simüle edilmiş mevcut fiyat (%12 artış)
    
    const newInvestment: CryptoInvestment = {
      id: Date.now().toString(),
      crypto: cryptoForm.crypto,
      cryptoCode: cryptoForm.cryptoCode,
      buyDate: cryptoForm.buyDate,
      buyAmount,
      buyPrice,
      currentPrice,
      totalValue: buyAmount * currentPrice,
      profit: (currentPrice - buyPrice) * buyAmount,
      profitPercentage: ((currentPrice - buyPrice) / buyPrice) * 100
    }

    setCryptoInvestments(prev => [newInvestment, ...prev])
    setCryptoForm({
      crypto: '',
      cryptoCode: '',
      buyDate: '',
      buyAmount: '',
      buyPrice: ''
    })
    setShowAddCrypto(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const deleteInvestment = async (type: 'currency' | 'metal' | 'crypto', id: string) => {
    try {
      if (type === 'currency') {
        // Supabase'den sil
        const success = await dataSync.deleteCurrencyInvestment(id)
        if (success) {
          setCurrencyInvestments(prev => prev.filter(inv => inv.id !== id))
          console.log('✅ Currency investment deleted from Supabase')
        } else {
          console.log('❌ Failed to delete currency investment from Supabase')
          setNotification({
            type: 'error',
            message: 'Döviz yatırımı silinirken hata oluştu. Lütfen tekrar deneyin.'
          })
        }
      } else if (type === 'metal') {
        // Metal yatırımları henüz Supabase'e entegre değil, sadece state'den sil
        setMetalInvestments(prev => prev.filter(inv => inv.id !== id))
      } else if (type === 'crypto') {
        // Kripto yatırımları henüz Supabase'e entegre değil, sadece state'den sil
        setCryptoInvestments(prev => prev.filter(inv => inv.id !== id))
      }
    } catch (error) {
      console.error('❌ Error deleting investment:', error)
      setNotification({
        type: 'error',
        message: 'Yatırım silinirken hata oluştu. Lütfen tekrar deneyin.'
      })
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Bildirimler */}
      {notification && (
        <Alert className={`${
          notification.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' :
          notification.type === 'warning' ? 'border-yellow-200 bg-yellow-50 text-yellow-800' :
          'border-red-200 bg-red-50 text-red-800'
        }`}>
          <AlertDescription>
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/app">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <Home className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">Ana Sayfa</span>
              <span className="sm:hidden">Dön</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Yatırımlarım</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Yatırım portföyünüzü takip edin</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="currency" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="currency" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Döviz
          </TabsTrigger>
          <TabsTrigger value="metal" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Maden
          </TabsTrigger>
          <TabsTrigger value="crypto" className="flex items-center gap-2">
            <Bitcoin className="h-4 w-4" />
            Kripto
          </TabsTrigger>
        </TabsList>

        {/* Döviz Yatırımları */}
        <TabsContent value="currency" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Döviz Yatırımları</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={fetchExchangeRates}
                disabled={loadingRates}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingRates ? 'animate-spin' : ''}`} />
                Kurları Güncelle
              </Button>
              <Dialog open={showAddCurrency} onOpenChange={setShowAddCurrency}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Manuel Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Döviz Yatırımı Ekle</DialogTitle>
                    <DialogDescription>
                      Aldığınız döviz bilgilerini manuel girin
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currency">Döviz Türü</Label>
                      <Select 
                        value={currencyForm.currencyCode} 
                        onValueChange={(value) => {
                          console.log('🪙 Currency changed to:', value)
                          const selected = exchangeRates.find(c => c.code === value)
                          const newForm = {
                            ...currencyForm,
                            currency: selected?.name || '',
                            currencyCode: value,
                            buyRate: selected?.sellRate.toString() || ''
                          }
                          console.log('📝 Form updated:', newForm)
                          setCurrencyForm(newForm)
                          
                          // Temizle - yeni para birimi için geçmiş kurları temizle
                          setHistoricalRates([])
                          
                          // Eğer tarih zaten seçiliyse, yeni para birimi için geçmiş kuru çek
                          if (currencyForm.buyDate) {
                            console.log('🔄 Auto-fetching for new currency...')
                            fetchHistoricalRates(currencyForm.buyDate, value)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Döviz seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {exchangeRates.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.flag} {currency.name} ({currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="buyDate">Alım Tarihi</Label>
                      <div className="flex gap-2">
                        <Input
                          id="buyDate"
                          type="date"
                          value={currencyForm.buyDate}
                          onChange={(e) => {
                            const newDate = e.target.value
                            console.log('📅 Date changed to:', newDate)
                            setCurrencyForm(prev => ({ ...prev, buyDate: newDate }))
                            
                            // Tarih ve döviz seçiliyse geçmiş kuru çek
                            if (newDate && currencyForm.currencyCode) {
                              console.log('🔄 Auto-fetching historical rates...')
                              fetchHistoricalRates(newDate, currencyForm.currencyCode)
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!currencyForm.buyDate || !currencyForm.currencyCode || loadingHistorical}
                          onClick={() => {
                            if (currencyForm.buyDate && currencyForm.currencyCode) {
                              console.log('🔄 Manual fetch historical rates...')
                              fetchHistoricalRates(currencyForm.buyDate, currencyForm.currencyCode)
                            }
                          }}
                        >
                          {loadingHistorical ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Calendar className="h-4 w-4" />
                          )}
                          Kur Getir
                        </Button>
                      </div>
                      {currencyForm.buyDate && (
                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                          {historicalRates.length > 0 ? (
                            <>
                              <span className="text-green-600 font-medium">
                                ✅ {currencyForm.buyDate} tarihli TCMB kuru kullanılıyor
                              </span>
                              {historicalRates[0]?.date && historicalRates[0].date !== currencyForm.buyDate && (
                                <>
                                  <br />
                                  <span className="text-orange-600">
                                    📅 Gerçek kullanılan tarih: {historicalRates[0].date}
                                  </span>
                                </>
                              )}
                            </>
                          ) : (
                            <span className="text-orange-600">
                              ⚠️ Tarihe ait kur bulunamadı, manuel giriniz veya "Kur Getir" butonuna basınız
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="buyAmount">Alım Miktarı</Label>
                      <Input
                        id="buyAmount"
                        type="number"
                        step="0.01"
                        placeholder="1000"
                        value={currencyForm.buyAmount}
                        onChange={(e) => setCurrencyForm(prev => ({ ...prev, buyAmount: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyRate">Alım Kuru (TRY)</Label>
                      <Input
                        id="buyRate"
                        type="number"
                        step="0.0001"
                        placeholder="32.50"
                        value={currencyForm.buyRate}
                        onChange={(e) => {
                          console.log('💰 Buy rate changed to:', e.target.value)
                          setCurrencyForm(prev => ({ ...prev, buyRate: e.target.value }))
                        }}
                        disabled={historicalRates.length > 0}
                        className={historicalRates.length > 0 ? 'bg-green-50 border-green-200' : ''}
                        title={historicalRates.length > 0 ? 'Geçmiş TCMB kuru kullanılıyor' : 'Manuel giriş veya TCMB kuru bekleniyor'}
                      />
                      <div className="text-xs text-muted-foreground mt-1 space-y-1">
                        {historicalRates.length > 0 ? (
                          <>
                            <span className="text-green-600 font-medium">
                              📊 {historicalRates[0]?.date || currencyForm.buyDate} TCMB Kuru: {parseFloat(currencyForm.buyRate).toFixed(4)}
                            </span>
                            <br />
                            <span className="text-blue-600">
                              💎 Bu kur ile alım yapılacak (tarihsel kur)
                            </span>
                            {historicalRates[0]?.date && historicalRates[0].date !== currencyForm.buyDate && (
                              <>
                                <br />
                                <span className="text-orange-600">
                                  ⚠️ İstenen tarih: {currencyForm.buyDate}, Kullanılan tarih: {historicalRates[0].date}
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-orange-600">
                            ⚠️ {currencyForm.buyDate ? 'Tarihe ait kur bulunamadı' : 'Tarih seçiniz'}
                          </span>
                        )}
                        
                        {currencyForm.buyRate && (
                          <>
                            <span className="text-gray-600">
                              📝 Alım Tutarı: {currencyForm.buyAmount || '0'} × {currencyForm.buyRate} = {((parseFloat(currencyForm.buyAmount) || 0) * parseFloat(currencyForm.buyRate) || 0).toFixed(2)} TL
                            </span>
                            <br />
                            <span className="text-red-600 font-medium">
                              🚨 ÖNEMLİ: Alım tutarı SADECE tarihsel kura göre hesaplanır!
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={addCurrencyInvestment} 
                      className="w-full"
                      disabled={currencyForm.buyDate && historicalRates.length === 0}
                    >
                      {currencyForm.buyDate && historicalRates.length === 0 ? (
                        <>
                          ⚠️ Önce Kur Bulunmalı
                        </>
                      ) : (
                        <>
                          Yatırımı Ekle
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Mevcut Döviz Kurları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Güncel Döviz Kurları
              </CardTitle>
              <CardDescription>
                TCMB'den güncellenen döviz kurları. Hızlı yatırım eklemek için döviz seçin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRates ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Kurlar yükleniyor...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {exchangeRates.map((rate) => (
                    <Card key={rate.code} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{rate.flag}</span>
                            <div>
                              <p className="font-semibold">{rate.code}</p>
                              <p className="text-sm text-muted-foreground">{rate.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(rate.sellRate)}</p>
                            <p className="text-xs text-muted-foreground">Alış: {formatCurrency(rate.buyRate)}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={() => {
                            setSelectedCurrency(rate)
                            setQuickInvestForm(prev => ({ ...prev, buyDate: new Date().toISOString().split('T')[0] }))
                            setShowQuickInvest(true)
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Hızlı Yatırım
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hızlı Yatırım Dialog */}
          <Dialog open={showQuickInvest} onOpenChange={setShowQuickInvest}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedCurrency?.flag} {selectedCurrency?.name} Hızlı Yatırım
                </DialogTitle>
                <DialogDescription>
                  {quickHistoricalRates.length > 0 ? 'Geçmiş kurdan hızlı yatırım ekleyin' : 'Mevcut kurdan hızlı yatırım ekleyin'}
                </DialogDescription>
              </DialogHeader>
              {selectedCurrency && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Mevcut Kur</p>
                      <p className="font-semibold">{formatCurrency(selectedCurrency.sellRate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kod</p>
                      <p className="font-semibold">{selectedCurrency.code}</p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="quickBuyDate">Alım Tarihi</Label>
                    <div className="flex gap-2">
                      <Input
                        id="quickBuyDate"
                        type="date"
                        value={quickInvestForm.buyDate}
                        onChange={(e) => {
                          const newDate = e.target.value
                          console.log('📅 Quick Investment date changed to:', newDate)
                          setQuickInvestForm(prev => ({ ...prev, buyDate: newDate }))
                          
                          // Tarih seçiliyse geçmiş kuru çek
                          if (newDate && selectedCurrency.code) {
                            console.log('🔄 Quick Investment auto-fetching historical rates...')
                            fetchQuickHistoricalRates(newDate, selectedCurrency.code)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!quickInvestForm.buyDate || !selectedCurrency.code || loadingQuickHistorical}
                        onClick={() => {
                          if (quickInvestForm.buyDate && selectedCurrency.code) {
                            console.log('🔄 Quick Investment manual fetch historical rates...')
                            fetchQuickHistoricalRates(quickInvestForm.buyDate, selectedCurrency.code)
                          }
                        }}
                      >
                        {loadingQuickHistorical ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Calendar className="h-4 w-4" />
                        )}
                        Kur Getir
                      </Button>
                    </div>
                    {quickInvestForm.buyDate && (
                      <div className="text-xs text-muted-foreground mt-1 space-y-1">
                        {quickHistoricalRates.length > 0 ? (
                          <>
                            <span className="text-green-600 font-medium">
                              ✅ {quickInvestForm.buyDate} tarihli TCMB kuru kullanılıyor
                            </span>
                            {quickHistoricalRates[0]?.date && quickHistoricalRates[0].date !== quickInvestForm.buyDate && (
                              <>
                                <br />
                                <span className="text-orange-600">
                                  📅 Gerçek kullanılan tarih: {quickHistoricalRates[0].date}
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-orange-600">
                            ⚠️ Tarihe ait kur bulunamadı, manuel giriniz veya "Kur Getir" butonuna basınız
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="quickBuyAmount">Alım Miktarı ({selectedCurrency.code})</Label>
                    <Input
                      id="quickBuyAmount"
                      type="number"
                      step="0.01"
                      placeholder="100"
                      value={quickInvestForm.buyAmount}
                      onChange={(e) => setQuickInvestForm(prev => ({ ...prev, buyAmount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quickBuyRate">Alım Kuru (TRY)</Label>
                    <Input
                      id="quickBuyRate"
                      type="number"
                      step="0.0001"
                      placeholder="32.50"
                      value={quickInvestForm.buyRate}
                      onChange={(e) => {
                        console.log('💰 Quick Investment buy rate changed to:', e.target.value)
                        setQuickInvestForm(prev => ({ ...prev, buyRate: e.target.value }))
                      }}
                      disabled={quickHistoricalRates.length > 0}
                      className={quickHistoricalRates.length > 0 ? 'bg-green-50 border-green-200' : ''}
                      title={quickHistoricalRates.length > 0 ? 'Geçmiş TCMB kuru kullanılıyor' : 'Manuel giriş veya TCMB kuru bekleniyor'}
                    />
                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                      {quickHistoricalRates.length > 0 ? (
                        <>
                          <span className="text-green-600 font-medium">
                            📊 {quickHistoricalRates[0]?.date || quickInvestForm.buyDate} TCMB Kuru: {parseFloat(quickInvestForm.buyRate).toFixed(4)}
                          </span>
                          <br />
                          <span className="text-blue-600">
                            💎 Bu kur ile alım yapılacak (tarihsel kur)
                          </span>
                          {quickHistoricalRates[0]?.date && quickHistoricalRates[0].date !== quickInvestForm.buyDate && (
                            <>
                              <br />
                              <span className="text-orange-600">
                                ⚠️ İstenen tarih: {quickInvestForm.buyDate}, Kullanılan tarih: {quickHistoricalRates[0].date}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <span className="text-orange-600">
                          ⚠️ {quickInvestForm.buyDate ? 'Tarihe ait kur bulunamadı' : 'Tarih seçiniz'}
                        </span>
                      )}
                      
                      {quickInvestForm.buyRate && (
                        <>
                          <span className="text-gray-600">
                            📝 Alım Tutarı: {quickInvestForm.buyAmount || '0'} × {quickInvestForm.buyRate} = {((parseFloat(quickInvestForm.buyAmount) || 0) * parseFloat(quickInvestForm.buyRate) || 0).toFixed(2)} TL
                          </span>
                          <br />
                          <span className="text-red-600 font-medium">
                            🚨 ÖNEMLİ: Alım tutarı SADECE tarihsel kura göre hesaplanır!
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={addQuickInvestment} 
                    className="w-full"
                    disabled={quickInvestForm.buyDate && quickHistoricalRates.length === 0}
                  >
                    {quickInvestForm.buyDate && quickHistoricalRates.length === 0 ? (
                      <>
                        ⚠️ Önce Kur Bulunmalı
                      </>
                    ) : (
                      <>
                        Hızlı Yatırımı Ekle
                      </>
                    )}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Mevcut Yatırımlar */}
          <div className="space-y-4">
            {currencyInvestments.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Henüz döviz yatırımı eklenmedi</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TableIcon className="h-5 w-5" />
                    Döviz Yatırımları Tablosu
                  </CardTitle>
                  <CardDescription>
                    TCMB güncel kurlarına göre kar/zarar durumu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Döviz Türü</TableHead>
                          <TableHead className="text-right min-w-[100px]">Alım Tarihi</TableHead>
                          <TableHead className="text-right min-w-[120px]">Kullanılan Kur Tarihi</TableHead>
                          <TableHead className="text-right min-w-[100px]">Alım Kuru</TableHead>
                          <TableHead className="text-right min-w-[100px]">Güncel Kur</TableHead>
                          <TableHead className="text-right min-w-[120px]">Alınan Miktar</TableHead>
                          <TableHead className="text-right min-w-[120px]">Alım Tutarı (TL)</TableHead>
                          <TableHead className="text-right min-w-[120px]">Güncel Değer (TL)</TableHead>
                          <TableHead className="text-right min-w-[120px]">Kar/Zarar (TL)</TableHead>
                          <TableHead className="text-right min-w-[100px]">Kar/Zarar (%)</TableHead>
                          <TableHead className="text-center min-w-[80px]">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currencyInvestments.map((investment) => (
                          <TableRow key={investment.id}>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{investment.currency}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {investment.currencyCode}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Alım: {new Date(investment.buyDate).toLocaleDateString('tr-TR')}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {new Date(investment.buyDate).toLocaleDateString('tr-TR')}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              <div className="flex flex-col">
                                <span>{investment.actualBuyDate ? new Date(investment.actualBuyDate).toLocaleDateString('tr-TR') : new Date(investment.buyDate).toLocaleDateString('tr-TR')}</span>
                                {investment.historicalRateUsed ? (
                                  <span className="text-xs text-green-600">
                                    📅 TCMB Kuru
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500">
                                    📝 Manuel
                                  </span>
                                )}
                                {investment.actualBuyDate && investment.actualBuyDate !== investment.buyDate && (
                                  <span className="text-xs text-orange-600">
                                    ⚠️ Farklı tarih
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(investment.buyRate)}
                              {investment.dateComparison && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {investment.dateComparison.rateDifference > 0 ? (
                                    <span className="text-green-600">+{formatNumber(investment.dateComparison.rateDifferencePercent)}%</span>
                                  ) : (
                                    <span className="text-red-600">{formatNumber(investment.dateComparison.rateDifferencePercent)}%</span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(investment.currentRate)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col">
                                <span className="font-medium">{formatNumber(investment.buyAmount)}</span>
                                <span className="text-xs text-muted-foreground">{investment.currencyCode}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(investment.buyAmountTL || (investment.buyAmount * investment.buyRate))}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(investment.currentValueTL || investment.totalValue)}
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${investment.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <div className="flex items-center justify-end gap-1">
                                {investment.profit >= 0 ? (
                                  <TrendingUp className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 flex-shrink-0" />
                                )}
                                <span>{formatCurrency(investment.profit)}</span>
                              </div>
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${investment.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <Badge 
                                variant={investment.profit >= 0 ? "default" : "destructive"}
                                className="font-semibold whitespace-nowrap"
                              >
                                {investment.profit >= 0 ? '+' : ''}{formatNumber(investment.profitPercentage)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => deleteInvestment('currency', investment.id)}
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
                              >
                                Sil
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Özet Bilgiler */}
                  <div className="mt-6 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-muted-foreground">Toplam Yatırım</p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(
                            currencyInvestments.reduce((sum, inv) => sum + (inv.buyRate * inv.buyAmount), 0)
                          )}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-muted-foreground">Güncel Değer</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(
                            currencyInvestments.reduce((sum, inv) => sum + inv.totalValue, 0)
                          )}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-muted-foreground">Toplam Kar/Zarar</p>
                        <p className={`text-xl font-bold ${
                          currencyInvestments.reduce((sum, inv) => sum + inv.profit, 0) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {formatCurrency(
                            currencyInvestments.reduce((sum, inv) => sum + inv.profit, 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Maden Yatırımları */}
        <TabsContent value="metal" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Maden Yatırımları</h2>
            <Dialog open={showAddMetal} onOpenChange={setShowAddMetal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Maden Ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Maden Yatırımı Ekle</DialogTitle>
                  <DialogDescription>
                    Aldığınız maden bilgilerini girin
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="metal">Maden Türü</Label>
                    <Select 
                      value={metalForm.metalCode} 
                      onValueChange={(value) => {
                        const selected = metals.find(m => m.code === value)
                        setMetalForm(prev => ({
                          ...prev,
                          metal: selected?.name || '',
                          metalCode: value
                        }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Maden seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {metals.map((metal) => (
                          <SelectItem key={metal.code} value={metal.code}>
                            {metal.name} ({metal.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="buyDate">Alım Tarihi</Label>
                    <Input
                      id="buyDate"
                      type="date"
                      value={metalForm.buyDate}
                      onChange={(e) => setMetalForm(prev => ({ ...prev, buyDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyAmount">Alım Miktarı (gr)</Label>
                    <Input
                      id="buyAmount"
                      type="number"
                      step="0.01"
                      placeholder="10"
                      value={metalForm.buyAmount}
                      onChange={(e) => setMetalForm(prev => ({ ...prev, buyAmount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyPrice">Alım Fiyatı (TRY/gr)</Label>
                    <Input
                      id="buyPrice"
                      type="number"
                      step="0.01"
                      placeholder="1850.00"
                      value={metalForm.buyPrice}
                      onChange={(e) => setMetalForm(prev => ({ ...prev, buyPrice: e.target.value }))}
                    />
                  </div>
                  <Button onClick={addMetalInvestment} className="w-full">
                    Ekle
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {metalInvestments.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Henüz maden yatırımı eklenmedi</p>
                </CardContent>
              </Card>
            ) : (
              metalInvestments.map((investment) => (
                <Card key={investment.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg">{investment.metal}</CardTitle>
                      <CardDescription>
                        Alım: {new Date(investment.buyDate).toLocaleDateString('tr-TR')}
                      </CardDescription>
                    </div>
                    <Badge variant={investment.profit >= 0 ? "default" : "destructive"}>
                      {investment.profit >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {formatNumber(investment.profitPercentage)}%
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Miktar</p>
                        <p className="font-semibold">{formatNumber(investment.buyAmount)} gr</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Alım Fiyatı</p>
                        <p className="font-semibold">{formatCurrency(investment.buyPrice)}/gr</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mevcut Fiyat</p>
                        <p className="font-semibold">{formatCurrency(investment.currentPrice)}/gr</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Kar/Zarar</p>
                        <p className={`font-semibold ${investment.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(investment.profit)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Toplam Değer</p>
                          <p className="text-lg font-bold">{formatCurrency(investment.totalValue)}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteInvestment('metal', investment.id)}
                        >
                          Sil
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Kripto Yatırımları */}
        <TabsContent value="crypto" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Kripto Yatırımları</h2>
            <Dialog open={showAddCrypto} onOpenChange={setShowAddCrypto}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kripto Ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Kripto Yatırımı Ekle</DialogTitle>
                  <DialogDescription>
                    Aldığınız kripto para bilgilerini girin
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="crypto">Kripto Para</Label>
                    <Select 
                      value={cryptoForm.cryptoCode} 
                      onValueChange={(value) => {
                        const selected = cryptos.find(c => c.code === value)
                        setCryptoForm(prev => ({
                          ...prev,
                          crypto: selected?.name || '',
                          cryptoCode: value
                        }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kripto para seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {cryptos.map((crypto) => (
                          <SelectItem key={crypto.code} value={crypto.code}>
                            {crypto.name} ({crypto.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="buyDate">Alım Tarihi</Label>
                    <Input
                      id="buyDate"
                      type="date"
                      value={cryptoForm.buyDate}
                      onChange={(e) => setCryptoForm(prev => ({ ...prev, buyDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyAmount">Alım Miktarı</Label>
                    <Input
                      id="buyAmount"
                      type="number"
                      step="0.00000001"
                      placeholder="0.1"
                      value={cryptoForm.buyAmount}
                      onChange={(e) => setCryptoForm(prev => ({ ...prev, buyAmount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyPrice">Alım Fiyatı (TRY)</Label>
                    <Input
                      id="buyPrice"
                      type="number"
                      step="0.01"
                      placeholder="850000"
                      value={cryptoForm.buyPrice}
                      onChange={(e) => setCryptoForm(prev => ({ ...prev, buyPrice: e.target.value }))}
                    />
                  </div>
                  <Button onClick={addCryptoInvestment} className="w-full">
                    Ekle
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {cryptoInvestments.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Henüz kripto yatırımı eklenmedi</p>
                </CardContent>
              </Card>
            ) : (
              cryptoInvestments.map((investment) => (
                <Card key={investment.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg">{investment.crypto}</CardTitle>
                      <CardDescription>
                        Alım: {new Date(investment.buyDate).toLocaleDateString('tr-TR')}
                      </CardDescription>
                    </div>
                    <Badge variant={investment.profit >= 0 ? "default" : "destructive"}>
                      {investment.profit >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {formatNumber(investment.profitPercentage)}%
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Miktar</p>
                        <p className="font-semibold">{formatNumber(investment.buyAmount)} {investment.cryptoCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Alım Fiyatı</p>
                        <p className="font-semibold">{formatCurrency(investment.buyPrice)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mevcut Fiyat</p>
                        <p className="font-semibold">{formatCurrency(investment.currentPrice)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Kar/Zarar</p>
                        <p className={`font-semibold ${investment.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(investment.profit)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Toplam Değer</p>
                          <p className="text-lg font-bold">{formatCurrency(investment.totalValue)}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteInvestment('crypto', investment.id)}
                        >
                          Sil
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}