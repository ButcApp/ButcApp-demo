'use client'

import { useMemo } from 'react'
import { Investment } from '@/app/app/investments/page'

interface ProfitChartProps {
  investments: Investment[]
  selectedCurrency: string
}

export function ProfitChart({ investments, selectedCurrency }: ProfitChartProps) {
  const chartData = useMemo(() => {
    if (investments.length === 0) return []

    // Filter investments based on selected currency
    const filteredInvestments = selectedCurrency === 'all' 
      ? investments 
      : investments.filter(inv => inv.currency === selectedCurrency)

    if (filteredInvestments.length === 0) {
      return {
        investments: [],
        totalInvestment: 0,
        currentValue: 0,
        totalProfit: 0,
        profitPercentage: 0
      }
    }

    // Sort by buy date
    const sortedInvestments = [...filteredInvestments].sort((a, b) => 
      new Date(a.buy_date).getTime() - new Date(b.buy_date).getTime()
    )

    // Calculate cumulative data
    const totalInvestment = sortedInvestments.reduce((sum, inv) => sum + (inv.amount * inv.buy_price), 0)
    const currentValue = sortedInvestments.reduce((sum, inv) => sum + (inv.amount * inv.current_value), 0)
    const totalProfit = currentValue - totalInvestment
    const profitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0

    return {
      investments: sortedInvestments,
      totalInvestment,
      currentValue,
      totalProfit,
      profitPercentage
    }
  }, [investments, selectedCurrency])

  if (chartData.investments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-32 h-32 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
          <span className="text-gray-500 text-sm">Veri Yok</span>
        </div>
        <p className="text-muted-foreground">
          {selectedCurrency === 'all' ? 'Henüz yatırım verisi bulunmuyor' : `${selectedCurrency} için yatırım verisi bulunmuyor`}
        </p>
      </div>
    )
  }

  // Create bar chart data
  const maxValue = Math.max(
    chartData.totalInvestment,
    chartData.currentValue,
    ...chartData.investments.map(inv => inv.amount * inv.buyPrice),
    ...chartData.investments.map(inv => inv.amount * inv.currentValue)
  )

  const chartHeight = 300
  const chartWidth = 600
  const barWidth = Math.min(60, (chartWidth - 100) / chartData.investments.length - 10)
  const scale = (chartHeight - 60) / maxValue

  return (
    <div className="w-full space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            ₺{chartData.totalInvestment.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-muted-foreground">Toplam Yatırım</div>
        </div>
        
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            ₺{chartData.currentValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-muted-foreground">Mevcut Değer</div>
        </div>
        
        <div className="text-center p-4 border rounded-lg">
          <div className={`text-2xl font-bold ${chartData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {chartData.totalProfit >= 0 ? '+' : ''}₺{chartData.totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-muted-foreground">
            Kar/Zarar ({chartData.profitPercentage >= 0 ? '+' : ''}{chartData.profitPercentage.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[650px]">
          <h3 className="font-semibold text-lg mb-4">Yatırım Kar/Zarar Analizi</h3>
          
          <svg width={chartWidth} height={chartHeight} className="w-full">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent) => {
              const y = chartHeight - 30 - (percent * scale * maxValue / 100)
              return (
                <g key={percent}>
                  <line
                    x1={50}
                    y1={y}
                    x2={chartWidth - 50}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeDasharray="2,2"
                  />
                  <text
                    x={40}
                    y={y + 5}
                    textAnchor="end"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    ₺{(maxValue * percent / 100).toFixed(0)}
                  </text>
                </g>
              )
            })}

            {/* Bars */}
            {chartData.investments.map((investment, index) => {
              const buyValue = investment.amount * investment.buy_price
              const currentValue = investment.amount * investment.current_value
              const profit = currentValue - buyValue
              
              const buyHeight = buyValue * scale
              const currentHeight = currentValue * scale
              const profitHeight = Math.abs(profit) * scale
              
              const x = 60 + index * (barWidth + 10)
              const buyY = chartHeight - 30 - buyHeight
              const currentY = chartHeight - 30 - currentHeight
              
              return (
                <g key={investment.id}>
                  {/* Buy value bar */}
                  <rect
                    x={x}
                    y={buyY}
                    width={barWidth}
                    height={buyHeight}
                    fill="#3b82f6"
                    opacity={0.7}
                  />
                  
                  {/* Current value bar */}
                  <rect
                    x={x + barWidth / 3}
                    y={currentY}
                    width={barWidth / 3}
                    height={currentHeight}
                    fill={profit >= 0 ? '#10b981' : '#ef4444'}
                    opacity={0.8}
                  />
                  
                  {/* Profit/Loss indicator */}
                  {profit !== 0 && (
                    <rect
                      x={x + barWidth * 2/3}
                      y={chartHeight - 30 - Math.max(buyHeight, currentHeight) - 20}
                      width={barWidth / 3}
                      height={20}
                      fill={profit >= 0 ? '#10b981' : '#ef4444'}
                    />
                  )}
                  
                  {/* Labels */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#374151"
                  >
                    {investment.currency}
                  </text>
                  
                  <text
                    x={x + barWidth / 2}
                    y={buyY - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#3b82f6"
                  >
                    ₺{buyValue.toFixed(0)}
                  </text>
                  
                  <text
                    x={x + barWidth / 2}
                    y={currentY - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill={profit >= 0 ? '#10b981' : '#ef4444'}
                  >
                    ₺{currentValue.toFixed(0)}
                  </text>
                  
                  {profit !== 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - 30 - Math.max(buyHeight, currentHeight) - 25}
                      textAnchor="middle"
                      fontSize="10"
                      fill="white"
                      fontWeight="bold"
                    >
                      {profit >= 0 ? '+' : ''}{profit.toFixed(0)}
                    </text>
                  )}
                </g>
              )
            })}
            
            {/* Zero line */}
            <line
              x1={50}
              y1={chartHeight - 30}
              x2={chartWidth - 50}
              y2={chartHeight - 30}
              stroke="#374151"
              strokeWidth="2"
            />
          </svg>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 opacity-70 rounded"></div>
              <span className="text-sm">Alış Değeri</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 opacity-80 rounded"></div>
              <span className="text-sm">Mevcut Değer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Kar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Zarar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Details */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Yatırım Detayları</h3>
        {chartData.investments.map((investment) => {
          const buyValue = investment.amount * investment.buy_price
          const currentValue = investment.amount * investment.current_value
          const profit = currentValue - buyValue
          const profitPercentage = buyValue > 0 ? (profit / buyValue) * 100 : 0
          
          return (
            <div key={investment.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{investment.currency} - {investment.currency_name}</div>
                <div className="text-sm text-muted-foreground">
                  Alış: {new Date(investment.buy_date).toLocaleDateString('tr-TR')} • {investment.amount} adet
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-right">
                <div>
                  <div className="text-sm text-muted-foreground">Alış</div>
                  <div className="font-medium">₺{buyValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Mevcut</div>
                  <div className="font-medium">₺{currentValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Kar/Zarar</div>
                  <div className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profit >= 0 ? '+' : ''}₺{profit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <div className="text-xs">
                      ({profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}