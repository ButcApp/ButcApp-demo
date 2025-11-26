'use client'

import { useMemo } from 'react'
import { Investment } from '@/app/app/investments/page'

interface PieChartProps {
  investments: Investment[]
}

export function PieChart({ investments }: PieChartProps) {
  const chartData = useMemo(() => {
    if (investments.length === 0) return []
    
    // Group investments by currency and calculate total value
    const currencyGroups = investments.reduce((acc, investment) => {
      // Extract currency code from symbol (USD from USD/TRY, EUR from EUR/TRY, etc.)
      const currencyCode = investment.currency.split('/')[0]
      const currency = currencyCode || investment.currency
      
      const totalValue = investment.amount * investment.current_value
      
      if (!acc[currency]) {
        acc[currency] = {
          currency,
          name: investment.currency_name,
          value: 0,
          count: 0
        }
      }
      
      acc[currency].value += totalValue
      acc[currency].count += 1
      
      return acc
    }, {} as Record<string, { currency: string; name: string; value: number; count: number }>)
    
    const totalValue = Object.values(currencyGroups).reduce((sum, group) => sum + group.value, 0)
    
    return Object.values(currencyGroups).map(group => ({
      ...group,
      percentage: totalValue > 0 ? (group.value / totalValue) * 100 : 0,
      color: getCurrencyColor(group.currency)
    })).sort((a, b) => b.value - a.value)
  }, [investments])
  
  if (investments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-32 h-32 border-4 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-4">
          <span className="text-gray-500 text-sm">Veri Yok</span>
        </div>
        <p className="text-muted-foreground">Henüz yatırım verisi bulunmuyor</p>
      </div>
    )
  }

  function getCurrencyColor(currency: string): string {
    // Extract currency code from symbol (USD from USD/TRY, EUR from EUR/TRY, etc.)
    const currencyCode = currency.split('/')[0]
    
    const colors: Record<string, string> = {
      'USD': '#10b981', // green
      'EUR': '#3b82f6', // blue
      'GBP': '#8b5cf6', // purple
      'CHF': '#f59e0b', // amber
      'SEK': '#ef4444', // red
      'DKK': '#06b6d4', // cyan
      'NOK': '#84cc16', // lime
      'CAD': '#f97316', // orange
      'AUD': '#ec4899', // pink
      'JPY': '#6366f1', // indigo
      'KWD': '#14b8a6', // teal
      'SAR': '#a855f7', // violet
      'BGN': '#0ea5e9', // sky
      'RON': '#22c55e', // emerald
      'RUB': '#dc2626', // rose
      'IRR': '#fbbf24', // yellow
      'CNY': '#ef4444', // red (China)
      'PKR': '#f97316', // orange
      'QAR': '#06b6d4', // cyan
      'AZN': '#3b82f6'  // blue
    }
    
    return colors[currencyCode] || '#94a3b8' // default gray
  }

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 w-full">
      {/* Pie Chart */}
      <div className="flex-shrink-0">
        <svg width={radius * 2} height={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
          {paths.map((segment, index) => (
            <g key={segment.currency}>
              <path
                d={segment.path}
                fill={segment.color}
                stroke="white"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex-1 space-y-3">
        <h3 className="font-semibold text-lg mb-4">Portföy Dağılımı</h3>
        {chartData.map((segment) => (
          <div key={segment.currency} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: segment.color }}
              />
              <div>
                <div className="font-medium">{segment.currency}</div>
                <div className="text-sm text-muted-foreground">{segment.name}</div>
                <div className="text-xs text-muted-foreground">{segment.count} yatırım</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">₺{segment.value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="text-sm text-muted-foreground">{segment.percentage.toFixed(1)}%</div>
            </div>
          </div>
        ))}
        
        {/* Total */}
        <div className="pt-3 mt-3 border-t">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Toplam Değer</span>
            <span className="font-bold text-lg">
              ₺{chartData.reduce((sum, segment) => sum + segment.value, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}