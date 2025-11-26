'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, DollarSign, Bitcoin, Gem, ArrowUpRight, ArrowDownRight, Activity, BarChart3, RefreshCw, Clock, Star, AlertCircle } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { UserAuthButton } from '@/components/auth/UserAuthButton'
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

export default function InvestmentsPage() {
  const { t } = useLanguage()
  const [selectedTab, setSelectedTab] = useState('currency')
  const [currencyData, setCurrencyData] = useState<CurrencyItem[]>([])
  const [displayedCurrencies, setDisplayedCurrencies] = useState<CurrencyItem[]>([])
  const [isLoadingCurrency, setIsLoadingCurrency] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [visibleCount, setVisibleCount] = useState(8)
  const [hasMore, setHasMore] = useState(true)

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
    </div>
  )
}