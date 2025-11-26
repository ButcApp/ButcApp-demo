import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing Supabase connection and investments table...')
    
    // Test 1: Check if we can connect to Supabase
    const { data: testData, error: testError } = await supabaseAdmin
      .from('investments')
      .select('count')
      .limit(1)
    
    console.log('Supabase test result:', { testData, testError })
    
    if (testError) {
      console.error('Supabase connection error:', testError)
      
      // Check if it's a table not found error
      if (testError.message.includes('relation') || testError.message.includes('table')) {
        return NextResponse.json({
          success: false,
          error: 'Investments table not found',
          details: 'The "investments" table does not exist in Supabase. Please create it first.',
          solution: 'Run the SQL migration script in Supabase SQL Editor.',
          supabaseError: testError
        })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Supabase connection failed',
        details: testError.message,
        supabaseError: testError
      })
    }
    
    // Test 2: Check table structure
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('investments')
      .select('*')
      .limit(0)
    
    console.log('Table structure test:', { tableInfo, tableError })
    
    // Test 3: Try to insert a test record
    const testRecord = {
      user_id: '00000000-0000-0000-0000-000000000000', // Valid UUID format
      currency: 'TEST',
      currency_name: 'Test Currency',
      amount: 1,
      buy_price: 1.0,
      buy_date: new Date().toISOString().split('T')[0],
      current_value: 1.0,
      profit: 0,
      profit_percent: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('Testing insert with data:', testRecord)
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('investments')
      .insert(testRecord)
      .select()
      .single()
    
    console.log('Insert test result:', { insertData, insertError })
    
    if (insertError) {
      // Check if it's a column error
      if (insertError.message.includes('column')) {
        return NextResponse.json({
          success: false,
          error: 'Missing columns in investments table',
          details: insertError.message,
          solution: 'Run the migration script to add new columns (sell_price, sell_date, status).',
          supabaseError: insertError
        })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Insert test failed',
        details: insertError.message,
        supabaseError: insertError
      })
    }
    
    // Clean up test record
    if (insertData?.id) {
      await supabaseAdmin
        .from('investments')
        .delete()
        .eq('id', insertData.id)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection and investments table are working correctly',
      tableStructure: tableInfo ? 'OK' : 'Issue',
      insertTest: 'OK',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}