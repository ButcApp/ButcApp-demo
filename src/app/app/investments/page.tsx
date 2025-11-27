'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, TrendingDown, DollarSign, Bitcoin, Gem, ArrowUpRight, ArrowDownRight, Activity, BarChart3, RefreshCw, Clock, Star, AlertCircle, Plus, Calendar, Zap, Target, Wallet, PieChart as PieChartIcon, TrendingUp as TrendingUpIcon, Trash2 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { UserAuthButton } from '@/components/auth/UserAuthButton'
import { PieChart } from '@/components/charts/PieChart'
import { ProfitChart } from '@/components/charts/ProfitChart'
import { SummaryStatistics } from '@/components/SummaryStatistics'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { calculateInvestmentProfit, calculateTotalProfit, formatProfitDetails } from '@/lib/investment-calculator'
import Link from 'next/link'

interface CurrencyItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: string
  marketCap?: string
  icon: React.ReactNode
  forexBuying?: number
  forexSelling?: number
}

interface CryptoItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: string
  marketCap: string
  icon: React.ReactNode
}

interface CommodityItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  unit: string
  icon: React.ReactNode
}

interface Investment {
  id: string
  user_id: string
  currency: string
  currency_name: string
  amount: number
  buy_price: number
  buy_date: string
  current_value: number
  profit: number
  profit_percent: number
  created_at: string
  updated_at: string
}

interface InvestmentFormData {
  currency: string
  currencyName: string
  amount: number
  date: string
}

