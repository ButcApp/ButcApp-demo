'use client'

import { useMemo } from 'react'
import { Investment } from '@/app/app/investments/page'

interface ProfitChartProps {
  investments: Investment[]
  selectedCurrency: string
}

export function ProfitChart({ investments, selectedCurrency }: ProfitChartProps) {
  const chartData = useMemo(() => {
    console.log('ProfitChart - investments received:', investments)
    console.log('ProfitChart - selectedCurrency:', selectedCurrency)
    
    if (!investments || investments.length === 0) {
      console.log('ProfitChart - No investments provided')
      return {
        investments: [],
        totalInvestment: 0,
        currentValue: 0,
        totalProfit: 0,
        profitPercentage: 0
      }
    }

    // Filter investments based on selected currency
    const filteredInvestments = selectedCurrency === 'all' 
      ? investments 
      : investments.filter(inv => inv.currency === selectedCurrency)

    console.log('ProfitChart - filteredInvestments:', filteredInvestments)
    
    if (!filteredInvestments || filteredInvestments.length === 0) {
      console.log('ProfitChart - No filtered investments')
      return {
        investments: [],
        totalInvestment: 0,
        currentValue: 0,
        totalProfit: 0,
        profitPercentage: 0
      }
    }

    // Sort by buy date and validate data
    const sortedInvestments = filteredInvestments
      .filter(inv => inv && inv.buy_price && inv.current_value && inv.amount && inv.buy_date)
      .sort((a, b) => {
        const dateA = new Date(a.buy_date).getTime()
        const dateB = new Date(b.buy_date).getTime()
        return dateA - dateB
      })

    console.log('ProfitChart - sortedInvestments:', sortedInvestments)

    // Calculate totals with extensive validation
    const totals = sortedInvestments.reduce((acc, inv) => {
      const buyPrice = Number(inv.buy_price) || 0
      const currentValue = Number(inv.current_value) || 0
      const amount = Number(inv.amount) || 0
      
      if (isNaN(buyPrice) || isNaN(currentValue) || isNaN(amount)) {
        console.log('Invalid investment data:', { buyPrice, currentValue, amount })
        return acc
      }
      
      const buyValue = buyPrice * amount
      const currentVal = currentValue * amount
      
      console.log(`Investment ${inv.currency}: buyValue=${buyValue}, currentVal=${currentVal}, amount=${amount}`)
      
      acc.totalInvestment += buyValue
      acc.currentValue += currentVal
      acc.profit += (currentVal - buyValue)
      
      return acc
    }, {
      totalInvestment: 0,
      currentValue: 0,
      totalProfit: 0,
      profitPercentage: 0
    })

    console.log('ProfitChart - calculated totals:', totals)

    const { totalInvestment, currentValue, totalProfit } = totals

    // Calculate max value for scaling
    const allValues = sortedInvestments.map(inv => ({
      buyValue: (Number(inv.buy_price) || 0) * (Number(inv.amount) || 0),
      currentValue: (Number(inv.current_value) || 0) * (Number(inv.amount) || 0)
    }))

    const maxValue = Math.max(...allValues, 1)

    console.log('ProfitChart - maxValue:', maxValue)

    if (maxValue <= 0 || isNaN(maxValue)) {
      console.log('Invalid maxValue, using fallback')
      return {
        investments: sortedInvestments,
        totalInvestment: 0,
        currentValue: 0,
        totalProfit: 0,
        profitPercentage: 0
      }
    }

    const profitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0

    return {
      investments: sortedInvestments,
      totalInvestment,
      currentValue,
      totalProfit,
      profitPercentage
    }
  }, [investments, selectedCurrency])

  // Render chart only if we have valid data
  if (!chartData || !chartData.investments || chartData.investments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Grafik Verisi Bulunamadı</h3>
          <p className="text-muted-foreground">
            {selectedCurrency === 'all' ? 'Henüz yatırım verisi bulunmuyor' : `${selectedCurrency} için yatırım verisi bulunmuyor`}
          </p>
        </div>
      </div>
    )
  }

  // Extract data from chartData for easier access
  const { investments: investmentData, totalInvestment, currentValue, totalProfit, profitPercentage } = chartData

  const chartHeight = 300
  const chartWidth = 600
  
  // Calculate maximum value for scaling
  const maxValue = Math.max(
    ...investmentData.map(inv => {
      const buyValue = (Number(inv.buy_price) || 0) * (Number(inv.amount) || 0)
      const currentValue = (Number(inv.current_value) || 0) * (Number(inv.amount) || 0)
      const maxValue = Math.max(buyValue, currentValue)
      return !isNaN(maxValue) && maxValue > 0 ? maxValue : 1
    }),
    1 // Minimum fallback value
  )
  
  const scale = maxValue > 0 ? (chartHeight - 60) / maxValue : 0

  return (
    <div className="w-full space-y-6">
      <h3 className="font-semibold text-lg mb-4">Yatırım Kar/Zarar Analizi</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            ₺{totalInvestment.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-muted-foreground">Toplam Yatırım</div>
        </div>
        
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            ₺{currentValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-muted-foreground">Mevcut Değer</div>
        </div>
        
        <div className="text-center p-4 border rounded-lg">
          <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalProfit >= 0 ? '+' : ''}₺{totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-muted-foreground">
            Kar/Zarar ({profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-lg border">
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => {
            const y = chartHeight - 30 - ((percent || 0) * scale * maxValue / 100)
            const yValue = Math.max(0, chartHeight - 30 - ((percent || 0) * scale * maxValue / 100))
            
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
                  y={yValue - 5}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {percent}%
                </text>
              </g>
            )
          })}
          
          {/* Bars */}
          {investmentData.map((investment, index) => {
            const buyValue = (Number(investment.buy_price) || 0) * (Number(investment.amount) || 0)
            const currentValue = (Number(investment.current_value) || 0) * (Number(investment.amount) || 0)
            const profit = currentValue - buyValue
            const profitHeight = Math.abs(profit) * scale
            
            console.log('Investment:', {
              id: investment.id,
              buyValue,
              currentValue,
              profit,
              scale,
              profitHeight
            })
            
            const x = 60 + index * 70
            const buyHeight = buyValue * scale
            const currentHeight = currentValue * scale
            
            return (
              <g key={investment.id}>
                {/* Buy value bar */}
                <rect
                  x={x}
                  y={chartHeight - 30 - (typeof buyHeight === 'number' && !isNaN(buyHeight) && buyHeight > 0 ? buyHeight : 0)}
                  width={50}
                  height={typeof buyHeight === 'number' && !isNaN(buyHeight) && buyHeight > 0 ? buyHeight : 0}
                  fill="#3b82f6"
                  opacity={0.7}
                />
                
                {/* Current value bar */}
                <rect
                  x={x + 20}
                  y={chartHeight - 30 - (typeof currentHeight === 'number' && !isNaN(currentHeight) && currentHeight > 0 ? currentHeight : 0)}
                  width={50}
                  height={typeof currentHeight === 'number' && !isNaN(currentHeight) && currentHeight > 0 ? currentHeight : 0}
                  fill={profit >= 0 ? '#10b981' : '#ef4444'}
                  opacity={0.8}
                />
                
                {/* Profit/Loss indicator */}
                {profit !== 0 && typeof profitHeight === 'number' && !isNaN(profitHeight) && profitHeight > 0 && (
                  <rect
                    x={x + 35}
                    y={chartHeight - 30 - profitHeight - 5}
                    width={30}
                    height={5}
                    fill={profit >= 0 ? '#10b981' : '#ef4444'}
                  />
                )}
                
                {/* Investment info */}
                <text
                  x={x + 25}
                  y={chartHeight - 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#374151"
                >
                  {investment.currency}
                </text>
                
                {/* Profit/Loss text */}
                <text
                  x={x + 25}
                  y={chartHeight - 30}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill={profit >= 0 ? '#10b981' : '#ef4444'}
                >
                  {profit >= 0 ? '+' : ''}₺{profit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Investment Details */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Yatırım Detayları</h3>
        {chartData.investments.map((investment) => {
          const buyValue = (Number(investment.buy_price) || 0) * (Number(investment.amount) || 0)
          const currentValue = (Number(investment.current_value) || 0) * (Number(investment.amount) || 0)
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