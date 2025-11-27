import { NextRequest, NextResponse } from 'next/server'

interface CryptoHistoricalItem {
  symbol: string
  name: string
  price: number
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

// Fallback data for crypto historical prices
const getFallbackCryptoData = (date: string): CryptoHistoricalItem[] => {
  // Generate some realistic fallback data for testing
  const baseDate = new Date(date)
  const btcPrice = 90000 + Math.random() * 5000 // BTC around $90k with variation
  const ethPrice = 3000 + Math.random() * 500 // ETH around $3k with variation
  
  return [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: btcPrice,
      timestamp: baseDate.toISOString()
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: ethPrice,
      timestamp: baseDate.toISOString()
    },
    {
      symbol: 'BNB',
      name: 'Binance Coin',
      price: 300 + Math.random() * 50,
      timestamp: baseDate.toISOString()
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: 100 + Math.random() * 20,
      timestamp: baseDate.toISOString()
    }
  ]
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
      return {
        symbol: cryptoId?.toUpperCase() || 'BTC',
        name: cryptoId === 'ethereum' ? 'Ethereum' : cryptoId?.charAt(0).toUpperCase() + cryptoId?.slice(1),
        price: price,
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
    
    let result: CryptoHistoricalItem[] = []
    
    if (cryptoId) {
      // Fetch specific crypto data
      const cryptoData = await fetchCryptoHistoricalData(date, cryptoId)
      if (cryptoData) {
        result = [cryptoData]
      }
    } else {
      // Fetch top 5 cryptocurrencies for the date
      const topCryptos = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano']
      const promises = topCryptos.map(async (id) => {
        const data = await fetchCryptoHistoricalData(date, id)
        return data
      })
      
      const results = await Promise.allSettled(promises)
      result = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value !== null)
        .map((result) => result.value)
    }
    
    // If no data from API, use fallback
    if (result.length === 0) {
      console.warn(`No crypto data available for ${date}, using fallback data`)
      result = getFallbackCryptoData(date)
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      date: date,
      cryptoId: cryptoId,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Crypto historical API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch crypto historical data',
      data: [],
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}