import { NextRequest, NextResponse } from 'next/server'

interface PnlRequest {
  buyPrice: number
  sellPrice: number
  amount: number
  buyDate: string
  sellDate: string
}

interface PnlResponse {
  buyPrice: number
  sellPrice: number
  profitTL: number
  percentChange: number
  buyDateUsed: string
  sellDateUsed: string
  message: string
}

interface PriceData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  forexBuying?: number
  forexSelling?: number
}

/**
 * Tarihe göre en yakın önceki iş gününü bulur
 * Hafta sonları ve resmi tatilleri atlar
 */
function findPreviousWorkingDay(targetDate: Date): Date {
  const workingDay = new Date(targetDate)
  
  // Önce bir gün geri git
  workingDay.setDate(workingDay.getDate() - 1)
  
  // Hafta sonlarını atla (Pazar=0, Cumartesi=6)
  while (workingDay.getDay() === 0 || workingDay.getDay() === 6) {
    workingDay.setDate(workingDay.getDate() - 1)
  }
  
  return workingDay
}

/**
 * TCMB'den belirli bir tarihteki döviz kurunu çeker
 * Fiyat bulunamazsa en yakın önceki iş gününü dener
 */
async function resolvePriceWithFallback(
  currency: string, 
  targetDate: string, 
  maxAttempts: number = 30
): Promise<{ price: number; dateUsed: string }> {
  let currentDate = new Date(targetDate)
  let attempts = 0
  
  while (attempts < maxAttempts) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const [year, month, day] = dateStr.split('-')
    
    try {
      // TCMB API URL oluştur
      const tcmbDate = `${day}.${month}.${year}`
      const url = `https://www.tcmb.gov.tr/kurlar/${year}${month}/${day}${month}${year}.xml`
      
      console.log(`Trying to fetch ${currency} price for date: ${tcmbDate}`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const xmlText = await response.text()
      
      // XML'den fiyatı çıkar
      const pricePattern = new RegExp(
        `<Currency[^>]*Kod="${currency}"[^>]*>.*?<ForexBuying>([^<]*)</ForexBuying>.*?<ForexSelling>([^<]*)</ForexSelling>`, 
        'is'
      )
      
      const match = xmlText.match(pricePattern)
      
      if (match && match[1] && match[2]) {
        const forexBuying = parseFloat(match[1].replace(',', '.'))
        const forexSelling = parseFloat(match[2].replace(',', '.'))
        
        if (!isNaN(forexBuying) && !isNaN(forexSelling)) {
          const averagePrice = (forexBuying + forexSelling) / 2
          console.log(`Found ${currency} price for ${dateStr}: ${averagePrice}`)
          return {
            price: averagePrice,
            dateUsed: dateStr
          }
        }
      }
    } catch (error) {
      console.log(`Failed to fetch ${currency} price for ${dateStr}:`, error.message)
    }
    
    // Bir önceki iş gününe git
    currentDate = findPreviousWorkingDay(currentDate)
    attempts++
  }
  
  throw new Error(`${currency} döviz kuru ${targetDate} tarihi ve önceki ${maxAttempts} iş günü içinde bulunamadı`)
}

/**
 * Kar/Zarar (P&L) hesaplar
 */
function calculatePnl(
  buyPrice: number,
  sellPrice: number,
  amount: number
): { profitTL: number; percentChange: number } {
  const profitTL = (sellPrice - buyPrice) * amount
  const percentChange = buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0
  
  return {
    profitTL,
    percentChange
  }
}

/**
 * Ana API handler
 */
export async function POST(request: NextRequest) {
  try {
    const body: PnlRequest = await request.json()
    
    // Input validation
    if (!body.buyPrice || !body.sellPrice || !body.amount || !body.buyDate || !body.sellDate) {
      return NextResponse.json({
        success: false,
        error: 'Eksik parametreler. buyPrice, sellPrice, amount, buyDate, sellDate gerekli.',
        required: ['buyPrice', 'sellPrice', 'amount', 'buyDate', 'sellDate']
      }, { status: 400 })
    }
    
    const { buyPrice, sellPrice, amount, buyDate, sellDate } = body
    
    // Validasyonlar
    if (buyPrice <= 0 || sellPrice <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Fiyatlar 0\'dan büyük olmalıdır.',
        buyPrice,
        sellPrice
      }, { status: 400 })
    }
    
    if (amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Miktar 0\'dan büyük olmalıdır.',
        amount
      }, { status: 400 })
    }
    
    // Tarih formatı kontrolü
    const buyDateObj = new Date(buyDate)
    const sellDateObj = new Date(sellDate)
    
    if (isNaN(buyDateObj.getTime()) || isNaN(sellDateObj.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz tarih formatı. YYYY-MM-DD formatında olmalı.',
        buyDate,
        sellDate
      }, { status: 400 })
    }
    
    if (buyDateObj >= sellDateObj) {
      return NextResponse.json({
        success: false,
        error: 'Satış tarihi, alış tarihinden sonra olmalıdır.',
        buyDate,
        sellDate
      }, { status: 400 })
    }
    
    console.log(`Calculating P&L for ${amount} units: Buy ${buyPrice} on ${buyDate}, Sell ${sellPrice} on ${sellDate}`)
    
    // Kar/Zarar hesapla
    const { profitTL, percentChange } = calculatePnl(buyPrice, sellPrice, amount)
    
    // Mesaj oluştur
    const profitType = profitTL >= 0 ? 'kar' : 'zarar'
    const sign = profitTL >= 0 ? '+' : ''
    const message = `Alış ${buyPrice} TL, satış ${sellPrice} TL. Net ${profitType} ${sign}${Math.abs(profitTL).toFixed(2)} TL (${sign}${percentChange.toFixed(2)}%).`
    
    const response: PnlResponse = {
      buyPrice,
      sellPrice,
      profitTL,
      percentChange,
      buyDateUsed: buyDate,
      sellDateUsed: sellDate,
      message
    }
    
    console.log('P&L calculation completed:', response)
    
    return NextResponse.json({
      success: true,
      data: response
    })
    
  } catch (error) {
    console.error('P&L calculation error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Kar/Zarar hesaplanırken hata oluştu.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

/**
 * TCMB verisi ile fiyat çözümleme yapan endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const currency = searchParams.get('currency')
    const date = searchParams.get('date')
    
    if (!currency || !date) {
      return NextResponse.json({
        success: false,
        error: 'currency ve date parametreleri gerekli.',
        example: '/api/pnl?currency=USD&date=2024-01-15'
      }, { status: 400 })
    }
    
    const result = await resolvePriceWithFallback(currency, date)
    
    return NextResponse.json({
      success: true,
      data: {
        currency,
        requestedDate: date,
        price: result.price,
        actualDate: result.dateUsed,
        message: `${currency} döviz kuru ${result.dateUsed} tarihi için: ${result.price} TL`
      }
    })
    
  } catch (error) {
    console.error('Price resolution error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Döviz kuru bulunamadı.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 404 })
  }
}