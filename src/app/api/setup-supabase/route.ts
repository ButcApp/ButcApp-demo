import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Supabase admin client not available'
      }, { status: 500 })
    }

    const results = {
      connection: { status: 'unknown', details: null },
      tables: {},
      functions: {},
      policies: {},
      indexes: {},
      errors: []
    }

    // 1. Bağlantı testi
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .limit(1)

      if (testError) {
        results.connection = { 
          status: 'failed', 
          details: testError.message,
          code: testError.code 
        }
        results.errors.push(`Connection failed: ${testError.message}`)
      } else {
        results.connection = { 
          status: 'ok', 
          details: 'Successfully connected to Supabase' 
        }
      }
    } catch (error) {
      results.connection = { 
        status: 'failed', 
        details: error instanceof Error ? error.message : 'Unknown connection error' 
      }
      results.errors.push(`Connection exception: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // 2. Tablo kontrolü
    const tables = ['exchange_rates', 'exchange_rate_history', 'profiles', 'user_data']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('id')
          .limit(1)

        if (error) {
          results.tables[table] = {
            status: 'missing',
            error: error.message,
            code: error.code
          }
          if (error.message.includes('does not exist')) {
            results.errors.push(`Table ${table} does not exist`)
          }
        } else {
          results.tables[table] = {
            status: 'exists',
            sample: data
          }
        }
      } catch (error) {
        results.tables[table] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        results.errors.push(`Table ${table} check failed: ${error instanceof Error ? error.message : 'Unknown'}`)
      }
    }

    // 3. Fonksiyon kontrolü
    const functions = ['get_exchange_rates', 'update_exchange_rate', 'get_exchange_rate_history']
    
    for (const func of functions) {
      try {
        if (func === 'get_exchange_rates') {
          const { data, error } = await supabaseAdmin.rpc(func)
          if (error) {
            results.functions[func] = {
              status: 'missing',
              error: error.message,
              code: error.code
            }
            results.errors.push(`Function ${func} missing: ${error.message}`)
          } else {
            results.functions[func] = {
              status: 'exists',
              sample: data ? Array.isArray(data) ? `${data.length} records` : 'data returned' : 'no data'
            }
          }
        } else if (func === 'get_exchange_rate_history') {
          const { data, error } = await supabaseAdmin.rpc(func, { p_days: 1 })
          if (error) {
            results.functions[func] = {
              status: 'missing',
              error: error.message,
              code: error.code
            }
            results.errors.push(`Function ${func} missing: ${error.message}`)
          } else {
            results.functions[func] = {
              status: 'exists',
              sample: data ? Array.isArray(data) ? `${data.length} records` : 'data returned' : 'no data'
            }
          }
        } else {
          // update_exchange_rate fonksiyonunu test etmek için parametre gerekli
          results.functions[func] = {
            status: 'untested',
            note: 'Requires parameters for testing'
          }
        }
      } catch (error) {
        results.functions[func] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        results.errors.push(`Function ${func} check failed: ${error instanceof Error ? error.message : 'Unknown'}`)
      }
    }

    // 4. RLS Politikaları kontrolü
    try {
      const { data: rlsData, error: rlsError } = await supabaseAdmin
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .in('tablename', ['exchange_rates', 'exchange_rate_history'])

      if (rlsError) {
        results.policies = {
          status: 'error',
          error: rlsError.message
        }
      } else {
        results.policies = {
          status: 'checked',
          tables: rlsData || []
        }
      }
    } catch (error) {
      results.policies = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // 5. İndeks kontrolü
    try {
      const { data: indexData, error: indexError } = await supabaseAdmin
        .from('pg_indexes')
        .select('indexname, tablename')
        .in('tablename', ['exchange_rates', 'exchange_rate_history'])

      if (indexError) {
        results.indexes = {
          status: 'error',
          error: indexError.message
        }
      } else {
        results.indexes = {
          status: 'checked',
          indexes: indexData || []
        }
      }
    } catch (error) {
      results.indexes = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // 6. Veri kontrolü
    try {
      const { data: exchangeData, error: exchangeError } = await supabaseAdmin
        .from('exchange_rates')
        .select('count')
        .limit(1)

      if (!exchangeError && exchangeData) {
        results.dataCount = {
          exchange_rates: exchangeData.length || 0
        }
      }

      const { data: historyData, error: historyError } = await supabaseAdmin
        .from('exchange_rate_history')
        .select('count')
        .limit(1)

      if (!historyError && historyData) {
        results.dataCount = {
          ...results.dataCount,
          exchange_rate_history: historyData.length || 0
        }
      }
    } catch (error) {
      results.errors.push(`Data count check failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    const hasCriticalErrors = results.errors.length > 0

    return NextResponse.json({
      success: !hasCriticalErrors,
      results,
      summary: {
        connection: results.connection.status,
        tablesReady: Object.values(results.tables).every(t => t.status === 'exists'),
        functionsReady: Object.values(results.functions).every(f => f.status === 'exists' || f.status === 'untested'),
        errorsCount: results.errors.length,
        needsSetup: hasCriticalErrors
      },
      recommendations: hasCriticalErrors ? [
        'Run the SQL commands from /supabase-schema.sql in Supabase SQL Editor',
        'Check if all tables are created properly',
        'Verify RLS policies are enabled',
        'Test functions individually'
      ] : [
        'System is ready to use'
      ]
    })

  } catch (error) {
    console.error('Detailed check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      step: 'overall_check'
    }, { status: 500 })
  }
}