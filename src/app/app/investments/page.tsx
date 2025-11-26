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
import { TrendingUp, TrendingDown, DollarSign, Bitcoin, Gem, ArrowUpRight, ArrowDownRight, Activity, BarChart3, RefreshCw, Clock, Star, AlertCircle, Plus, Calendar, Zap, Target, Wallet, PieChart as PieChartIcon, TrendingUp as TrendingUpIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { UserAuthButton } from '@/components/auth/UserAuthButton'
import { PieChart } from '@/components/charts/PieChart'
import { ProfitChart } from '@/components/charts/ProfitChart'
import { useLanguage } from '@/contexts/LanguageContext'
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
  currency: string
  currencyName: string
  amount: number
  buyPrice: number
  buyDate: string
  currentValue: number
  profit: number
  profitPercent: number
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
  
  // Investment states
  const [showInvestmentDialog, setShowInvestmentDialog] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyItem | null>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
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

  // Load historical price for investment
  const fetchHistoricalPrice = async (date: string, currencyCode: string) => {
    setIsLoadingHistorical(true)
    try {
      const response = await fetch(`/api/currency-historical?date=${date}`)
      const result = await response.json()
      
      if (result.success) {
        const currency = result.data.find((c: any) => c.symbol === currencyCode)
        if (currency) {
          setHistoricalPrice(currency.price)
        }
      }
    } catch (error) {
      console.error('Historical price fetch error:', error)
    } finally {
      setIsLoadingHistorical(false)
    }
  }

  // Create investment
  const createInvestment = async () => {
    if (!selectedCurrency || investmentForm.amount <= 0) return
    
    setIsCreatingInvestment(true)
    try {
      const buyPrice = historicalPrice || selectedCurrency.price
      const investment: Investment = {
        id: Date.now().toString(),
        currency: selectedCurrency.symbol,
        currencyName: selectedCurrency.name,
        amount: investmentForm.amount,
        buyPrice: buyPrice,
        buyDate: investmentForm.date,
        currentValue: selectedCurrency.price,
        profit: (selectedCurrency.price - buyPrice) * investmentForm.amount,
        profitPercent: ((selectedCurrency.price - buyPrice) / buyPrice) * 100
      }
      
      setInvestments(prev => [investment, ...prev])
      setShowInvestmentDialog(false)
      setInvestmentForm({
        currency: '',
        currencyName: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0]
      })
      setHistoricalPrice(null)
      setSelectedCurrency(null)
    } catch (error) {
      console.error('Investment creation error:', error)
    } finally {
      setIsCreatingInvestment(false)
    }
  }

  // Open investment dialog
  const openInvestmentDialog = (currency: CurrencyItem) => {
    setSelectedCurrency(currency)
    setInvestmentForm(prev => ({
      ...prev,
      currency: currency.symbol,
      currencyName: currency.name
    }))
    setShowInvestmentDialog(true)
    
    // Fetch historical price for the selected date
    if (investmentForm.date !== new Date().toISOString().split('T')[0]) {
      fetchHistoricalPrice(investmentForm.date, currency.symbol)
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
      '2025-11-10' // Atatürk'ü Anma Günü
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

  useEffect(() => {
    fetchCurrencyData()
    
    // Her 5 dakikada bir verileri yenile
    const interval = setInterval(fetchCurrencyData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Update displayed currencies when visible count changes
  useEffect(() => {
    if (currencyData.length > 0) {
      const newDisplayed = currencyData.slice(0, visibleCount)
      setDisplayedCurrencies(newDisplayed)
      setHasMore(currencyData.length > visibleCount)
    }
  }, [currencyData, visibleCount])

  const cryptoData: CryptoItem[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 67234.50,
      change: 1250.30,
      changePercent: 1.89,
      volume: '28.5B',
      marketCap: '1.31T',
      icon: <Bitcoin className="w-5 h-5 text-orange-500" />
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 3456.78,
      change: -45.20,
      changePercent: -1.29,
      volume: '15.2B',
      marketCap: '415.2B',
      icon: <Bitcoin className="w-5 h-5 text-blue-500" />
    },
    {
      symbol: 'BNB',
      name: 'Binance Coin',
      price: 567.89,
      change: 12.45,
      changePercent: 2.24,
      volume: '1.8B',
      marketCap: '87.3B',
      icon: <Bitcoin className="w-5 h-5 text-yellow-500" />
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: 145.67,
      change: 8.92,
      changePercent: 6.52,
      volume: '2.3B',
      marketCap: '65.8B',
      icon: <Bitcoin className="w-5 h-5 text-purple-500" />
    }
  ]

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
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Döviz Kurları</h3>
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
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingCurrency ? 'animate-spin' : ''}`} />
          {isLoadingCurrency ? 'Yenileniyor...' : 'Yenile'}
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
              <Card key={item.symbol} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-semibold">{item.symbol}</div>
                      <div className="text-sm text-muted-foreground">{item.name}</div>
                      {item.forexBuying && item.forexSelling && (
                        <div className="text-xs text-muted-foreground">
                          Alış: ₺{formatPrice(item.forexBuying)} | Satış: ₺{formatPrice(item.forexSelling)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">₺{formatPrice(item.price)}</div>
                    <div className={`flex items-center justify-end space-x-1 ${
                      item.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.change >= 0 ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {item.change >= 0 ? '+' : ''}{formatPrice(item.change)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => openInvestmentDialog(item)}
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Hızlı Yatırım
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Kripto Paralar</h3>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Yenile
        </Button>
      </div>
      <div className="grid gap-4">
        {data.map((item) => (
          <Card key={item.symbol} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {item.icon}
                </div>
                <div>
                  <div className="font-semibold">{item.symbol}</div>
                  <div className="text-sm text-muted-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Hacim: {formatLargeNumber(item.volume)} | Piyasa Değeri: {formatLargeNumber(item.marketCap)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">${formatPrice(item.price)}</div>
                <div className={`flex items-center justify-end space-x-1 ${
                  item.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.change >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
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

  const renderCommodityTable = (data: CommodityItem[]) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Madenler</h3>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Yenile
        </Button>
      </div>
      <div className="grid gap-4">
        {data.map((item) => (
          <Card key={item.symbol} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {item.icon}
                </div>
                <div>
                  <div className="font-semibold">{item.symbol}</div>
                  <div className="text-sm text-muted-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.unit}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">₺{formatPrice(item.price)}</div>
                <div className={`flex items-center justify-end space-x-1 ${
                  item.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.change >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
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
            {renderCryptoTable(cryptoData)}
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
                  value={`₺${formatPrice(selectedCurrency?.price || 0)}`}
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

      {/* Your Investments Section */}
      {investments.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Yatırımlarınız
                  </CardTitle>
                  <CardDescription>
                    Yaptığınız döviz yatırımlarınızın takibi
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStatisticsDialog(true)}
                  className="flex items-center gap-2"
                >
                  <PieChartIcon className="w-4 h-4" />
                  İstatistikler
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {investments.map((investment) => (
                  <div key={investment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{investment.currency}</div>
                        <div className="text-sm text-muted-foreground">{investment.currencyName}</div>
                        <div className="text-xs text-muted-foreground">
                          Alış: {new Date(investment.buyDate).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ₺{formatPrice(investment.amount * investment.currentValue)}
                        </div>
                        <div className={`text-sm ${
                          investment.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {investment.profit >= 0 ? '+' : ''}₺{formatPrice(investment.profit)} ({investment.profitPercent >= 0 ? '+' : ''}{investment.profitPercent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    ₺{formatPrice(investments.reduce((sum, inv) => sum + (inv.amount * inv.buyPrice), 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">Toplam Yatırım</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    ₺{formatPrice(investments.reduce((sum, inv) => sum + (inv.amount * inv.currentValue), 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">Mevcut Değer</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className={`text-2xl font-bold ${
                    investments.reduce((sum, inv) => sum + inv.profit, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {investments.reduce((sum, inv) => sum + inv.profit, 0) >= 0 ? '+' : ''}₺{formatPrice(investments.reduce((sum, inv) => sum + inv.profit, 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">Toplam Kar/Zarar</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className={`text-2xl font-bold ${
                    investments.reduce((sum, inv) => sum + inv.profit, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {investments.length > 0 ? (
                      ((investments.reduce((sum, inv) => sum + inv.profit, 0) / investments.reduce((sum, inv) => sum + (inv.amount * inv.buyPrice), 0)) * 100).toFixed(2)
                    ) : '0.00'}%
                  </div>
                  <div className="text-sm text-muted-foreground">Getiri Oranı</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}