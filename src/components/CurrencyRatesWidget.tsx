'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock, DollarSign, X } from 'lucide-react'

interface ExchangeRate {
  code: string
  name: string
  buyRate: number
  sellRate: number
  changeRate?: number
  changePercent?: number
  lastUpdate: string
  flag: string
}

interface CurrencyResponse {
  success: boolean
  data: ExchangeRate[]
  source?: string
  message?: string
  lastUpdate?: string
}

export default function CurrencyRatesWidget() {
  const [rates, setRates] = useState<ExchangeRate[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)

  const fetchRates = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Cache-busting timestamp ekle
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/exchange-rates?refresh=true&t=${timestamp}`, {
        cache: 'no-cache', // Browser cache'ini devre dışı bırak
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      const data: CurrencyResponse = await response.json()
      
      if (data.success && data.data) {
        setRates(data.data)
        setLastUpdate(data.lastUpdate || new Date().toLocaleString('tr-TR'))
        
        if (data.message) {
          setError(data.message)
        }
      } else {
        throw new Error('Döviz kurları alınamadı')
      }
    } catch (err) {
      setError('Döviz kurları yüklenemedi')
      console.error('Döviz kuru hatası:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // İlk yüklemede normal fetch (cache'den alabilir)
    const initialFetch = async () => {
      try {
        setLoading(true)
        setError('')
        
        // Cache-busting timestamp ekle
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/exchange-rates?t=${timestamp}`, {
          cache: 'no-cache', // Browser cache'ini devre dışı bırak
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        const data: CurrencyResponse = await response.json()
        
        if (data.success && data.data) {
          setRates(data.data)
          setLastUpdate(data.lastUpdate || new Date().toLocaleString('tr-TR'))
          
          if (data.message) {
            setError(data.message)
          }
        } else {
          throw new Error('Döviz kurları alınamadı')
        }
      } catch (err) {
        setError('Döviz kurları yüklenemedi')
        console.error('Döviz kuru hatası:', err)
      } finally {
        setLoading(false)
      }
    }

    initialFetch()
    
    // Her 10 dakikada bir güncelle
    const interval = fetchRates
    
    const intervalId = setInterval(interval, 10 * 60 * 1000)
    
    return () => clearInterval(intervalId)
  }, [])

  // Ana gösterge için USD, EUR, GBP'yi al
  const mainCurrencies = rates.filter(r => ['USD', 'EUR', 'GBP'].includes(r.code))

  const getChangeIcon = (change?: number) => {
    if (!change) return <Minus className="w-4 h-4 text-gray-500" />
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const getChangeColor = (change?: number) => {
    if (!change) return 'text-gray-500'
    if (change > 0) return 'text-green-500'
    if (change < 0) return 'text-red-500'
    return 'text-gray-500'
  }

  if (loading && rates.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="p-4 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-green-600 mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Yükleniyor...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer bg-white dark:bg-gray-800 group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Döviz Kurları</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lastUpdate ? new Date(lastUpdate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  fetchRates()
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            
            {error ? (
              <div className="text-center py-2">
                <p className="text-xs text-red-500">{error}</p>
              </div>
            ) : mainCurrencies.length > 0 ? (
              <div className="space-y-2">
                {mainCurrencies.map((currency) => (
                  <div key={currency.code} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{currency.flag}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{currency.code}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {currency.sellRate.toFixed(2)}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {currency.buyRate.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-gray-500">Veri bulunamadı</p>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              Döviz Kurları
            </DialogTitle>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                <Clock className="w-4 h-4 mr-1" />
                {lastUpdate || 'Güncelleniyor...'}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchRates}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Güncelle
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
            </div>
          )}

          <ScrollArea className="h-[60vh]">
            <div className="space-y-4">
              {/* Ana Dövizler */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ana Dövizler</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rates.filter(r => ['USD', 'EUR', 'GBP', 'CHF'].includes(r.code)).map((currency) => (
                    <Card key={currency.code} className="border border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{currency.flag}</span>
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white">{currency.code}</h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{currency.name}</p>
                            </div>
                          </div>
                          {getChangeIcon(currency.changeRate)}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Alış:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {currency.buyRate.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Satış:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {currency.sellRate.toFixed(4)}
                            </span>
                          </div>
                          {currency.changePercent && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Değişim:</span>
                              <span className={`font-semibold ${getChangeColor(currency.changePercent)}`}>
                                {currency.changePercent > 0 ? '+' : ''}{currency.changePercent.toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Diğer Dövizler */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Diğer Dövizler</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rates.filter(r => !['USD', 'EUR', 'GBP', 'CHF'].includes(r.code)).map((currency) => (
                    <Card key={currency.code} className="border border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{currency.flag}</span>
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white">{currency.code}</h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{currency.name}</p>
                            </div>
                          </div>
                          {getChangeIcon(currency.changeRate)}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Alış:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {currency.buyRate.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Satış:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {currency.sellRate.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <p>Veri kaynağı: Türkiye Cumhuriyet Merkez Bankası</p>
              <p>Son güncelleme: {lastUpdate || 'Bilinmiyor'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}