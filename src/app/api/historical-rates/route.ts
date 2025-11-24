import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface HistoricalRate {
  date: string
  code: string
  name: string
  buyRate: number
  sellRate: number
  flag: string
}

interface TCMBHistoricalResponse {
  Tarih_Date?: {
    Currency?: Array<{
      '@attributes': {
        Kod: string
        CurrencyCode: string
      }
      Unit: string
      Isim: string
      CurrencyName: string
      ForexBuying: string
      ForexSelling: string
      BanknoteBuying: string
      BanknoteSelling: string
      CrossRateUSD: string
      CrossRateOther: string
    }>
  }
}

// İş günü hesapla (Pazartesi-Cuma)
const isBusinessDay = (date: Date): boolean => {
  const day = date.getDay()
  // 0 = Pazar, 6 = Cumartesi
  return day >= 1 && day <= 5
}

// Önceki iş gününü bul
const getPreviousBusinessDay = (date: Date): Date => {
  const prevDay = new Date(date)
  prevDay.setDate(prevDay.getDate() - 1)
  
  // Hafta sonu ise haftaiçi geri git
  while (!isBusinessDay(prevDay)) {
    prevDay.setDate(prevDay.getDate() - 1)
  }
  
  return prevDay
}

// Tarihi formatla (DDMMYYYY)
const formatDateForTCMB = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}${month}${year}` // DDMMYYYY formatı
}

// Yıl ve ay formatla (YYYYMM)
const formatYearMonthForTCMB = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}${month}` // YYYYMM formatı
}

// Supabase'den geçmiş verileri al
async function getHistoricalFromSupabase(currencyCode?: string, days: number = 30): Promise<HistoricalRate[] | null> {
  if (!supabaseAdmin) {
    return null
  }

  try {
    // Önce tablonun varlığını kontrol et
    const { error: tableError } = await supabaseAdmin
      .from('exchange_rate_history')
      .select('id')
      .limit(1)

    if (tableError && tableError.message.includes('does not exist')) {
      console.warn('exchange_rate_history table does not exist')
      return null
    }

    // Önce fonksiyonu dene
    const { data: functionData, error: functionError } = await supabaseAdmin.rpc('get_exchange_rate_history', {
      p_currency_code: currencyCode,
      p_days: days
    })

    if (!functionError && functionData) {
      return functionData.map((item: any) => ({
        date: new Date(item.record_date).toISOString().split('T')[0],
        code: item.currency_code,
        name: item.currency_name,
        buyRate: item.buy_rate,
        sellRate: item.sell_rate,
        flag: item.flag
      }))
    }

    // Fonksiyon yoksa doğrudan tablodan al
    console.warn('get_exchange_rate_history function not available, using direct select')
    
    let query = supabaseAdmin
      .from('exchange_rate_history')
      .select('*')
      .gte('record_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (currencyCode) {
      query = query.eq('currency_code', currencyCode)
    }

    const { data, error } = await query.order('record_date', { ascending: false })

    if (error) {
      console.error('Error fetching historical data from Supabase:', error)
      return null
    }

    if (data && data.length > 0) {
      return data.map((item: any) => ({
        date: new Date(item.record_date).toISOString().split('T')[0],
        code: item.currency_code,
        name: item.currency_name,
        buyRate: item.buy_rate,
        sellRate: item.sell_rate,
        flag: item.flag
      }))
    }
  } catch (error) {
    console.error('Error fetching historical data from Supabase:', error)
  }

  return null
}

