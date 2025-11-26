import { Database } from '@/lib/supabase'

type Investment = Database['public']['Tables']['investments']['Row']

interface ProfitCalculation {
  totalInvestment: number
  currentValue: number
  totalProfit: number
  profitPercentage: number
  status: 'active' | 'sold' | 'partial'
  details: {
    buyValue: number
    sellValue?: number
    unrealizedProfit?: number
    realizedProfit?: number
    currencyAmount: number
    buyPrice: number
    sellPrice?: number
    currentPrice: number
  }
}

/**
 * Yatırım için kar/zarar hesaplaması yapar
 * @param investment Yatırım verisi
 * @param currentPrice Mevcut döviz kuru (aktif yatırımlar için)
 * @returns Kar/zarar hesaplama sonuçları
 */
export function calculateInvestmentProfit(
  investment: Investment, 
  currentPrice?: number
): ProfitCalculation {
  const { 
    amount, 
    buy_price, 
    sell_price, 
    status,
    currency 
  } = investment

  // Alış değeri (TL cinsinden)
  const buyValue = amount * buy_price
  
  // Satış değeri (eğer satıldıysa)
  const sellValue = sell_price ? amount * sell_price : undefined
  
  // Mevcut değer (eğer hala aktifse)
  const currentValue = status === 'active' && currentPrice 
    ? amount * currentPrice 
    : sellValue || buyValue

  // Realized profit (satılmış yatırımlar için)
  const realizedProfit = sellValue ? sellValue - buyValue : undefined
  
  // Unrealized profit (aktif yatırımlar için)
  const unrealizedProfit = status === 'active' && currentPrice
    ? currentValue - buyValue
    : undefined

  // Toplam kar/zarar
  const totalProfit = realizedProfit ?? unrealizedProfit ?? 0

  // Yüzdesel kar/zarar
  const profitPercentage = buyValue > 0 ? (totalProfit / buyValue) * 100 : 0

  // Yatırım durumu
  const investmentStatus: 'active' | 'sold' | 'partial' = 
    status === 'sold' ? 'sold' : 
    status === 'active' ? 'active' : 'partial'

  return {
    totalInvestment: buyValue,
    currentValue,
    totalProfit,
    profitPercentage,
    status: investmentStatus,
    details: {
      buyValue,
      sellValue,
      unrealizedProfit,
      realizedProfit,
      currencyAmount: amount,
      buyPrice: buy_price,
      sellPrice: sell_price,
      currentPrice: currentPrice || sell_price || buy_price
    }
  }
}

/**
 * Birden fazla yatırım için toplam kar/zarar hesaplar
 * @param investments Yatırım dizisi
 * @param currentPrices Mevcut döviz kurları (currency => price)
 * @returns Toplam kar/zarar hesaplama sonuçları
 */
export function calculateTotalProfit(
  investments: Investment[],
  currentPrices: Record<string, number> = {}
): {
  totalInvestment: number
  currentValue: number
  totalProfit: number
  profitPercentage: number
  activeInvestments: number
  soldInvestments: number
  currencyBreakdown: Record<string, {
    investment: number
    currentValue: number
    profit: number
    percentage: number
  }>
} {
  let totalInvestment = 0
  let currentValue = 0
  let totalProfit = 0
  let activeCount = 0
  let soldCount = 0
  
  const currencyBreakdown: Record<string, {
    investment: number
    currentValue: number
    profit: number
    percentage: number
  }> = {}

  investments.forEach(investment => {
    const currentPrice = currentPrices[investment.currency]
    const calculation = calculateInvestmentProfit(investment, currentPrice)
    
    totalInvestment += calculation.totalInvestment
    currentValue += calculation.currentValue
    totalProfit += calculation.totalProfit
    
    if (investment.status === 'active') {
      activeCount++
    } else if (investment.status === 'sold') {
      soldCount++
    }

    // Para birimi bazında breakdown
    if (!currencyBreakdown[investment.currency]) {
      currencyBreakdown[investment.currency] = {
        investment: 0,
        currentValue: 0,
        profit: 0,
        percentage: 0
      }
    }
    
    currencyBreakdown[investment.currency].investment += calculation.totalInvestment
    currencyBreakdown[investment.currency].currentValue += calculation.currentValue
    currencyBreakdown[investment.currency].profit += calculation.totalProfit
  })

  // Her para birimi için yüzde hesapla
  Object.keys(currencyBreakdown).forEach(currency => {
    const breakdown = currencyBreakdown[currency]
    breakdown.percentage = breakdown.investment > 0 
      ? (breakdown.profit / breakdown.investment) * 100 
      : 0
  })

  const profitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0

  return {
    totalInvestment,
    currentValue,
    totalProfit,
    profitPercentage,
    activeInvestments: activeCount,
    soldInvestments: soldCount,
    currencyBreakdown
  }
}

/**
 * Kar/zarar detaylarını kullanıcı dostu formatta döndürür
 * @param calculation Kar/zarar hesaplama sonuçları
 * @returns Formatlanmış metin
 */
export function formatProfitDetails(calculation: ProfitCalculation): string {
  const { totalProfit, profitPercentage, details, status } = calculation
  
  const profitText = totalProfit >= 0 ? 'Kar' : 'Zarar'
  const sign = totalProfit >= 0 ? '+' : ''
  
  let description = `Alış fiyatı: ₺${details.buyPrice.toFixed(2)}, `
  
  if (status === 'sold' && details.sellPrice) {
    description += `Satış fiyatı: ₺${details.sellPrice.toFixed(2)}, `
    description += `Toplam fark: ₺${Math.abs(totalProfit).toFixed(2)}`
  } else {
    description += `Mevcut fiyat: ₺${details.currentPrice.toFixed(2)}, `
    description += `Beklenenen fark: ₺${Math.abs(totalProfit).toFixed(2)}`
  }
  
  return {
    netProfit: `${profitText}: ${sign}₺${totalProfit.toFixed(2)}`,
    percentage: `Yüzde Değişim: ${sign}${profitPercentage.toFixed(2)}%`,
    description,
    status: status === 'sold' ? 'Satılmış' : 'Aktif',
    type: totalProfit >= 0 ? 'profit' : 'loss'
  }
}

/**
 * Tarihe göre en yakın iş günü bulur
 * @param date Hedef tarih
 * @returns En yakın iş günü
 */
export function findNearestWorkingDay(date: Date): Date {
  const workingDay = new Date(date)
  
  // Eğer hafta sonuysa önceki Cuma'ya git
  const dayOfWeek = workingDay.getDay()
  if (dayOfWeek === 0) { // Pazar
    workingDay.setDate(workingDay.getDate() - 2)
  } else if (dayOfWeek === 6) { // Cumartesi
    workingDay.setDate(workingDay.getDate() - 1)
  }
  
  return workingDay
}