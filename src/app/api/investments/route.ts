import { NextRequest, NextResponse } from 'next/server'

// Mock data - Database kullanmadan
let mockInvestments: any[] = [
  {
    id: 1,
    user_id: 'demo-user',
    currency: 'BTC',
    currency_name: 'Bitcoin',
    amount: 0.5,
    buy_price: 45000,
    buy_date: '2024-01-01',
    sell_price: null,
    sell_date: null,
    current_value: 47500,
    profit: 1250,
    profit_percent: 2.78,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    user_id: 'demo-user',
    currency: 'ETH',
    currency_name: 'Ethereum',
    amount: 10,
    buy_price: 2500,
    buy_date: '2024-01-15',
    sell_price: null,
    sell_date: null,
    current_value: 2650,
    profit: 1500,
    profit_percent: 6.0,
    status: 'active',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }
]

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

    // Filter investments by user_id
    const userInvestments = mockInvestments.filter(inv => inv.user_id === userId)

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

    const newInvestment = {
      id: Date.now(),
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
      status: status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 New investment created:', newInvestment)

    // Add to mock data
    mockInvestments.push(newInvestment)

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

    // Find investment
    const investmentIndex = mockInvestments.findIndex(inv => inv.id === id && inv.user_id === userId)
    
    if (investmentIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Investment not found or access denied'
      }, { status: 404 })
    }

    // Update investment
    mockInvestments[investmentIndex] = {
      ...mockInvestments[investmentIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: mockInvestments[investmentIndex],
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

    // Find and remove investment
    const investmentIndex = mockInvestments.findIndex(inv => inv.id === parseInt(id) && inv.user_id === userId)
    
    if (investmentIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Investment not found or access denied'
      }, { status: 404 })
    }

    const deletedInvestment = mockInvestments.splice(investmentIndex, 1)[0]

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