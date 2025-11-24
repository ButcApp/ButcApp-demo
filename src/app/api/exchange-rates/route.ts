import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface ExchangeRate {
  code: string
  name: string
  buyRate: number
  sellRate: number
  changeRate?: number
  changePercent?: number
  lastUpdate: string
  flag: string
}

const CURRENCY_FLAGS: { [key: string]: string } = {
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

const CURRENCY_NAMES: { [key: string]: string } = {
  'USD': 'Amerikan Doları',
  'EUR': 'Euro',
  'GBP': 'İngiliz Sterlini',
  'CHF': 'İsviçre Frangı',
  'JPY': 'Japon Yeni',
  'SAR': 'Suudi Arabistan Riyali',
  'CAD': 'Kanada Doları',
  'AUD': 'Avustralya Doları',
  'NOK': 'Norveç Kronu',
  'SEK': 'İsveç Kronu',
  'DKK': 'Danimarka Kronu',
  'CNY': 'Çin Yuanı',
  'RUB': 'Rus Rublesi',
  'BGN': 'Bulgar Levası',
  'RON': 'Rumen Leyi',
  'IRR': 'İran Riyali',
  'KWD': 'Kuveyt Dinarı',
  'AZN': 'Azerbaycan Manatı',
  'AED': 'BAE Dirhemi',
  'QAR': 'Katar Riyali',
  'BHD': 'Bahreyn Dinarı',
  'OMR': 'Umman Riyali',
  'JOD': 'Ürdün Dinarı',
  'LBP': 'Lübnan Lirası',
  'EGP': 'Mısır Lirası',
  'IQD': 'Irak Dinarı',
  'LYD': 'Libya Dinarı',
  'SYP': 'Suriye Lirası',
  'YER': 'Yemen Riyali'
}

async function fetchTCMBrates(): Promise<ExchangeRate[]> {
  const tcmbUrl = `https://www.tcmb.gov.tr/kurlar/today.xml`
  
  const response = await fetch(tcmbUrl, {
    next: { revalidate: 3600 }
  })
  
  if (!response.ok) {
    throw new Error('TCMB API\'den veri alınamadı')
  }

  const xmlData = await response.text()
  const currencyMatches = xmlData.match(/<Currency.*?<\/Currency>/gs) || []
  
  const exchangeRates: ExchangeRate[] = []
  
  for (const currencyXml of currencyMatches) {
    const codeMatch = currencyXml.match(/CurrencyCode="([^"]+)"/)
    const nameMatch = currencyXml.match(/<Isim>([^<]+)<\/Isim>/)
    const buyMatch = currencyXml.match(/<ForexBuying>([^<]*)<\/ForexBuying>/)
    const sellMatch = currencyXml.match(/<ForexSelling>([^<]*)<\/ForexSelling>/)
    
    if (codeMatch && nameMatch && buyMatch && sellMatch) {
      const code = codeMatch[1]
      const buyRate = parseFloat(buyMatch[1]) || 0
      const sellRate = parseFloat(sellMatch[1]) || 0
      
      if (CURRENCY_NAMES[code]) {
        exchangeRates.push({
          code,
          name: CURRENCY_NAMES[code],
          buyRate,
          sellRate,
          flag: CURRENCY_FLAGS[code] || '🏳️',
          lastUpdate: new Date().toISOString()
        })
      }
    }
  }

  return exchangeRates
}