// Supabase'e geçmiş verileri kaydet
async function saveHistoricalToSupabase(rates: HistoricalRate[], date: string): Promise<boolean> {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not available, skipping historical save')
    return false
  }

  try {
    // Önce tablonun varlığını kontrol et
    const { error: tableError } = await supabaseAdmin
      .from('exchange_rate_history')
      .select('id')
      .limit(1)

    if (tableError && tableError.message.includes('does not exist')) {
      console.warn('exchange_rate_history table does not exist, skipping save')
      return false
    }

    for (const rate of rates) {
      const { error } = await supabaseAdmin
        .from('exchange_rate_history')
        .upsert({
          currency_code: rate.code,
          currency_name: rate.name,
          buy_rate: rate.buyRate,
          sell_rate: rate.sellRate,
          flag: rate.flag,
          source: 'tcmb',
          record_date: new Date(date).toISOString()
        }, {
          onConflict: 'currency_code,record_date'
        })

      if (error) {
        console.error(`Error saving historical ${rate.code} to Supabase:`, error)
        return false
      }
    }
    return true
  } catch (error) {
    console.error('Error saving historical data to Supabase:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetDate = searchParams.get('date')
    const currencyCode = searchParams.get('currency')
    const useCache = searchParams.get('cache') !== 'false'
    
    // Eğer tarih belirtilmemişse, son günlerin geçmişini getir
    if (!targetDate) {
      const days = parseInt(searchParams.get('days') || '30')
      
      if (useCache) {
        const historicalData = await getHistoricalFromSupabase(currencyCode, days)
        if (historicalData && historicalData.length > 0) {
          return NextResponse.json({
            success: true,
            data: historicalData,
            source: 'supabase',
            days,
            currency: currencyCode
          })
        } else {
          // Cache'de veri yoksa boş sonuç dön
          return NextResponse.json({
            success: true,
            data: [],
            source: 'supabase',
            days,
            currency: currencyCode,
            message: 'Cache\'de veri bulunamadı'
          })
        }
      }

      return NextResponse.json({
        success: false,
        error: 'Tarih parametresi gereklidir',
        message: 'Tarih belirterek TCMB\'den veri alabilirsiniz'
      }, { status: 400 })
    }

    const targetDateObj = new Date(targetDate)
    
    // Geçersiz tarih kontrolü
    if (isNaN(targetDateObj.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz tarih formatı'
      }, { status: 400 })
    }

    let currentDate = new Date(targetDateObj)
    let attempts = 0
    const maxAttempts = 7 // En fazla 7 iş günü geri git
    
    let historicalData: HistoricalRate[] = []
    let usedDate = ''
    let isPreviousDay = false

    while (attempts < maxAttempts) {
      const tcmbDate = formatDateForTCMB(currentDate) // DDMMYYYY
      const yearMonth = formatYearMonthForTCMB(currentDate) // YYYYMM
      
      // TCMB URL formatı: https://www.tcmb.gov.tr/kurlar/YYYYMM/DDMMYYYY.xml
      const tcmbUrl = `https://www.tcmb.gov.tr/kurlar/${yearMonth}/${tcmbDate}.xml`
      
      try {
        console.log(`TCMB deneme ${attempts + 1}: ${tcmbUrl}`)
        
        const response = await fetch(tcmbUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (response.ok) {
          const xmlText = await response.text()
          
          // Boş XML kontrolü
          if (!xmlText || xmlText.trim().length < 50) {
            console.log(`Boş XML: ${tcmbUrl}`)
          } else {
            try {
              // Currency bloklarını regex ile bul
              const currencyRegex = /<Currency[^>]*Kod="([^"]+)"[^>]*>[\s\S]*?<\/Currency>/g
              const currencyMatches = [...xmlText.matchAll(currencyRegex)]
              
              console.log(`🔍 ${currencyMatches.length} döviz bloğu bulundu`)
              
              const rates: HistoricalRate[] = []
              
              for (const match of currencyMatches) {
                const currencyXml = match[0]
                const code = match[1]
                
                if (code && (!currencyCode || code === currencyCode)) {
                  // Isim bul
                  const nameMatch = currencyXml.match(/<Isim>([^<]+)<\/Isim>/)
                  const name = nameMatch ? nameMatch[1] : ''
                  
                  // ForexSelling bul
                  const sellingMatch = currencyXml.match(/<ForexSelling>([^<]*)<\/ForexSelling>/)
                  const selling = parseFloat(sellingMatch ? sellingMatch[1] : '0')
                  
                  // ForexBuying bul
                  const buyingMatch = currencyXml.match(/<ForexBuying>([^<]*)<\/ForexBuying>/)
                  const buying = parseFloat(buyingMatch ? buyingMatch[1] : '0')
                  
                  // Sadece geçerli kurları ekle
                  if (buying > 0 && selling > 0) {
                    rates.push({
                      date: currentDate.toISOString().split('T')[0],
                      code,
                      name: name.charAt(0) + name.slice(1).toLowerCase(),
                      buyRate: buying,
                      sellRate: selling,
                      flag: getCurrencyFlag(code)
                    })
                  }
                }
              }
              
              if (rates.length > 0) {
                historicalData = rates
                usedDate = currentDate.toISOString().split('T')[0]
                isPreviousDay = attempts > 0
                
                // Supabase'e kaydet
                await saveHistoricalToSupabase(rates, usedDate)
                
                console.log(`🎉 Kur bulundu: ${tcmbUrl} (${attempts + 1}. deneme) - ${rates.length} döviz`)
              }
            } catch (parseError) {
              console.log(`💥 XML parsing hatası: ${tcmbUrl} - ${parseError}`)
            }
          }
        } else {
          console.log(`🌐 HTTP Hata: ${response.status} - ${tcmbUrl}`)
        }
      } catch (error) {
        console.log(`TCMB API hatası: ${tcmbUrl} - ${error}`)
      }
      
      // Kur bulunduysa döngüden çık
      if (historicalData.length > 0) {
        break
      }
      
      // Bir önceki iş gününe git
      currentDate = getPreviousBusinessDay(currentDate)
      attempts++
    }

    if (historicalData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Belirtilen tarihte veya önceki iş günlerinde kur bulunamadı',
        requestedDate: targetDate,
        searchedDates: Array.from({ length: attempts }, (_, i) => {
          const d = new Date(targetDateObj)
          for (let j = 0; j <= i; j++) {
            d.setDate(d.getDate() - 1)
            while (!isBusinessDay(d)) {
              d.setDate(d.getDate() - 1)
            }
          }
          return d.toISOString().split('T')[0]
        })
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: historicalData,
      requestedDate: targetDate,
      actualDate: usedDate,
      isPreviousDay,
      source: 'tcmb',
      message: isPreviousDay 
        ? `Seçilen tarihte kur yok, ${usedDate} tarihinin kuru kullanıldı.`
        : null
    })

  } catch (error) {
    console.error('Geçmiş döviz kuru hatası:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Döviz kuru alınamadı',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// Para birimi bayrakları
const getCurrencyFlag = (code: string): string => {
  const flags: { [key: string]: string } = {
    'USD': '🇺🇸',
    'EUR': '🇪🇺',
    'GBP': '🇬🇧',
    'CHF': '🇨🇭',
    'JPY': '🇯🇵',
    'SAR': '🇸🇦',
    'CAD': '🇨🇦',
    'AUD': '🇦🇺',
    'NOK': '🇳🇴',
    'SEK': '🇸🇪',
    'DKK': '🇩🇰',
    'CNY': '🇨🇳',
    'RUB': '🇷🇺',
    'BGN': '🇧🇬',
    'RON': '🇷🇴',
    'IRR': '🇮🇷',
    'KWD': '🇰🇼',
    'AZN': '🇦🇿',
    'AED': '🇦🇪',
    'QAR': '🇶🇦',
    'BHD': '🇧🇭',
    'OMR': '🇴🇲',
    'JOD': '🇯🇴',
    'LBP': '🇱🇧',
    'EGP': '🇪🇬',
    'IQD': '🇮🇶',
    'LYD': '🇱🇾',
    'SYP': '🇸🇾',
    'YER': '🇾🇪'
  }
  return flags[code] || '🏳️'
}