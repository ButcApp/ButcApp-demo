'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DollarSign, Bitcoin, Gem, Plus, TrendingUp, TrendingDown } from 'lucide-react'

interface InvestmentData {
  code: string
  name: string
  buy?: number
  sell?: number
  price?: number
  change: string
  marketCap?: string
}

export default function InvestmentsSection() {
  const [activeCategory, setActiveCategory] = useState<'doviz' | 'kripto' | 'maden'>('doviz')

  // Yatırımlar verileri
  const dovizData: InvestmentData[] = [
    { code: 'USD', name: 'Amerikan Doları', buy: 32.45, sell: 32.55, change: '+0.25%' },
    { code: 'EUR', name: 'Euro', buy: 35.12, sell: 35.22, change: '+0.18%' },
    { code: 'GBP', name: 'İngiliz Sterlini', buy: 40.89, sell: 41.05, change: '-0.12%' },
    { code: 'CHF', name: 'İsviçre Frangı', buy: 36.78, sell: 36.95, change: '+0.08%' }
  ]

  const kriptoData: InvestmentData[] = [
    { code: 'BTC', name: 'Bitcoin', price: 1.245678, change: '+2.45%', marketCap: '$24.5B' },
    { code: 'ETH', name: 'Ethereum', price: 0.045678, change: '+1.89%', marketCap: '$5.8B' },
    { code: 'BNB', name: 'Binance Coin', price: 856.45, change: '-0.65%', marketCap: '$1.2B' },
    { code: 'ADA', name: 'Cardano', price: 2.34, change: '+3.21%', marketCap: '$82M' }
  ]

  const madenData: InvestmentData[] = [
    { code: 'XAU', name: 'Altın (Ons)', buy: 1856.78, sell: 1865.45, change: '+0.95%' },
    { code: 'XAG', name: 'Gümüş (Ons)', buy: 23.45, sell: 23.89, change: '+0.45%' },
    { code: 'AU', name: 'Altın (Gram)', buy: 1895.67, sell: 1905.23, change: '+0.82%' },
    { code: 'AG', name: 'Gümüş (Gram)', buy: 28.95, sell: 29.45, change: '+0.38%' }
  ]

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Yatırım Portföyünüz
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Güncel piyasa verileriyle yatırım kararlarınızı yönetin
        </p>
      </div>

      {/* Kategori Seçimi */}
      <div className="flex justify-center mb-8 px-4">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1 w-full max-w-md sm:w-auto">
          <Button
            variant={activeCategory === 'doviz' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveCategory('doviz')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 font-medium transition-all duration-300 text-sm sm:text-base ${
              activeCategory === 'doviz' 
                ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <DollarSign className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Döviz</span>
            <span className="sm:hidden">D</span>
          </Button>
          <Button
            variant={activeCategory === 'kripto' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveCategory('kripto')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 font-medium transition-all duration-300 text-sm sm:text-base ${
              activeCategory === 'kripto' 
                ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Bitcoin className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Kripto</span>
            <span className="sm:hidden">K</span>
          </Button>
          <Button
            variant={activeCategory === 'maden' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveCategory('maden')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 font-medium transition-all duration-300 text-sm sm:text-base ${
              activeCategory === 'maden' 
                ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Gem className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Maden</span>
            <span className="sm:hidden">M</span>
          </Button>
        </div>
      </div>

      {/* Kategori İçeriği */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {activeCategory === 'doviz' && dovizData.map((item) => (
          <Card key={item.code} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.code}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.name}
                  </p>
                </div>
                <div className={`text-sm font-medium ${
                  item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.change}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Alış:</span>
                  <span className="font-medium text-gray-900 dark:text-white">₺{item.buy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Satış:</span>
                  <span className="font-medium text-gray-900 dark:text-white">₺{item.sell}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {activeCategory === 'kripto' && kriptoData.map((item) => (
          <Card key={item.code} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.code}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.name}
                  </p>
                </div>
                <div className={`text-sm font-medium ${
                  item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.change}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Fiyat:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.code === 'BTC' || item.code === 'ETH' ? `$${item.price}` : `₺${item.price}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Piyasa Değeri:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{item.marketCap}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {activeCategory === 'maden' && madenData.map((item) => (
          <Card key={item.code} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.code}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.name}
                  </p>
                </div>
                <div className={`text-sm font-medium ${
                  item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.change}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Alış:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.code.includes('AU') || item.code.includes('AG') ? `₺${item.buy}` : `$${item.buy}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Satış:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.code.includes('AU') || item.code.includes('AG') ? `₺${item.sell}` : `$${item.sell}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}