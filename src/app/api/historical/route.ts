import { NextRequest, NextResponse } from 'next/server'

interface HistoricalItem {
  symbol: string
  name: string
  price: number
  type: 'currency' | 'crypto'
  timestamp: string
}

const CRYPTO_ICONS: Record<string, string> = {
  'BTC': 'text-orange-500',
  'ETH': 'text-blue-500',
  'BNB': 'text-yellow-500',
  'SOL': 'text-purple-500',
  'XRP': 'text-gray-600',
  'ADA': 'text-blue-600',
  'DOGE': 'text-amber-500',
  'DOT': 'text-pink-500',
  'MATIC': 'text-purple-600',
  'AVAX': 'text-red-500'
}

// Fallback data for historical prices
const getFallbackData = (date: string, type: 'currency' | 'crypto'): HistoricalItem[] => {
  const baseDate = new Date(date)
  
  if (type === 'crypto') {
    return [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 90000 + Math.random() * 5000,
        type: 'crypto',
        timestamp: baseDate.toISOString()
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3000 + Math.random() * 500,
        type: 'crypto',
        timestamp: baseDate.toISOString()
      },
      {
        symbol: 'BNB',
        name: 'Binance Coin',
        price: 300 + Math.random() * 50,
        type: 'crypto',
        timestamp: baseDate.toISOString()
      }
    ]
  } else {
    return [
      {
        symbol: 'USD/TRY',
        name: 'ABD DOLARI',
        price: 32 + Math.random() * 2,
        type: 'currency',
        timestamp: baseDate.toISOString()
      },
      {
        symbol: 'EUR/TRY',
        name: 'EURO',
        price: 35 + Math.random() * 2,
        type: 'currency',
        timestamp: baseDate.toISOString()
      }
    ]
  }
}

async function fetchCurrencyHistoricalData(date: string) {
  try {
    const [year, month, day] = date.split('-').map(Number)
    let checkDate = new Date(year, month - 1, day)
    
    // Find previous working day (not weekend)
    while (true) {
      const dayOfWeek = checkDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        break
      }
      checkDate.setDate(checkDate.getDate() - 1)
      
      // Safety check: don't go back more than 30 days
      const daysDiff = Math.floor((new Date(year, month - 1, day).getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 30) {
        return []
      }
    }
    
    const tcmbDate = `${checkDate.getDate()}.${String(checkDate.getMonth() + 1).padStart(2, '0')}.${checkDate.getFullYear()}`
    const url = `https://www.tcmb.gov.tr/kurlar/${year}${month}/${tcmbDate}${month}${year}.xml`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      return null
    }
    
    const xmlText = await response.text()
    
    const currencies = [
      { code: 'USD', name: 'ABD DOLARI', symbol: 'USD/TRY' },
      { code: 'EUR', name: 'EURO', symbol: 'EUR/TRY' },
      { code: 'GBP', name: 'İNGİLİZ STERLİNİ', symbol: 'GBP/TRY' },
      { code: 'CHF', name: 'İSVİÇRE FRANGI', symbol: 'CHF/TRY' },
      { code: 'SEK', name: 'İSVEÇ KRONU', symbol: 'SEK/TRY' },
      { code: 'DKK', name: 'DANİMARKA KRONU', symbol: 'DKK/TRY' },
      { code: 'NOK', name: 'NORVEÇ KRONU', symbol: 'NOK/TRY' },
      { code: 'CAD', name: 'KANADA DOLARI', symbol: 'CAD/TRY' },
      { code: 'AUD', name: 'AVUSTRALYA DOLARI', symbol: 'AUD/TRY' },
      { code: 'JPY', name: 'JAPON YENİ', symbol: 'JPY/TRY' },
      { code: 'KWD', name: 'KUVEYT DİNARI', symbol: 'KWD/TRY' },
      { code: 'SAR', name: 'SUUDİ ARABİSTAN RİYALİ', symbol: 'SAR/TRY' },
      { code: 'BGN', name: 'BULGAR LEVASI', symbol: 'BGN/TRY' },
      { code: 'RON', name: 'RUMEN LEYİ', symbol: 'RON/TRY' },
      { code: 'RUB', name: 'RUS RUBLESİ', symbol: 'RUB/TRY' },
      { code: 'IRR', name: 'İRAN RİYALİ', symbol: 'IRR/TRY' },
      { code: 'CNY', name: 'ÇİN YUANI', symbol: 'CNY/TRY' },
      { code: 'PKR', name: 'PAKİSTAN RUPİSİ', symbol: 'PKR/TRY' },
      { code: 'QAR', name: 'KATAR RİYALİ', symbol: 'QAR/TRY' },
      { code: 'AZN', name: 'AZERBAYCAN MANATI', symbol: 'AZN/TRY' }
    ]
    
    const result = currencies.map(currency => {
      const forexBuyingPattern = new RegExp(`<Currency[^>]*Kod="${currency.code}"[^>]*>.*?<ForexBuying>([^<]*)</ForexBuying>`, 'is')
      const forexSellingPattern = new RegExp(`<Currency[^>]*Kod="${currency.code}"[^>]*>.*?<ForexSelling>([^<]*)</ForexSelling>`, 'is')
      const changePattern = new RegExp(`<Currency[^>]*Kod="${currency.code}"[^>]*>.*?<Change>([^<]*)</Change>`, 'is')
      
      const forexBuyingMatch = xmlText.match(forexBuyingPattern)
      const forexSellingMatch = xmlText.match(forexSellingPattern)
      const changeMatch = xmlText.match(changePattern)
      
      if (forexBuyingMatch && forexSellingMatch) {
        const forexBuying = parseFloat(forexBuyingMatch[1]?.replace(',', '.') || '0')
        const forexSelling = parseFloat(forexSellingMatch[1]?.replace(',', '.') || '0')
        const change = parseFloat(changeMatch?.[1]?.replace(',', '.') || '0')
        
        const price = (forexBuying + forexSelling) / 2
        const changePercent = price > 0 ? (change / price) * 100 : 0
        
        return {
          symbol: currency.symbol,
          name: currency.name,
          price: price || 0,
          type: 'currency' as const,
          timestamp: new Date(date).toISOString()
        }
      }
      
      return null
    }).filter(currency => currency && currency.price > 0)
    
    return result.length > 0 ? result : null
  } catch (error) {
    console.error('Currency historical fetch error:', error)
    return null
  }
}

