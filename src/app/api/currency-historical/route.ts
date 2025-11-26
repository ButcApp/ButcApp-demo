import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // Format: YYYY-MM-DD
    
    if (!date) {
      return NextResponse.json({
        success: false,
        error: 'Date parameter is required'
      }, { status: 400 })
    }

    // Function to find previous working day
    const findPreviousWorkingDay = (targetDate: string) => {
      const [year, month, day] = targetDate.split('-').map(Number)
      let checkDate = new Date(year, month - 1, day)
      
      // Go back one day first
      checkDate.setDate(checkDate.getDate() - 1)
      
      // Keep going back until we find a working day (not weekend)
      while (true) {
        const dayOfWeek = checkDate.getDay()
        const checkDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
        
        // Check if it's a working day (not Sunday=0 and not Saturday=6)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          return checkDateStr
        }
        
        // Go back one more day
        checkDate.setDate(checkDate.getDate() - 1)
        
        // Safety check: don't go back more than 30 days
        const daysDiff = Math.floor((new Date(year, month - 1, day).getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff > 30) {
          return new Date().toISOString().split('T')[0] // Return today as fallback
        }
      }
    }

    // Function to try to fetch data for a specific date
    const tryFetchData = async (targetDate: string) => {
      const [year, month, day] = targetDate.split('-')
      const tcmbDate = `${day}.${month}.${year}`
      const url = `https://www.tcmb.gov.tr/kurlar/${year}${month}/${day}${month}${year}.xml`
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      if (!response.ok) {
        return null // Data not available
      }
      
      const xmlText = await response.text()
      
      // XML parsing
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
        
        return null
      }).filter(currency => currency && currency.price > 0) // Filter out currencies with no data
      
      return result.length > 0 ? { data: result, date: tcmbDate } : null
    }

    // Try to get data for the requested date first
    let result = await tryFetchData(date)
    let actualDate = date
    let fallbackUsed = false
    let attempts = 0
    const maxAttempts = 10 // Try up to 10 previous days
    
    // If no data found, try previous working days
    while (!result && attempts < maxAttempts) {
      attempts++
      actualDate = findPreviousWorkingDay(actualDate)
      result = await tryFetchData(actualDate)
      fallbackUsed = true
    }
    
    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'No currency data available for the requested date or previous working days',
        data: [],
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      date: result.date,
      originalDate: fallbackUsed ? date : undefined,
      fallbackDate: fallbackUsed,
      message: fallbackUsed ? 
        `Seçilen tarih (${date}) için veri bulunamadı. Önceki çalışma günü (${actualDate}) verileri kullanılıyor.` : 
        undefined,
      attempts: fallbackUsed ? attempts : undefined,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('TCMB Historical API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch historical TCMB data',
      data: [],
      timestamp: new Date().toISOString()
    })
  }
}