export default function InvestmentsPage() {
  const { t } = useLanguage()
  const [selectedTab, setSelectedTab] = useState('currency')
  const [currencyData, setCurrencyData] = useState<CurrencyItem[]>([])
  const [displayedCurrencies, setDisplayedCurrencies] = useState<CurrencyItem[]>([])
  const [isLoadingCurrency, setIsLoadingCurrency] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [visibleCount, setVisibleCount] = useState(8)
  const [hasMore, setHasMore] = useState(true)
  
  // User state
  const [user, setUser] = useState<any>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  
  // Investment states
  const [showInvestmentDialog, setShowInvestmentDialog] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyItem | CryptoItem | null>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(false)
  const [investmentForm, setInvestmentForm] = useState<InvestmentFormData>({
    currency: '',
    currencyName: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  })
  const [isCreatingInvestment, setIsCreatingInvestment] = useState(false)
  const [historicalPrice, setHistoricalPrice] = useState<number | null>(null)
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)
  
  // Statistics states
  const [showStatisticsDialog, setShowStatisticsDialog] = useState(false)
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'profit'>('pie')
  const [selectedCurrencyForChart, setSelectedCurrencyForChart] = useState<string>('all')
  
  // Delete states
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [investmentToDelete, setInvestmentToDelete] = useState<string | null>(null)
  
  // Manual crypto investment states
  const [showManualCryptoDialog, setShowManualCryptoDialog] = useState(false)
  const [manualCryptoForm, setManualCryptoForm] = useState({
    coin: '',
    coinName: '',
    buyPrice: 0,
    amount: 0,
    buyDate: new Date().toISOString().split('T')[0],
    currentPrice: 0
  })
  const [isCreatingManualCrypto, setIsCreatingManualCrypto] = useState(false)
  
  // Crypto states
  const [cryptoData, setCryptoData] = useState<CryptoItem[]>([])
  const [displayedCryptos, setDisplayedCryptos] = useState<CryptoItem[]>([])
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(false)
  const [cryptoLastUpdated, setCryptoLastUpdated] = useState<Date | null>(null)
  const [cryptoVisibleCount, setCryptoVisibleCount] = useState(8)
  const [cryptoHasMore, setCryptoHasMore] = useState(true)
  
  // Investment filter states
  const [investmentFilter, setInvestmentFilter] = useState<'all' | 'currency' | 'crypto' | 'commodity'>('all')

  // Helper function to determine investment category
  const getInvestmentCategory = (currency: string): 'currency' | 'crypto' | 'commodity' => {
    // Check if it's a cryptocurrency
    const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'AVAX', 'USDT', 'USDC', 'BUSD', 'SHIB', 'LTC', 'LINK', 'UNI', 'ATOM', 'XLM', 'VET']
    if (cryptoSymbols.includes(currency)) {
      return 'crypto'
    }
    
    // Check if it's a commodity
    const commoditySymbols = ['XAU', 'XAG', 'XPT', 'XPD', 'ALTIN', 'GÜMÜŞ', 'PLATİN', 'PALADYUM']
    if (commoditySymbols.includes(currency)) {
      return 'commodity'
    }
    
    // Default to currency
    return 'currency'
  }

  // Filter investments based on selected category and current tab
  const getFilteredInvestments = () => {
    let filtered = investments
    
    // Filter by category if not "all"
    if (investmentFilter !== 'all') {
      filtered = investments.filter(investment => 
        getInvestmentCategory(investment.currency) === investmentFilter
      )
    }
    
    return filtered
  }

  // Check user authentication
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        console.log('User data from Supabase:', user)
        
        if (user) {
          console.log('User ID:', user.id)
          console.log('User ID type:', typeof user.id)
          // Fetch user's investments
          fetchInvestments(user.id)
        } else {
          console.log('No user found')
          setInvestments([])
        }
      } catch (error) {
        console.error('User check error:', error)
      } finally {
        setIsLoadingUser(false)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', { event: _event, session: session?.user?.id })
      setUser(session?.user || null)
      if (session?.user) {
        console.log('Fetching investments for user:', session.user.id)
        fetchInvestments(session.user.id)
      } else {
        console.log('No session, clearing investments')
        setInvestments([])
      }
      setIsLoadingUser(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch investments from Supabase
  const fetchInvestments = async (userId: string) => {
    setIsLoadingInvestments(true)
    try {
      console.log('Fetching investments for userId:', userId)
      
      // Fetch both investments and current currency rates
      const [investmentsResponse, currencyResponse, cryptoResponse] = await Promise.all([
        fetch(`/api/investments?userId=${userId}`),
        fetch('/api/currency'),
        fetch('/api/crypto')
      ])
      
      const investmentsResult = await investmentsResponse.json()
      const currencyResult = await currencyResponse.json()
      const cryptoResult = await cryptoResponse.json()
      
      console.log('Investments API response:', investmentsResult)
      console.log('Currency API response:', currencyResult)
      console.log('Crypto API response:', cryptoResult)
      
      if (investmentsResult.success) {
        let investmentsData = investmentsResult.data || []
        
        // Create current prices map
        const currentPrices: Record<string, number> = {}
        
        // Add currency prices
        if (currencyResult.success && currencyResult.data) {
          currencyResult.data.forEach((item: any) => {
            // Extract currency code from symbol (USD from USD/TRY, EUR from EUR/TRY, etc.)
            const currencyCode = item.symbol.split('/')[0]
            if (currencyCode) {
              currentPrices[item.symbol] = item.price // Use full symbol as key
              console.log(`Mapped currency ${item.symbol}: ${item.price}`)
            }
          })
        }
        
        // Add crypto prices
        if (cryptoResult.success && cryptoResult.data) {
          cryptoResult.data.forEach((item: any) => {
            currentPrices[item.symbol] = item.price // Use crypto symbol as key
            console.log(`Mapped crypto ${item.symbol}: ${item.price}`)
          })
        }
        
        console.log('Current prices map:', currentPrices)
        console.log('Investments before update:', investmentsData)
        
        // Update investments with current values and profit calculations
        investmentsData = investmentsData.map((investment: any) => {
          const currentPrice = currentPrices[investment.currency] || investment.buy_price
          console.log(`Processing investment ${investment.currency}:`, {
            currentPrice,
            investmentCurrency: investment.currency,
            buyPrice: investment.buy_price,
            amount: investment.amount,
            hasCurrentPrice: !!currentPrices[investment.currency]
          })
          
          const calculation = calculateInvestmentProfit(investment, currentPrice)
          console.log(`Calculation result for ${investment.currency}:`, calculation)
          
          // Veri tutarsızlığı kontrolü - API'den gelen mevcut değer ile DB'deki alış fiyatı arasındaki mantıksızlığı
          const priceDifference = Math.abs(currentPrice - investment.buy_price)
          const priceDifferencePercent = investment.buy_price > 0 ? (priceDifference / investment.buy_price) * 100 : 0
          
          // Eğer fiyat farkı %20'den fazlaysa, potansiyel veri tutarsızlığı uyarısı
          if (priceDifferencePercent > 20) {
            console.warn(`⚠️ POTANSİYEL VERİ TUTARSIZLIĞI - ${investment.currency}:`, {
              buyPrice: investment.buy_price,
              currentPrice: currentPrice,
              difference: priceDifference,
              differencePercent: priceDifferencePercent
            })
          }
          
          // Eğer fiyat farkı %20'den fazlaysa, potansiyel veri tutarsızlığı uyarısı
          if (priceDifferencePercent > 20) {
            console.warn(`⚠️ VERİ TUTARSIZLIĞI UYARISI - ${investment.currency}:`, {
              buyPrice: investment.buy_price,
              currentPrice: currentPrice,
              difference: priceDifference,
              differencePercent: priceDifferencePercent,
              message: `Bu yatırımın alış fiyatı ile mevcut fiyatı arasında %${priceDifferencePercent.toFixed(1)} fark var. Lütfen veri kaynağını kontrol edin.`
            })
          }
          
          return {
            ...investment,
            current_value: calculation.currentValue,
            profit: calculation.totalProfit,
            profit_percent: calculation.profitPercentage,
            status: calculation.status,
            warning: priceDifferencePercent > 20 ? {
              message: `Fiyat farkı %${priceDifferencePercent.toFixed(1)} - Veri doğrulanıyor mu?`,
              level: 'warning'
            } : undefined
          }
        })
        
        console.log('Updated investments with profit calculations:', investmentsData)
        setInvestments(investmentsData)
      } else {
        console.error('Failed to fetch investments:', investmentsResult.error)
      }
    } catch (error) {
      console.error('Investments fetch error:', error)
    } finally {
      setIsLoadingInvestments(false)
    }
  }

  // Delete investment function
  const deleteInvestment = async (id: string) => {
    setIsDeleting(true)
    try {
      console.log('Starting delete for investment:', id)
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      console.log('Session data:', { 
        hasSession: !!session, 
        hasToken: !!token,
        userId: user?.id 
      })

      if (!token) {
        console.error('No auth token available')
        // Try to get user session directly
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        console.log('Direct user check:', currentUser)
        return
      }

      const response = await fetch(`/api/investments/delete?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      console.log('Delete API response:', { status: response.status, result })
      
      if (result.success) {
        console.log('Investment deleted successfully:', result)
        // Refresh investments list
        if (user) {
          await fetchInvestments(user.id)
        }
        // Close delete confirmation dialog
        setDeleteConfirmOpen(false)
        setInvestmentToDelete(null)
      } else {
        console.error('Failed to delete investment:', result.error)
      }
    } catch (error) {
      console.error('Delete investment error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // TCMB'den döviz verilerini çek
  const fetchCurrencyData = async () => {
    setIsLoadingCurrency(true)
    try {
      const response = await fetch('/api/currency')
      const result = await response.json()
      
      if (result.success) {
        const data = result.data.map((item: any) => ({
          symbol: item.symbol,
          name: item.name.replace('ABD DOLARI', 'Amerikan Doları')
                     .replace('İNGİLİZ STERLİNİ', 'İngiliz Sterlini')
                     .replace('İSVİÇRE FRANGI', 'İsviçre Frangı'),
          price: item.price,
          change: item.change,
          changePercent: item.changePercent,
          forexBuying: item.forexBuying,
          forexSelling: item.forexSelling,
          icon: <DollarSign className="w-5 h-5" />
        }))
        setCurrencyData(data)
        setDisplayedCurrencies(data.slice(0, visibleCount))
        setHasMore(data.length > visibleCount)
        setLastUpdated(new Date())
      } else {
        // Fallback data
        const fallbackData = result.data.map((item: any) => ({
          symbol: item.symbol,
          name: item.name.replace('ABD DOLARI', 'Amerikan Doları')
                     .replace('İNGİLİZ STERLİNİ', 'İngiliz Sterlini')
                     .replace('İSVİÇRE FRANGI', 'İsviçre Frangı'),
          price: item.price,
          change: item.change,
          changePercent: item.changePercent,
          forexBuying: item.forexBuying,
          forexSelling: item.forexSelling,
          icon: <DollarSign className="w-5 h-5" />
        }))
        setCurrencyData(fallbackData)
        setDisplayedCurrencies(fallbackData.slice(0, visibleCount))
        setHasMore(fallbackData.length > visibleCount)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Döviz verileri çekilemedi:', error)
    } finally {
      setIsLoadingCurrency(false)
    }
  }

  // CoinMarketCap'den kripto verilerini çek
  const fetchCryptoData = async () => {
    setIsLoadingCrypto(true)
    try {
      const response = await fetch('/api/crypto')
      const result = await response.json()
      
      if (result.success) {
        const data = result.data.map((item: any) => ({
          symbol: item.symbol,
          name: item.name,
          price: item.price,
          change: item.change,
          changePercent: item.changePercent,
          volume: item.volume,
          marketCap: item.marketCap,
          icon: <Bitcoin className={`w-5 h-5 ${item.icon || 'text-gray-500'}`} />
        }))
        setCryptoData(data)
        setDisplayedCryptos(data.slice(0, cryptoVisibleCount))
        setCryptoHasMore(data.length > cryptoVisibleCount)
        setCryptoLastUpdated(new Date())
      } else {
        console.error('Failed to fetch crypto data:', result.error)
      }
    } catch (error) {
      console.error('Kripto verileri çekilemedi:', error)
    } finally {
      setIsLoadingCrypto(false)
    }
  }

  // Load historical price for investment
  const fetchHistoricalPrice = async (date: string, currencyCode: string, type: 'currency' | 'crypto') => {
    setIsLoadingHistorical(true)
    try {
      console.log(`🔍 Fetching historical price for ${currencyCode} on ${date} (type: ${type})`)
      
      let response
      
      if (type === 'crypto') {
        // Use unified historical API for crypto
        response = await fetch(`/api/historical?date=${date}&cryptoId=${currencyCode.toLowerCase()}&type=crypto`)
      } else {
        // Use unified historical API for currency
        response = await fetch(`/api/historical?date=${date}&type=currency`)
      }
      
      const result = await response.json()
      
      console.log(`📊 Historical API response:`, {
        success: result.success,
        dataLength: result.data?.length,
        currencyCode,
        type,
        date,
        sampleData: result.data?.slice(0, 2)
      })
      
      if (result.success && result.data && result.data.length > 0) {
        // Find the specific item in the data
        let historicalItem
        if (type === 'crypto') {
          historicalItem = result.data.find((c: any) => c.symbol.toLowerCase() === currencyCode.toLowerCase())
        } else {
          // For currency, try exact match first, then try alternative formats
          historicalItem = result.data.find((c: any) => c.symbol === currencyCode)
          
          if (!historicalItem) {
            // Try with common variations
            const variations = [
              currencyCode,
              `${currencyCode}/TRY`,
              currencyCode.replace('/TRY', ''),
              currencyCode.replace('TRY/', '')
            ]
            
            for (const variation of variations) {
              historicalItem = result.data.find((c: any) => c.symbol === variation)
              if (historicalItem) {
                console.log(`✅ Found currency using variation: ${variation}`)
                break
              }
            }
          }
        }
        
        if (historicalItem) {
          setHistoricalPrice(historicalItem.price)
          console.log(`✅ Historical price found for ${currencyCode}: ${type === 'crypto' ? '$' : '₺'}${historicalItem.price}`)
        } else {
          console.warn(`❌ No historical price found for ${currencyCode} in ${result.data.length} items`)
          console.log(`Available symbols:`, result.data.map((c: any) => c.symbol))
          setHistoricalPrice(null)
        }
      } else {
        console.warn(`❌ No historical data available for ${date}:`, result.error || 'Unknown error')
        setHistoricalPrice(null)
      }
    } catch (error) {
      console.error('❌ Historical price fetch error:', error)
      setHistoricalPrice(null)
    } finally {
      setIsLoadingHistorical(false)
    }
  }

  // Create investment
  const createInvestment = async () => {
    if (!selectedCurrency || investmentForm.amount <= 0 || !user) {
      console.error('Missing required fields:', {
        selectedCurrency: !!selectedCurrency,
        amount: investmentForm.amount,
        user: !!user
      })
      return
    }
    
    setIsCreatingInvestment(true)
    try {
      const buyPrice = historicalPrice || selectedCurrency.price
      
      const requestData = {
        userId: user.id,
        currency: selectedCurrency.symbol,
        currencyName: selectedCurrency.name,
        amount: investmentForm.amount,
        buyPrice: buyPrice,
        buyDate: investmentForm.date
      }

      console.log('Creating investment with data:', {
        user: { id: user.id, email: user.email },
        selectedCurrency: selectedCurrency,
        investmentForm,
        buyPrice,
        requestData
      })
      
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      const result = await response.json()
      
      console.log('Investment creation response:', {
        status: response.status,
        ok: response.ok,
        result
      })
      
      if (result.success) {
        // Refresh investments list
        await fetchInvestments(user.id)
        
        setShowInvestmentDialog(false)
        setInvestmentForm({
          currency: '',
          currencyName: '',
          amount: 0,
          date: new Date().toISOString().split('T')[0]
        })
        setHistoricalPrice(null)
        setSelectedCurrency(null)
        
        // Show success message (optional)
        console.log('Investment created successfully')
      } else {
        console.error('Investment creation error:', result.error)
        console.error('Error details:', result.details)
        
        // Show user-friendly error message
        if (result.details?.includes('table') || result.details?.includes('relation')) {
          alert('Veritabanı tablosu bulunamadı. Lütfen Supabase investments tablosunu oluşturun.')
        } else if (result.details?.includes('column')) {
          alert('Veritabanı sütunu eksik. Lütfen Supabase migration script\'ini çalıştırın.')
        } else {
          alert(`Yatırım oluşturulamadı: ${result.error}${result.details ? ` - ${result.details}` : ''}`)
        }
      }
    } catch (error) {
      console.error('Investment creation error:', error)
      alert('Yatırım oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsCreatingInvestment(false)
    }
  }

  // Create manual crypto investment
  const createManualCryptoInvestment = async () => {
    if (!manualCryptoForm.coin || !manualCryptoForm.coinName || manualCryptoForm.buyPrice <= 0 || manualCryptoForm.amount <= 0 || !user) {
      console.error('Missing required fields for manual crypto investment:', {
        coin: manualCryptoForm.coin,
        coinName: manualCryptoForm.coinName,
        buyPrice: manualCryptoForm.buyPrice,
        amount: manualCryptoForm.amount,
        user: !!user
      })
      return
    }
    
    setIsCreatingManualCrypto(true)
    try {
      const requestData = {
        userId: user.id,
        currency: manualCryptoForm.coin,
        currencyName: manualCryptoForm.coinName,
        amount: manualCryptoForm.amount,
        buyPrice: manualCryptoForm.buyPrice,
        buyDate: manualCryptoForm.buyDate
      }

      console.log('Creating manual crypto investment with data:', requestData)
      
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      const result = await response.json()
      
      console.log('Manual crypto investment creation response:', result)
      
      if (result.success) {
        // Refresh investments list
        await fetchInvestments(user.id)
        
        // Reset form and close dialog
        setManualCryptoForm({
          coin: '',
          coinName: '',
          buyPrice: 0,
          amount: 0,
          buyDate: new Date().toISOString().split('T')[0],
          currentPrice: 0
        })
        setShowManualCryptoDialog(false)
      } else {
        console.error('Failed to create manual crypto investment:', result.error)
      }
    } catch (error) {
      console.error('Manual crypto investment creation error:', error)
    } finally {
      setIsCreatingManualCrypto(false)
    }
  }

  // Open investment dialog
  const openInvestmentDialog = (currency: CurrencyItem | CryptoItem) => {
    setSelectedCurrency(currency)
    setInvestmentForm(prev => ({
      ...prev,
      currency: currency.symbol,
      currencyName: currency.name
    }))
    setShowInvestmentDialog(true)
    
    // Fetch historical price for the selected date
    if (investmentForm.date !== new Date().toISOString().split('T')[0]) {
      const currencyType = getInvestmentCategory(currency.symbol)
      fetchHistoricalPrice(investmentForm.date, currency.symbol, currencyType)
    } else {
      setHistoricalPrice(null)
    }
  }

  // Check if selected date is a holiday
  const isDateHoliday = (date: string) => {
    const holidays = [
      '2025-01-01', // Yılbaşı
      '2025-04-23', // Ramazan Bayramı 1. Günü
      '2025-04-24', // Ramazan Bayramı 2. Günü
      '2025-04-25', // Ramazan Bayramı 3. Günü
      '2025-05-01', // Emek ve Dayanışma Günü
      '2025-05-19', // Gençlik ve Spor Bayramı
      '2025-07-15', // Demokrasi ve Milli Birlik Günü
      '2025-08-30', // Zafer Bayramı
      '2025-10-29', // Cumhuriyet Bayramı
      '2025-11-10' // Ataturk Anma Gunu
    ]
    return holidays.includes(date)
  }

  // Load more currencies
  const loadMoreCurrencies = () => {
    const newCount = visibleCount + 8
    const newDisplayed = currencyData.slice(0, newCount)
    setDisplayedCurrencies(newDisplayed)
    setVisibleCount(newCount)
    setHasMore(currencyData.length > newCount)
  }

  const loadMoreCryptos = () => {
    const newCount = cryptoVisibleCount + 8
    const newDisplayed = cryptoData.slice(0, newCount)
    setDisplayedCryptos(newDisplayed)
    setCryptoVisibleCount(newCount)
    setCryptoHasMore(cryptoData.length > newCount)
  }

  useEffect(() => {
    fetchCurrencyData()
    fetchCryptoData()
    
    // Her 5 dakikada bir verileri yenile
    const currencyInterval = setInterval(fetchCurrencyData, 5 * 60 * 1000)
    const cryptoInterval = setInterval(fetchCryptoData, 5 * 60 * 1000)
    
    return () => {
      clearInterval(currencyInterval)
      clearInterval(cryptoInterval)
    }
  }, [])

  // Update displayed currencies when visible count changes
  useEffect(() => {
    if (currencyData.length > 0) {
      const newDisplayed = currencyData.slice(0, visibleCount)
      setDisplayedCurrencies(newDisplayed)
      setHasMore(currencyData.length > visibleCount)
    }
  }, [currencyData, visibleCount])

  // Update displayed cryptos when visible count changes
  useEffect(() => {
    if (cryptoData.length > 0) {
      const newDisplayed = cryptoData.slice(0, cryptoVisibleCount)
      setDisplayedCryptos(newDisplayed)
      setCryptoHasMore(cryptoData.length > cryptoVisibleCount)
    }
  }, [cryptoData, cryptoVisibleCount])

  // Update investment filter when tab changes
  useEffect(() => {
    if (selectedTab === 'currency') {
      setInvestmentFilter('currency')
    } else if (selectedTab === 'crypto') {
      setInvestmentFilter('crypto')
    } else if (selectedTab === 'commodity') {
      setInvestmentFilter('commodity')
    } else {
      setInvestmentFilter('all')
    }
  }, [selectedTab])

  const commodityData: CommodityItem[] = [
    {
      symbol: 'XAU',
      name: 'Altın (Gram)',
      price: 2345.67,
      change: 15.23,
      changePercent: 0.65,
      unit: 'TL/gram',
      icon: <Gem className="w-5 h-5 text-yellow-600" />
    },
    {
      symbol: 'XAG',
      name: 'Gümüş (Gram)',
      price: 32.45,
      change: -0.89,
      changePercent: -2.67,
      unit: 'TL/gram',
      icon: <Gem className="w-5 h-5 text-gray-500" />
    },
    {
      symbol: 'OIL',
      name: 'Petrol (Varil)',
      price: 78.92,
      change: 2.15,
      changePercent: 2.81,
      unit: 'TL/varil',
      icon: <BarChart3 className="w-5 h-5 text-black" />
    },
    {
      symbol: 'PLAT',
      name: 'Platin (Gram)',
      price: 987.34,
      change: 5.67,
      changePercent: 0.58,
      unit: 'TL/gram',
      icon: <Gem className="w-5 h-5 text-gray-400" />
    }
  ]

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price)
    } else if (price >= 1000) {
      return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(price)
    } else {
      return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price)
    }
  }

  // Format price based on currency type
  const formatCurrencyPrice = (price: number, symbol: string) => {
    // Check if it's a cryptocurrency
    const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'AVAX', 'USDT', 'USDC', 'BUSD', 'SHIB', 'LTC', 'LINK', 'UNI', 'ATOM', 'XLM', 'VET']
    const prefix = cryptoSymbols.includes(symbol) ? '$' : '₺'
    return `${prefix}${formatPrice(price)}`
  }

  const formatLargeNumber = (num: string) => {
    const value = parseFloat(num)
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return `$${value.toFixed(2)}`
  }

  const renderCurrencyTable = (data: CurrencyItem[]) => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold truncate">Döviz Kurları</h3>
          <p className="text-sm text-muted-foreground">
            {currencyData.length > 0 ? `Gösterilen: ${displayedCurrencies.length} / ${currencyData.length}` : 'Yükleniyor...'}
          </p>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchCurrencyData}
          disabled={isLoadingCurrency}
          className="shrink-0"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingCurrency ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isLoadingCurrency ? 'Yenileniyor...' : 'Yenile'}</span>
          <span className="sm:hidden">{isLoadingCurrency ? '...' : '↻'}</span>
        </Button>
      </div>
      <div className="grid gap-4">
        {data.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>Döviz verileri yükleniyor...</p>
            </div>
          </Card>
        ) : (
          <>
            {data.map((item) => (
              <Card key={item.symbol} className="p-4 hover:shadow-md transition-shadow duration-200">
                <div className="space-y-4">
                  {/* Sol taraf - Döviz bilgileri */}
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-base sm:text-lg truncate" title={item.symbol}>{item.symbol}</div>
                      <div className="text-sm text-muted-foreground truncate" title={item.name}>{item.name}</div>
                      {item.forexBuying && item.forexSelling && (
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          <div className="truncate" title={`Alış: ₺${formatPrice(item.forexBuying)}`}>
                            <span className="font-medium">Alış:</span> ₺{formatPrice(item.forexBuying)}
                          </div>
                          <div className="truncate" title={`Satış: ₺${formatPrice(item.forexSelling)}`}>
                            <span className="font-medium">Satış:</span> ₺{formatPrice(item.forexSelling)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Sağ taraf - Fiyat ve işlem */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 sm:flex-none">
                      <div className="text-right sm:text-left">
                        <div className="font-bold text-lg sm:text-xl text-foreground whitespace-nowrap" title={`Fiyat: ₺${formatPrice(item.price)}`}>
                          ₺{formatPrice(item.price)}
                        </div>
                        <div className={`flex items-center sm:justify-start justify-end space-x-1 mt-1 ${
                          item.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {item.change >= 0 ? (
                            <ArrowUpRight className="w-4 h-4 shrink-0" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 shrink-0" />
                          )}
                          <span className="text-sm font-medium"
                            title={`Değişim: ${item.change >= 0 ? '+' : ''}${formatPrice(item.change)} (${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%)`}
                          >
                            {item.change >= 0 ? '+' : ''}{formatPrice(item.change)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full sm:w-auto shrink-0"
                      onClick={() => openInvestmentDialog(item)}
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Hızlı Yatırım</span>
                      <span className="sm:hidden">Yatırım</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {hasMore && (
              <div className="flex justify-center py-4">
                <Button 
                  variant="outline" 
                  onClick={loadMoreCurrencies}
                  disabled={isLoadingCurrency}
                  className="w-full max-w-md"
                >
                  Daha Fazla Döviz Göster
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  const renderCryptoTable = (data: CryptoItem[]) => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold truncate">Kripto Paralar</h3>
          <p className="text-sm text-muted-foreground">
            {cryptoData.length > 0 ? `Gösterilen: ${displayedCryptos.length} / ${cryptoData.length}` : 'Yükleniyor...'}
          </p>
          {cryptoLastUpdated && (
            <p className="text-sm text-muted-foreground">
              Son güncelleme: {cryptoLastUpdated.toLocaleTimeString('tr-TR')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowManualCryptoDialog(true)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Manuel Ekle</span>
            <span className="sm:hidden">+</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchCryptoData}
            disabled={isLoadingCrypto}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingCrypto ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoadingCrypto ? 'Yenileniyor...' : 'Yenile'}</span>
            <span className="sm:hidden">{isLoadingCrypto ? '...' : '↻'}</span>
          </Button>
        </div>
      </div>
      <div className="grid gap-4">
        {data.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>Kripto verileri yükleniyor...</p>
            </div>
          </Card>
        ) : (
          <>
            {data.map((item) => (
              <Card key={item.symbol} className="p-4 hover:shadow-md transition-shadow duration-200">
                <div className="space-y-4">
                  {/* Sol taraf - Kripto bilgileri */}
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-base sm:text-lg truncate" title={item.symbol}>{item.symbol}</div>
                      <div className="text-sm text-muted-foreground truncate" title={item.name}>{item.name}</div>
                      {item.volume && item.marketCap && (
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          <div className="truncate" title={`Hacim: ${item.volume}`}>
                            <span className="font-medium">Hacim:</span> ${item.volume}
                          </div>
                          <div className="truncate" title={`Piyasa Değeri: ${item.marketCap}`}>
                            <span className="font-medium">Piyasa:</span> ${item.marketCap}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Sağ taraf - Fiyat ve işlem */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 sm:flex-none">
                      <div className="text-right sm:text-left">
                        <div className="font-bold text-lg sm:text-xl text-foreground whitespace-nowrap" title={`Fiyat: $${formatPrice(item.price)}`}>
                          ${formatPrice(item.price)}
                        </div>
                        <div className={`flex items-center sm:justify-start justify-end space-x-1 mt-1 ${
                          item.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {item.change >= 0 ? (
                            <ArrowUpRight className="w-4 h-4 shrink-0" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 shrink-0" />
                          )}
                          <span className="text-sm font-medium"
                            title={`Değişim: ${item.change >= 0 ? '+' : ''}${formatPrice(item.change)} (${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%)`}
                          >
                            {item.change >= 0 ? '+' : ''}{formatPrice(item.change)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground text-center">
                      Manuel yatırım için üstteki "Manuel Ekle" butonunu kullanın
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {cryptoHasMore && (
              <div className="flex justify-center py-4">
                <Button 
                  variant="outline" 
                  onClick={loadMoreCryptos}
                  disabled={isLoadingCrypto}
                  className="w-full max-w-md"
                >
                  Daha Fazla Kripto Göster
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  const renderCommodityTable = (data: CommodityItem[]) => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold truncate">Madenler</h3>
        </div>
        <Button variant="outline" size="sm" className="shrink-0">
          <RefreshCw className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Yenile</span>
          <span className="sm:hidden">↻</span>
        </Button>
      </div>
      <div className="grid gap-4">
        {data.map((item) => (
          <Card key={item.symbol} className="p-4 hover:shadow-md transition-shadow duration-200">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-base sm:text-lg truncate" title={item.symbol}>{item.symbol}</div>
                  <div className="text-sm text-muted-foreground truncate" title={item.name}>{item.name}</div>
                  <div className="text-xs text-muted-foreground mt-2 truncate" title={item.unit}>{item.unit}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg sm:text-xl text-foreground whitespace-nowrap" title={`Fiyat: ₺${formatPrice(item.price)}`}>
                  ₺{formatPrice(item.price)}
                </div>
                <div className={`flex items-center justify-end space-x-1 mt-1 ${
                  item.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {item.change >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 shrink-0" />
                  )}
                  <span className="text-sm font-medium"
                    title={`Değişim: ${item.change >= 0 ? '+' : ''}${formatPrice(item.change)} (${item.changePercent >= 0 ? '+' : ''}${item.changePercent}%)`}
                  >
                    {item.change >= 0 ? '+' : ''}{formatPrice(item.change)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent}%)
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="hover:opacity-80 transition-opacity duration-200">
                <img 
                  src="/favicon.png" 
                  alt="ButcApp" 
                  className="w-10 h-10 rounded-xl shadow-sm"
                />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Yatırımlar</h1>
                <p className="text-sm text-muted-foreground">Döviz, Kripto ve Maden Piyasaları</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <LanguageToggle />
              <UserAuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hotbar - Finans / Yatırımlar Geçişi */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-4">
            <Link href="/app" className="flex items-center space-x-2 px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors">
              <DollarSign className="w-5 h-5" />
              <span>Finans</span>
            </Link>
            <Link href="/app/investments" className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium">
              <TrendingUp className="w-5 h-5" />
              <span>Yatırımlar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="currency" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Döviz</span>
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center space-x-2">
              <Bitcoin className="w-4 h-4" />
              <span>Kripto</span>
            </TabsTrigger>
            <TabsTrigger value="commodities" className="flex items-center space-x-2">
              <Gem className="w-4 h-4" />
              <span>Maden</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="currency" className="space-y-6">
            {renderCurrencyTable(displayedCurrencies)}
          </TabsContent>

          <TabsContent value="crypto" className="space-y-6">
            {renderCryptoTable(displayedCryptos)}
          </TabsContent>

          <TabsContent value="commodities" className="space-y-6">
            {renderCommodityTable(commodityData)}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer Info */}
      <div className="container mx-auto px-4 py-6">
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>
                Veriler gerçek zamanlı olarak güncellenmektedir. Yatırım kararlarınızı verirken dikkatli olun.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Dialog */}
      <Dialog open={showInvestmentDialog} onOpenChange={setShowInvestmentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Yatırım Yap
            </DialogTitle>
            <DialogDescription>
              {selectedCurrency?.name} için yatırım işlemi oluşturun
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Döviz</Label>
                <Input
                  id="currency"
                  value={selectedCurrency?.symbol || ''}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="currentPrice">Güncel Fiyat</Label>
                <Input
                  id="currentPrice"
                  value={formatCurrencyPrice(selectedCurrency?.price || 0, selectedCurrency?.symbol || '')}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="date">Tarih</Label>
              <Input
                id="date"
                type="date"
                value={investmentForm.date}
                onChange={(e) => {
                  const newDate = e.target.value
                  setInvestmentForm(prev => ({ ...prev, date: newDate }))
                  
                  // Check if new date is a holiday
                  if (isDateHoliday(newDate)) {
                    // Clear historical price if date is a holiday
                    setHistoricalPrice(null)
                  } else {
                    // Fetch historical price for new date
                    if (selectedCurrency && newDate !== new Date().toISOString().split('T')[0]) {
                      fetchHistoricalPrice(newDate, selectedCurrency.symbol)
                    } else {
                      setHistoricalPrice(null)
                    }
                  }
                }}
                max={new Date().toISOString().split('T')[0]}
                className={isDateHoliday(investmentForm.date) ? 'border-red-500 focus:border-red-500' : ''}
              />
              {isDateHoliday(investmentForm.date) && (
                <p className="text-sm text-red-500 mt-1">
                  ⚠️ Seçilen tarih resmi tatil günüdür. TCMB bu gün için veri yayınlamaz.
                </p>
              )}
              {isDateHoliday(investmentForm.date) && historicalPrice && (
                <p className="text-sm text-blue-600 mt-1">
                  ℹ️ {investmentForm.date} tarihinde veri bulunamadı. Önceki çalışma günü ({new Date(historicalPrice.timestamp).toLocaleDateString('tr-TR')}) verileri kullanılıyor.
                </p>
              )}
              {!isDateHoliday(investmentForm.date) && !historicalPrice && (
                <p className="text-sm text-orange-600 mt-1">
                  ⚠️ {investmentForm.date} tarihi için veri bulunamadı.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="amount">
                İşlem Fiyatı
                {isLoadingHistorical && (
                  <span className="text-muted-foreground ml-2">(Yükleniyor...)</span>
                )}
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={historicalPrice || selectedCurrency?.price || 0}
                readOnly
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="investmentAmount">Yatırım Miktarı (TRY)</Label>
              <Input
                id="investmentAmount"
                type="number"
                step="0.01"
                value={investmentForm.amount}
                onChange={(e) => setInvestmentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            {investmentForm.amount > 0 && (historicalPrice || selectedCurrency?.price) && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Toplam Yatırım:</span>
                    <span className="font-medium">
                      ₺{formatPrice(investmentForm.amount * (historicalPrice || selectedCurrency?.price || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alış Fiyatı:</span>
                    <span className="font-medium">
                      ₺{formatPrice(historicalPrice || selectedCurrency?.price || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mevcut Değer:</span>
                    <span className="font-medium">
                      ₺{formatPrice(selectedCurrency?.price || 0)}
                    </span>
                  </div>
                  {selectedCurrency?.price !== (historicalPrice || 0) && (
                    <div className="flex justify-between">
                      <span>Kar/Zarar:</span>
                      <span className={`font-medium ${
                        (selectedCurrency.price - (historicalPrice || 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {((selectedCurrency.price - (historicalPrice || 0)) >= 0 ? '+' : '')}₺{formatPrice((selectedCurrency.price - (historicalPrice || 0)) * investmentForm.amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowInvestmentDialog(false)}
                disabled={isCreatingInvestment}
              >
                İptal
              </Button>
              <Button 
                onClick={createInvestment}
                disabled={isCreatingInvestment || !selectedCurrency || investmentForm.amount <= 0}
              >
                {isCreatingInvestment ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Oluşturuluyor...
                  </div>
                ) : (
                  'Yatırım Yap'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Crypto Investment Dialog */}
      <Dialog open={showManualCryptoDialog} onOpenChange={setShowManualCryptoDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bitcoin className="w-5 h-5" />
              Manuel Kripto Yatırımı
            </DialogTitle>
            <DialogDescription>
              API sınırlamaları nedeniyle kripto yatırımlarınızı manuel olarak ekleyin
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coin">Coin Seçimi</Label>
                <Select 
                  value={manualCryptoForm.coin} 
                  onValueChange={(value) => {
                    const selectedCoin = cryptoData.find(coin => coin.symbol === value)
                    setManualCryptoForm(prev => ({
                      ...prev,
                      coin: value,
                      coinName: selectedCoin?.name || '',
                      currentPrice: selectedCoin?.price || 0
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Coin seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cryptoData.map((coin) => (
                      <SelectItem key={coin.symbol} value={coin.symbol}>
                        {coin.symbol} - {coin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="coinName">Coin Adı</Label>
                <Input
                  id="coinName"
                  value={manualCryptoForm.coinName}
                  onChange={(e) => setManualCryptoForm(prev => ({ ...prev, coinName: e.target.value }))}
                  placeholder="Bitcoin, Ethereum, vb."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyPrice">Alış Fiyatı ($)</Label>
                <Input
                  id="buyPrice"
                  type="number"
                  step="0.01"
                  value={manualCryptoForm.buyPrice || ''}
                  onChange={(e) => setManualCryptoForm(prev => ({ ...prev, buyPrice: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="amount">Miktar</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.00000001"
                  value={manualCryptoForm.amount || ''}
                  onChange={(e) => setManualCryptoForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00000000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="buyDate">Alış Tarihi</Label>
              <Input
                id="buyDate"
                type="date"
                value={manualCryptoForm.buyDate}
                onChange={(e) => setManualCryptoForm(prev => ({ ...prev, buyDate: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {manualCryptoForm.buyPrice > 0 && manualCryptoForm.amount > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Toplam Yatırım:</span>
                    <span className="font-medium">
                      ${formatPrice(manualCryptoForm.buyPrice * manualCryptoForm.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alış Fiyatı:</span>
                    <span className="font-medium">
                      ${formatPrice(manualCryptoForm.buyPrice)}
                    </span>
                  </div>
                  {manualCryptoForm.currentPrice > 0 && (
                    <div className="flex justify-between">
                      <span>Mevcut Fiyat:</span>
                      <span className="font-medium">
                        ${formatPrice(manualCryptoForm.currentPrice)}
                      </span>
                    </div>
                  )}
                  {manualCryptoForm.currentPrice > 0 && manualCryptoForm.currentPrice !== manualCryptoForm.buyPrice && (
                    <div className="flex justify-between">
                      <span>Tahmini Kar/Zarar:</span>
                      <span className={`font-medium ${
                        (manualCryptoForm.currentPrice - manualCryptoForm.buyPrice) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {((manualCryptoForm.currentPrice - manualCryptoForm.buyPrice) >= 0 ? '+' : '')}${formatPrice((manualCryptoForm.currentPrice - manualCryptoForm.buyPrice) * manualCryptoForm.amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowManualCryptoDialog(false)}
                disabled={isCreatingManualCrypto}
              >
                İptal
              </Button>
              <Button 
                onClick={createManualCryptoInvestment}
                disabled={isCreatingManualCrypto || !manualCryptoForm.coin || !manualCryptoForm.coinName || manualCryptoForm.buyPrice <= 0 || manualCryptoForm.amount <= 0}
              >
                {isCreatingManualCrypto ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Oluşturuluyor...
                  </div>
                ) : (
                  'Yatırım Ekle'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Your Investments Section */}
      {user && investments.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Yatırımlarınız
                  </CardTitle>
                  <CardDescription>
                    {investmentFilter === 'all' 
                      ? 'Tüm yatırımlarınızın takibi'
                      : investmentFilter === 'currency'
                      ? 'Döviz yatırımlarınızın takibi'
                      : investmentFilter === 'crypto'
                      ? 'Kripto para yatırımlarınızın takibi'
                      : 'Maden yatırımlarınızın takibi'
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={investmentFilter} onValueChange={(value: 'all' | 'currency' | 'crypto' | 'commodity') => setInvestmentFilter(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="currency">Döviz</SelectItem>
                      <SelectItem value="crypto">Kripto</SelectItem>
                      <SelectItem value="commodity">Maden</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStatisticsDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <PieChartIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">İstatistikler</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {getFilteredInvestments().length > 0 ? (
                  getFilteredInvestments().map((investment) => {
                  const profitDetails = formatProfitDetails(
                    calculateInvestmentProfit(investment, investment.current_value / investment.amount)
                  )
                  
                  return (
                    <div key={investment.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{investment.currency}</div>
                            <Badge variant={investment.status === 'sold' ? 'secondary' : 'default'}>
                              {investment.status === 'sold' ? 'Satıldı' : 'Aktif'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{investment.currency_name}</div>
                          <div className="text-xs text-muted-foreground">
                            Alış: {new Date(investment.buy_date).toLocaleDateString('tr-TR')} - ₺{investment.buy_price.toFixed(2)}
                          </div>
                          {investment.sell_date && (
                            <div className="text-xs text-muted-foreground">
                              Satış: {new Date(investment.sell_date).toLocaleDateString('tr-TR')} - ₺{investment.sell_price?.toFixed(2)}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Miktar: {investment.amount} {investment.currency}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-semibold">
                              ₺{formatPrice(investment.current_value)}
                            </div>
                            <div className={`text-sm font-medium ${
                              investment.profit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {investment.profit >= 0 ? '+' : ''}₺{formatPrice(investment.profit)}
                            </div>
                            <div className={`text-xs ${
                              investment.profit_percent >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ({investment.profit_percent >= 0 ? '+' : ''}{investment.profit_percent.toFixed(2)}%)
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {profitDetails.status}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setInvestmentToDelete(investment.id)
                              setDeleteConfirmOpen(true)
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                }) ) : (
                  <div className="text-center py-8">
                    <div className="text-lg font-semibold mb-2">
                      {investmentFilter === 'currency' 
                        ? 'Döviz yatırımınız bulunmuyor'
                        : investmentFilter === 'crypto'
                        ? 'Kripto para yatırımınız bulunmuyor'
                        : investmentFilter === 'commodity'
                        ? 'Maden yatırımınız bulunmuyor'
                        : 'Yatırımınız bulunmuyor'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {investmentFilter === 'currency' 
                        ? 'Döviz tablosundan yatırım yapmaya başlayabilirsiniz'
                        : investmentFilter === 'crypto'
                        ? 'Kripto para tablosundan yatırım yapmaya başlayabilirsiniz'
                        : investmentFilter === 'commodity'
                        ? 'Madenler tablosundan yatırım yapmaya başlayabilirsiniz'
                        : 'Yukarıdaki tablolardan yatırım yapmaya başlayabilirsiniz'
                      }
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistics Dialog */}
      <Dialog open={showStatisticsDialog} onOpenChange={setShowStatisticsDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Yatırım İstatistikleri
            </DialogTitle>
            <DialogDescription>
              Yatırımlarınızın detaylı analizi ve grafikler
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Chart Type Selector */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label>Grafik Türü</Label>
                <Select value={selectedChartType} onValueChange={(value: 'pie' | 'profit') => setSelectedChartType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pie">Pasta Grafiği - Portföy Dağılımı</SelectItem>
                    <SelectItem value="profit">Kar/Zarar Grafiği</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedChartType === 'profit' && (
                <div className="flex-1">
                  <Label>Döviz Seçimi</Label>
                  <Select value={selectedCurrencyForChart} onValueChange={setSelectedCurrencyForChart}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Yatırımlar</SelectItem>
                      {Array.from(new Set(investments.map(inv => inv.currency))).map(currency => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Charts */}
            <div className="min-h-[400px] flex items-center justify-center border rounded-lg p-8">
              {selectedChartType === 'pie' ? (
                <PieChart investments={investments} />
              ) : (
                <ProfitChart 
                  investments={investments} 
                  selectedCurrency={selectedCurrencyForChart}
                />
              )}
            </div>

            {/* Summary Statistics */}
            <SummaryStatistics investments={investments} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Authentication Message */}
      {!isLoadingUser && !user && (
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-lg font-semibold mb-2">Yatırımlarınızı görmek için giriş yapın</div>
              <div className="text-muted-foreground mb-4">
                Yatırım yapmak ve portföyünüzü takip etmek için lütfen hesabınıza giriş yapın.
              </div>
              <UserAuthButton />
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Investments Message */}
      {user && !isLoadingInvestments && investments.length === 0 && (
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-lg font-semibold mb-2">Henüz yatırım yapmadınız</div>
              <div className="text-muted-foreground mb-4">
                İlk yatırımınızı yapmak için yukarıdaki döviz listesinden seçim yapabilirsiniz.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yatırımı Sil</DialogTitle>
            <DialogDescription>
              Bu yatırımı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setInvestmentToDelete(null)
              }}
              disabled={isDeleting}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => investmentToDelete && deleteInvestment(investmentToDelete)}
              disabled={isDeleting || !investmentToDelete}
            >
              {isDeleting ? 'Siliniyor...' : 'Sil'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}