async function fetchCryptoHistoricalData(date: string, cryptoId?: string) {
  try {
    // Using CoinGecko free API for historical data
    let url = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${date}&vs_currency=usd`
    
    if (cryptoId && cryptoId !== 'bitcoin') {
      url = `https://api.coingecko.com/api/v3/coins/${cryptoId}/history?date=${date}&vs_currency=usd`
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      console.warn(`CoinGecko API failed for ${cryptoId || 'bitcoin'} on ${date}`)
      return null
    }
    
    const data = await response.json()
    
    if (data && data.prices && data.prices.length > 0) {
      const price = data.prices[0][1] // Get USD price
      const cryptoName = cryptoId === 'ethereum' ? 'Ethereum' : 
                       cryptoId === 'binancecoin' ? 'Binance Coin' :
                       cryptoId === 'solana' ? 'Solana' :
                       cryptoId?.charAt(0).toUpperCase() + cryptoId?.slice(1) || 'Unknown'
      
      return {
        symbol: cryptoId?.toUpperCase() || 'BTC',
        name: cryptoName,
        price: price,
        type: 'crypto' as const,
        timestamp: new Date(date).toISOString()
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching crypto historical data:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const cryptoId = searchParams.get('cryptoId')
    const type = searchParams.get('type') as 'currency' | 'crypto' | undefined
    
    if (!date) {
      return NextResponse.json({
        success: false,
        error: 'Date parameter is required'
      }, { status: 400 })
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      }, { status: 400 })
    }
    
    // Don't allow future dates
    const inputDate = new Date(date)
    const today = new Date()
    if (inputDate > today) {
      return NextResponse.json({
        success: false,
        error: 'Date cannot be in the future'
      }, { status: 400 })
    }
    
    let result: HistoricalItem[] = []
    
    if (type === 'crypto' || cryptoId) {
      // Fetch crypto data
      try {
        // Using CoinGecko free API for historical data
        let url = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${date}&vs_currency=usd`
        
        if (cryptoId && cryptoId !== 'bitcoin') {
          url = `https://api.coingecko.com/api/v3/coins/${cryptoId}/history?date=${date}&vs_currency=usd`
        }
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; AppleWebKit/537.36'
          }
        })
        
        if (!response.ok) {
          console.warn(`CoinGecko API failed for ${cryptoId || 'bitcoin'} on ${date}`)
        } else {
          const data = await response.json()
          
          if (data && data.prices && data.prices.length > 0) {
            const price = data.prices[0][1] // Get USD price
            const cryptoName = cryptoId === 'ethereum' ? 'Ethereum' : 
                             cryptoId === 'binancecoin' ? 'Binance Coin' :
                             cryptoId === 'solana' ? 'Solana' :
                             cryptoId?.charAt(0).toUpperCase() + cryptoId?.slice(1) || 'Unknown'
            
            return {
              symbol: cryptoId?.toUpperCase() || 'BTC',
              name: cryptoName,
              price: price,
              type: 'crypto' as const,
              timestamp: new Date(date).toISOString()
            }
          }
        }
      } catch (error) {
        console.error('Error fetching crypto historical data:', error)
      }
    } else {
      // Fetch currency data
      const currencyData = await fetchCurrencyHistoricalData(date)
      if (currencyData) {
        result = currencyData
      }
    }
    
    // If no data from APIs, use fallback
    if (result.length === 0) {
      console.warn(`No historical data available for ${date}, using fallback data`)
      result = getFallbackData(date, type || 'currency')
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      date: date,
      type: type || 'currency',
      cryptoId: cryptoId,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Historical API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch historical data',
      data: [],
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}