async function saveToSupabase(rates: ExchangeRate[]): Promise<boolean> {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not available, skipping database save')
    return false
  }

  try {
    for (const rate of rates) {
      // Önce tablonun varlığını kontrol et
      const { error: tableError } = await supabaseAdmin
        .from('exchange_rates')
        .select('id')
        .limit(1)

      if (tableError && tableError.message.includes('does not exist')) {
        console.warn('exchange_rates table does not exist, skipping save')
        return false
      }

      // Önce fonksiyonun varlığını kontrol et
      const { error: functionError } = await supabaseAdmin
        .rpc('update_exchange_rate', {
          p_currency_code: rate.code,
          p_currency_name: rate.name,
          p_buy_rate: rate.buyRate,
          p_sell_rate: rate.sellRate,
          p_change_rate: rate.changeRate,
          p_change_percent: rate.changePercent,
          p_flag: rate.flag,
          p_source: 'tcmb'
        })

      if (functionError) {
        // Fonksiyon yoksa doğrudan tabloya yaz
        console.warn('update_exchange_rate function not available, using direct insert')
        
        const { error: insertError } = await supabaseAdmin
          .from('exchange_rates')
          .upsert({
            currency_code: rate.code,
            currency_name: rate.name,
            buy_rate: rate.buyRate,
            sell_rate: rate.sellRate,
            change_rate: rate.changeRate,
            change_percent: rate.changePercent,
            flag: rate.flag,
            source: 'tcmb',
            last_update: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'currency_code'
          })

        if (insertError) {
          console.error(`Error saving ${rate.code} to Supabase (direct):`, insertError)
          return false
        }
      } else {
        console.log(`Successfully saved ${rate.code} to Supabase using function`)
      }
    }
    return true
  } catch (error) {
    console.error('Error saving to Supabase:', error)
    return false
  }
}

