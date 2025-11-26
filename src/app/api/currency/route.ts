import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // TCMB API endpoint
    const url = `https://www.tcmb.gov.tr/kurlar/today.xml`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error('TCMB API request failed')
    }
    
    const xmlText = await response.text()
    
    // XML parsing - simpler approach
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
      // Simpler regex patterns
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
        
        // Calculate average price
        const price = (forexBuying + forexSelling) / 2
        
        // Calculate percentage change
        const changePercent = price > 0 ? (change / price) * 100 : 0
        
        return {
          symbol: currency.symbol,
          name: currency.name,
          price: price || 0,
          change: change || 0,
          changePercent: changePercent || 0,
          forexBuying: forexBuying || 0,
          forexSelling: forexSelling || 0
        }
      }
      
      // Fallback data if parsing fails
      return {
        symbol: currency.symbol,
        name: currency.name,
        price: 0,
        change: 0,
        changePercent: 0,
        forexBuying: 0,
        forexSelling: 0
      }
    })
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('TCMB API Error:', error)
    
    // Return fallback data on error
    const fallbackData = [
      {
        symbol: 'USD/TRY',
        name: 'ABD DOLARI',
        price: 32.45,
        change: 0.15,
        changePercent: 0.46,
        forexBuying: 32.40,
        forexSelling: 32.50
      },
      {
        symbol: 'EUR/TRY',
        name: 'EURO',
        price: 35.12,
        change: -0.08,
        changePercent: -0.23,
        forexBuying: 35.08,
        forexSelling: 35.16
      },
      {
        symbol: 'GBP/TRY',
        name: 'İNGİLİZ STERLİNİ',
        price: 40.78,
        change: 0.22,
        changePercent: 0.54,
        forexBuying: 40.70,
        forexSelling: 40.86
      },
      {
        symbol: 'CHF/TRY',
        name: 'İSVİÇRE FRANGI',
        price: 36.91,
        change: -0.12,
        changePercent: -0.32,
        forexBuying: 36.85,
        forexSelling: 36.97
      },
      {
        symbol: 'SEK/TRY',
        name: 'İSVEÇ KRONU',
        price: 2.95,
        change: 0.01,
        changePercent: 0.34,
        forexBuying: 2.94,
        forexSelling: 2.96
      },
      {
        symbol: 'DKK/TRY',
        name: 'DANİMARKA KRONU',
        price: 4.67,
        change: -0.02,
        changePercent: -0.43,
        forexBuying: 4.66,
        forexSelling: 4.68
      },
      {
        symbol: 'NOK/TRY',
        price: 2.89,
        change: 0.03,
        changePercent: 1.05,
        forexBuying: 2.87,
        forexSelling: 2.91
      },
      {
        symbol: 'CAD/TRY',
        name: 'KANADA DOLARI',
        price: 23.67,
        change: 0.08,
        changePercent: 0.34,
        forexBuying: 23.63,
        forexSelling: 23.71
      },
      {
        symbol: 'AUD/TRY',
        name: 'AVUSTRALYA DOLARI',
        price: 20.84,
        change: -0.05,
        changePercent: -0.24,
        forexBuying: 20.81,
        forexSelling: 20.87
      },
      {
        symbol: 'JPY/TRY',
        name: 'JAPON YENİ',
        price: 0.2145,
        change: 0.0008,
        changePercent: 0.37,
        forexBuying: 0.2141,
        forexSelling: 0.2149
      },
      {
        symbol: 'KWD/TRY',
        name: 'KUVEYT DİNARI',
        price: 105.23,
        change: 0.45,
        changePercent: 0.43,
        forexBuying: 105.01,
        forexSelling: 105.45
      },
      {
        symbol: 'SAR/TRY',
        name: 'SUUDİ ARABİSTAN RİYALİ',
        price: 8.63,
        change: 0.02,
        changePercent: 0.23,
        forexBuying: 8.62,
        forexSelling: 8.64
      },
      {
        symbol: 'BGN/TRY',
        name: 'BULGAR LEVASI',
        price: 17.94,
        change: -0.06,
        changePercent: -0.33,
        forexBuying: 17.91,
        forexSelling: 17.97
      },
      {
        symbol: 'RON/TRY',
        name: 'RUMEN LEYİ',
        price: 7.08,
        change: 0.01,
        changePercent: 0.14,
        forexBuying: 7.07,
        forexSelling: 7.09
      },
      {
        symbol: 'RUB/TRY',
        name: 'RUS RUBLESİ',
        price: 0.376,
        change: -0.003,
        changePercent: -0.79,
        forexBuying: 0.374,
        forexSelling: 0.378
      },
      {
        symbol: 'IRR/TRY',
        name: 'İRAN RİYALİ',
        price: 0.00077,
        change: 0.00001,
        changePercent: 1.32,
        forexBuying: 0.00076,
        forexSelling: 0.00078
      },
      {
        symbol: 'CNY/TRY',
        name: 'ÇİN YUANI',
        price: 4.47,
        change: 0.01,
        changePercent: 0.22,
        forexBuying: 4.46,
        forexSelling: 4.48
      },
      {
        symbol: 'PKR/TRY',
        name: 'PAKİSTAN RUPİSİ',
        price: 0.117,
        change: 0.0003,
        changePercent: 0.26,
        forexBuying: 0.116,
        forexSelling: 0.118
      },
      {
        symbol: 'QAR/TRY',
        name: 'KATAR RİYALİ',
        price: 8.91,
        change: 0.02,
        changePercent: 0.22,
        forexBuying: 8.90,
        forexSelling: 8.92
      },
      {
        symbol: 'AZN/TRY',
        name: 'AZERBAYCAN MANATI',
        price: 19.12,
        change: 0.04,
        changePercent: 0.21,
        forexBuying: 19.10,
        forexSelling: 19.14
      }
    ]
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch TCMB data',
      data: fallbackData,
      timestamp: new Date().toISOString()
    })
  }
}