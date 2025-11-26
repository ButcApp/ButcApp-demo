import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface Investment {
  id: string
  currency: string
  currency_name: string
  amount: number
  buy_price: number
  buy_date: string
  sell_price?: number
  sell_date?: string
  current_value: number
  profit: number
  profit_percent: number
  status: 'active' | 'sold' | 'partial'
}

interface CurrencyStats {
  totalInvestment: number
  currentValue: number
  totalProfit: number
  profitPercentage: number
  investmentsCount: number
}

interface OverallStats {
  totalInvestment: number
  currentValue: number
  totalProfit: number
  profitPercentage: number
  investmentsCount: number
}

interface SummaryStatisticsProps {
  investments: Investment[]
}

// Format price function
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

// Currency color palette
const currencyColors: Record<string, string> = {
  'USD/TRY': 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
  'EUR/TRY': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
  'GBP/TRY': 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
  'CHF/TRY': 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
  'SEK/TRY': 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
  'DKK/TRY': 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  'NOK/TRY': 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200',
  'CAD/TRY': 'bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200',
  'AUD/TRY': 'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200',
  'JPY/TRY': 'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200',
  'KWD/TRY': 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
  'SAR/TRY': 'bg-lime-100 text-lime-800 border-lime-200 hover:bg-lime-200',
  'BGN/TRY': 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
  'RON/TRY': 'bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200',
  'RUB/TRY': 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200',
  'IRR/TRY': 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate200',
  'CNY/TRY': 'bg-zinc-100 text-zinc-800 border-zinc-200 hover:bg-zinc-200',
  'PKR/TRY': 'bg-stone-100 text-stone-800 border-stone-200 hover:bg-stone-200',
  'QAR/TRY': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 hover:bg-fuchsia-200',
  'AZN/TRY': 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
}

// Summary Statistics Component
export const SummaryStatistics: React.FC<SummaryStatisticsProps> = ({ investments }: SummaryStatisticsProps) => {
  // Calculate currency-wise statistics
  const currencyStats: Record<string, CurrencyStats> = {}
  
  Array.from(new Set(investments.map(inv => inv.currency))).forEach(currency => {
    const currencyInvestments = investments.filter(inv => inv.currency === currency)
    const totalInvestment = currencyInvestments.reduce((sum, inv) => sum + (inv.amount * inv.buy_price), 0)
    const currentValue = currencyInvestments.reduce((sum, inv) => sum + inv.current_value, 0)
    const totalProfit = currencyInvestments.reduce((sum, inv) => sum + inv.profit, 0)
    const profitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0
    
    currencyStats[currency] = {
      totalInvestment,
      currentValue,
      totalProfit,
      profitPercentage,
      investmentsCount: currencyInvestments.length
    }
  })

  // Calculate overall statistics
  const totalInvestment = investments.reduce((sum, inv) => sum + (inv.amount * inv.buy_price), 0)
  const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.current_value, 0)
  const totalProfit = investments.reduce((sum, inv) => sum + inv.profit, 0)
  const profitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0
  const investmentsCount = investments.length

  const overallStats: OverallStats = {
    totalInvestment,
    currentValue: totalCurrentValue,
    totalProfit,
    profitPercentage,
    investmentsCount
  }

  // Return early if no investments
  if (investments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">İstatistik Verisi Bulunamadı</h3>
          <p className="text-muted-foreground">Henüz yatırım verisi bulunmuyor</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Currency-wise Statistics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-center">Döviz Bazında İstatistikler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(currencyStats).map(([currency, stats]) => {
            const colorClass = currencyColors[currency as keyof typeof currencyColors] || 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
            
            return (
              <Card key={currency} className={`${colorClass} transition-all hover:shadow-lg hover:scale-105`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-lg">{currency.split('/')[0]}</div>
                    <div className="text-sm opacity-75">
                      {stats.investmentsCount} yatırım • {stats.totalInvestment > 0 ? `₺${formatPrice(stats.totalInvestment)}` : '₺0'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">
                        ₺{formatPrice(stats.currentValue)}
                      </div>
                      <div className="text-sm opacity-75">Mevcut Değer</div>
                    </div>
                    
                    <div>
                      <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.totalProfit >= 0 ? '+' : ''}₺{formatPrice(stats.totalProfit)}
                      </div>
                      <div className="text-sm opacity-75">Kar/Zarar</div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className={`text-sm font-medium ${stats.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {stats.totalProfit >= 0 ? 'Kâr' : 'Zarar'} ({stats.totalProfit >= 0 ? '+' : ''}{stats.profitPercentage.toFixed(2)}%)
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
      
      {/* Overall Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-center">Genel Özet</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                ₺{formatPrice(overallStats.totalInvestment)}
              </div>
              <div className="text-sm text-blue-700">Toplam Yatırım</div>
            </CardContent>
          </Card>
                  
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                ₺{formatPrice(overallStats.currentValue)}
              </div>
              <div className="text-sm text-green-700">Mevcut Değer</div>
            </CardContent>
          </Card>
                  
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${
                overallStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {overallStats.totalProfit >= 0 ? '+' : ''}₺{formatPrice(overallStats.totalProfit)}
              </div>
              <div className="text-sm text-purple-700">Toplam Kar/Zarar</div>
            </CardContent>
          </Card>
                  
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${
                overallStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(() => {
                  const percentage = overallStats.totalInvestment > 0 ? (overallStats.totalProfit / overallStats.totalInvestment) * 100 : 0
                  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`
                })()}
              </div>
              <div className="text-sm text-orange-700">Yüzde Değişim</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SummaryStatistics