async function getFromSupabase(): Promise<ExchangeRate[] | null> {
  if (!supabaseAdmin) {
    return null
  }

  try {
    // Önce tablonun varlığını kontrol et
    const { error: tableError } = await supabaseAdmin
      .from('exchange_rates')
      .select('id')
      .limit(1)

    if (tableError && tableError.message.includes('does not exist')) {
      console.warn('exchange_rates table does not exist')
      return null
    }

    // Önce fonksiyonu dene
    const { data: functionData, error: functionError } = await supabaseAdmin.rpc('get_exchange_rates')

    if (!functionError && functionData) {
      return functionData.map((item: any) => ({
        code: item.currency_code,
        name: item.currency_name,
        buyRate: item.buy_rate,
        sellRate: item.sell_rate,
        changeRate: item.change_rate,
        changePercent: item.change_percent,
        flag: item.flag,
        lastUpdate: item.last_update
      }))
    }

    // Fonksiyon yoksa doğrudan tablodan al
    console.warn('get_exchange_rates function not available, using direct select')
    
    const { data, error } = await supabaseAdmin
      .from('exchange_rates')
      .select('*')
      .order('currency_code')

    if (error) {
      console.error('Error fetching from Supabase:', error)
      return null
    }

    if (data && data.length > 0) {
      return data.map((item: any) => ({
        code: item.currency_code,
        name: item.currency_name,
        buyRate: item.buy_rate,
        sellRate: item.sell_rate,
        changeRate: item.change_rate,
        changePercent: item.change_percent,
        flag: item.flag,
        lastUpdate: item.last_update
      }))
    }
  } catch (error) {
    console.error('Error fetching from Supabase:', error)
  }

  return null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    let exchangeRates: ExchangeRate[] = []
    let source = 'supabase'
    let message = ''

    // Önce Supabase'den verileri al
    if (!forceRefresh) {
      const supabaseRates = await getFromSupabase()
      if (supabaseRates) {
        exchangeRates = supabaseRates
        source = 'supabase'
        
        // Verilerin güncel olup olmadığını kontrol et (1 saatten eskiyse yenile)
        const lastUpdate = new Date(exchangeRates[0]?.lastUpdate || 0)
        const now = new Date()
        const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)
        
        if (hoursDiff > 1) {
          try {
            const freshRates = await fetchTCMBrates()
            if (freshRates.length > 0) {
              await saveToSupabase(freshRates)
              exchangeRates = freshRates
              source = 'tcmb'
              message = 'Veriler güncellendi'
            }
          } catch (error) {
            console.warn('Failed to refresh rates, using cached data:', error)
            message = 'Önbellekteki veriler kullanılıyor'
          }
        }
      }
    }

    // Supabase'de veri yoksa veya forceRefresh ise TCMB'den çek
    if (exchangeRates.length === 0) {
      try {
        exchangeRates = await fetchTCMBrates()
        
        if (exchangeRates.length > 0) {
          await saveToSupabase(exchangeRates)
          source = 'tcmb'
        }
      } catch (error) {
        console.error('TCMB fetch failed:', error)
      }
    }

    // Hala veri yoksa fallback verileri kullan
    if (exchangeRates.length === 0) {
      const fallbackRates = [
        { code: 'USD', name: 'Amerikan Doları', buyRate: 32.15, sellRate: 32.25, flag: '🇺🇸' },
        { code: 'EUR', name: 'Euro', buyRate: 35.20, sellRate: 35.30, flag: '🇪🇺' },
        { code: 'GBP', name: 'İngiliz Sterlini', buyRate: 41.50, sellRate: 41.65, flag: '🇬🇧' },
        { code: 'CHF', name: 'İsviçre Frangı', buyRate: 36.80, sellRate: 36.95, flag: '🇨🇭' },
        { code: 'JPY', name: 'Japon Yeni', buyRate: 0.215, sellRate: 0.218, flag: '🇯🇵' },
        { code: 'SAR', name: 'Suudi Arabistan Riyali', buyRate: 8.57, sellRate: 8.60, flag: '🇸🇦' },
        { code: 'CAD', name: 'Kanada Doları', buyRate: 23.75, sellRate: 23.85, flag: '🇨🇦' },
        { code: 'AUD', name: 'Avustralya Doları', buyRate: 21.30, sellRate: 21.40, flag: '🇦🇺' },
        { code: 'NOK', name: 'Norveç Kronu', buyRate: 3.05, sellRate: 3.07, flag: '🇳🇴' },
        { code: 'SEK', name: 'İsveç Kronu', buyRate: 3.10, sellRate: 3.12, flag: '🇸🇪' },
        { code: 'DKK', name: 'Danimarka Kronu', buyRate: 4.75, sellRate: 4.78, flag: '🇩🇰' },
        { code: 'CNY', name: 'Çin Yuanı', buyRate: 4.45, sellRate: 4.48, flag: '🇨🇳' }
      ]

      return NextResponse.json({
        success: true,
        data: fallbackRates,
        source: 'fallback',
        message: 'Veri alınamadı, örnek veriler gösteriliyor'
      })
    }

    return NextResponse.json({
      success: true,
      data: exchangeRates,
      source,
      message: message || undefined,
      lastUpdate: exchangeRates[0]?.lastUpdate || new Date().toISOString()
    })

  } catch (error) {
    console.error('Döviz kuru hatası:', error)
    
    // Hata durumunda örnek veri döndür
    const fallbackRates = [
      { code: 'USD', name: 'Amerikan Doları', buyRate: 32.15, sellRate: 32.25, flag: '🇺🇸' },
      { code: 'EUR', name: 'Euro', buyRate: 35.20, sellRate: 35.30, flag: '🇪🇺' },
      { code: 'GBP', name: 'İngiliz Sterlini', buyRate: 41.50, sellRate: 41.65, flag: '🇬🇧' },
      { code: 'CHF', name: 'İsviçre Frangı', buyRate: 36.80, sellRate: 36.95, flag: '🇨🇭' },
      { code: 'JPY', name: 'Japon Yeni', buyRate: 0.215, sellRate: 0.218, flag: '🇯🇵' },
      { code: 'SAR', name: 'Suudi Arabistan Riyali', buyRate: 8.57, sellRate: 8.60, flag: '🇸🇦' },
      { code: 'CAD', name: 'Kanada Doları', buyRate: 23.75, sellRate: 23.85, flag: '🇨🇦' },
      { code: 'AUD', name: 'Avustralya Doları', buyRate: 21.30, sellRate: 21.40, flag: '🇦🇺' }
    ]

    return NextResponse.json({
      success: true,
      data: fallbackRates,
      source: 'fallback',
      message: 'Hata oluştu, örnek veriler gösteriliyor',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    })
  }
}