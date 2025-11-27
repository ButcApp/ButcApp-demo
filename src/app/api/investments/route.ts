import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase-server'
import { investmentQueries } from '@/lib/db'

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

    // Supabase'den user'ı doğrula
    const supabase = createApiClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      console.error('Authentication error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    console.log(`📊 Fetching investments for user: ${userId}`)

    // Get investments from database
    const userInvestments = await investmentQueries.getByUserId(userId)

    console.log(`✅ Successfully fetched ${userInvestments.length} investments`)
    
    return NextResponse.json({
      success: true,
      data: userInvestments,
      count: userInvestments.length,
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

    // Supabase'den user'ı doğrula
    const supabase = createApiClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      console.error('Authentication error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

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

    // Create investment in database
    const newInvestment = await investmentQueries.create({
      user_id: userId,
      currency,
      currency_name: currencyName,
      amount: parseFloat(amount),
      buy_price: parseFloat(buyPrice),
      buy_date: buyDate
    })

    console.log('💾 New investment created:', newInvestment)

    return NextResponse.json({
      success: true,
      data: newInvestment,
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

    // Supabase'den user'ı doğrula
    const supabase = createApiClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      console.error('Authentication error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Update investment in database
    const updatedInvestment = await investmentQueries.update(id, userId, updateData)

    if (!updatedInvestment) {
      return NextResponse.json({
        success: false,
        error: 'Investment not found or access denied'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedInvestment,
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

    // Supabase'den user'ı doğrula
    const supabase = createApiClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      console.error('Authentication error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Delete investment from database
    const deletedInvestment = await investmentQueries.delete(id, userId)

    if (!deletedInvestment) {
      return NextResponse.json({
        success: false,
        error: 'Investment not found or access denied'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: deletedInvestment,
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