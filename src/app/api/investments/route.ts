import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    console.log(`📊 Fetching investments for user: ${userId}`)

    const { data, error } = await supabaseAdmin
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch investments',
        details: error.message
      }, { status: 500 })
    }

    console.log(`✅ Successfully fetched ${data?.length || 0} investments from Supabase`)
    
    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Investments GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, currency, currencyName, amount, buyPrice, buyDate, sellPrice, sellDate, status } = body

    console.log('📝 POST /api/investments - Request body:', {
      userId,
      currency,
      currencyName,
      amount,
      buyPrice,
      buyDate,
      sellPrice,
      sellDate,
      status
    })

    if (!userId || !currency || !currencyName || !amount || !buyPrice || !buyDate) {
      console.error('❌ Missing required fields:', {
        hasUserId: !!userId,
        hasCurrency: !!currency,
        hasCurrencyName: !!currencyName,
        hasAmount: !!amount,
        hasBuyPrice: !!buyPrice,
        hasBuyDate: !!buyDate
      })
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userId, currency, currencyName, amount, buyPrice, buyDate'
      }, { status: 400 })
    }

    // Calculate initial values
    const currentValue = parseFloat(buyPrice)
    const profit = 0
    const profitPercent = 0

    const insertData = {
      user_id: userId,
      currency,
      currency_name: currencyName,
      amount: parseFloat(amount),
      buy_price: parseFloat(buyPrice),
      buy_date: buyDate,
      sell_price: sellPrice ? parseFloat(sellPrice) : null,
      sell_date: sellDate || null,
      current_value: currentValue,
      profit,
      profit_percent: profitPercent,
      status: status || 'active'
    }

    console.log('💾 Insert data prepared:', insertData)

    const { data, error } = await supabaseAdmin
      .from('investments')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase insert error:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({
        success: false,
        error: 'Failed to create investment',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Investment created successfully:', data)

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Investment created successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Investments POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, ...updateData } = body

    if (!id || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Investment ID and User ID are required'
      }, { status: 400 })
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('investments')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to update investment',
        details: error.message
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Investment not found or access denied'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Investment updated successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Investments PUT error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Investment ID and User ID are required'
      }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('investments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete investment',
        details: error.message
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Investment not found or access denied'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Investment deleted successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Investments DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}