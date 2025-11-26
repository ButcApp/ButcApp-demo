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
      const currency = investment.currency
      const totalValue = investment.amount * investment.currentValue
      
      if (!acc[currency]) {
        acc[currency] = {
          currency,
          name: investment.currencyName,
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

  const radius = 120
  const centerX = radius
  const centerY = radius
  let currentAngle = -90 // Start from top

  const paths = chartData.map((segment) => {
    const angle = (segment.percentage / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180
    
    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)
    
    const largeArcFlag = angle > 180 ? 1 : 0
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')
    
    currentAngle = endAngle
    
    return {
      path: pathData,
      ...segment
    }
  })

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
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
              {/* Percentage labels */}
              {segment.percentage > 5 && (
                <text
                  x={centerX + (radius * 0.7) * Math.cos(((currentAngle - (segment.percentage * 3.6) / 2) * Math.PI) / 180)}
                  y={centerY + (radius * 0.7) * Math.sin(((currentAngle - (segment.percentage * 3.6) / 2) * Math.PI) / 180)}
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {segment.percentage.toFixed(1)}%
                </text>
              )}
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

function getCurrencyColor(currency: string): string {
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
  
  return colors[currency] || '#6b7280' // gray-500 default
}