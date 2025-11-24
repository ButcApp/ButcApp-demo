import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('API: Getting currency investments...')
    
    // Get the user ID from query parameter for testing
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return Response.json({
        success: false,
        error: 'User ID required'
      }, { status: 400 })
    }
    
    console.log('API: Getting currency investments for user:', userId)
    
    // Use admin client to get user currency investments from 'accounts' data type
    const { data: investmentsData, error: investmentsError } = await supabaseAdmin
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .eq('data_type', 'accounts')
      .single()
    
    console.log('API: Currency investments result:', { investmentsData, investmentsError })
    
    if (investmentsError) {
      if (investmentsError.code === 'PGRST116') {
        return Response.json({
          success: true,
          data: [],
          message: 'No currency investments found'
        })
      }
      return Response.json({
        success: false,
        error: investmentsError.message
      }, { status: 500 })
    }
    
    // Parse the data and extract currency investments
    try {
      const parsedData = JSON.parse(investmentsData?.data || '{}')
      const currencyInvestments = parsedData.currencyInvestments || []
      
      return Response.json({
        success: true,
        data: currencyInvestments,
        message: 'Currency investments retrieved successfully'
      })
    } catch (parseError) {
      console.error('API: Error parsing currency investments:', parseError)
      return Response.json({
        success: true,
        data: [],
        message: 'Error parsing currency investments'
      })
    }
    
  } catch (error) {
    console.error('API: Get currency investments error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API: Adding currency investment...')
    
    const body = await request.json()
    const { userId, investment } = body
    
    if (!userId || !investment) {
      return Response.json({
        success: false,
        error: 'User ID and investment required'
      }, { status: 400 })
    }
    
    console.log('API: Adding currency investment for user:', userId, investment)
    
    // Get existing record from 'accounts' data type
    const { data: existingRecord, error: existingError } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .eq('data_type', 'accounts')
      .single()
    
    console.log('Step 1 - Existing record:', { existingRecord, existingError })
    
    if (existingError && existingError.code !== 'PGRST116') {
      return Response.json({
        success: false,
        error: existingError.message
      }, { status: 500 })
    }
    
    let allInvestments = [investment]
    
    if (existingRecord) {
      console.log('Step 2: Updating existing record...')
      // Update existing record - parse existing data and add new investment
      let existingData = {}
      try {
        existingData = JSON.parse(existingRecord.data || '{}')
      } catch (parseError) {
        console.error('Error parsing existing data:', parseError)
      }
      
      // Get existing currency investments or create empty array
      const currentInvestments = existingData.currencyInvestments || []
      allInvestments = [...currentInvestments, investment]
      
      // Merge existing data with new currency investments
      const updatedData = {
        ...existingData,
        currencyInvestments: allInvestments,
        lastUpdated: new Date().toISOString()
      }
      
      const { data, error } = await supabaseAdmin
        .from('user_data')
        .update({
          data: JSON.stringify(updatedData),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('data_type', 'accounts')
        .select()
      
      console.log('Step 2 - Update result:', { data, error })
      
      if (error) {
        return Response.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }
    } else {
      console.log('Step 3: Inserting new record...')
      // Insert new record with 'accounts' data type
      const { data, error } = await supabaseAdmin
        .from('user_data')
        .insert({
          user_id: userId,
          data_type: 'accounts',
          data: JSON.stringify({
            currencyInvestments: allInvestments,
            lastUpdated: new Date().toISOString()
          }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      console.log('Step 3 - Insert result:', { data, error })
      
      if (error) {
        return Response.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }
    }
    
    return Response.json({
      success: true,
      data: investment,
      allInvestments: allInvestments,
      message: 'Currency investment added successfully'
    })
    
  } catch (error) {
    console.error('API: Add currency investment error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('API: Deleting currency investment...')
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const investmentId = searchParams.get('investmentId')
    
    if (!userId || !investmentId) {
      return Response.json({
        success: false,
        error: 'User ID and investment ID required'
      }, { status: 400 })
    }
    
    console.log('API: Deleting currency investment:', { userId, investmentId })
    
    // Get existing record from 'accounts' data type
    const { data: existingRecord, error: existingError } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .eq('data_type', 'accounts')
      .single()
    
    if (existingError && existingError.code !== 'PGRST116') {
      return Response.json({
        success: false,
        error: existingError.message
      }, { status: 500 })
    }
    
    if (!existingRecord) {
      return Response.json({
        success: false,
        error: 'No accounts record found'
      }, { status: 404 })
    }
    
    // Parse existing data and remove investment
    let existingData = {}
    try {
      existingData = JSON.parse(existingRecord.data || '{}')
    } catch (parseError) {
      console.error('Error parsing existing data:', parseError)
      return Response.json({
        success: false,
        error: 'Error parsing existing data'
      }, { status: 500 })
    }
    
    const currentInvestments = existingData.currencyInvestments || []
    const updatedInvestments = currentInvestments.filter((inv: any) => inv.id !== investmentId)
    
    // Update record
    const updatedData = {
      ...existingData,
      currencyInvestments: updatedInvestments,
      lastUpdated: new Date().toISOString()
    }
    
    const { data, error } = await supabaseAdmin
      .from('user_data')
      .update({
        data: JSON.stringify(updatedData),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('data_type', 'accounts')
      .select()
    
    if (error) {
      return Response.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }
    
    return Response.json({
      success: true,
      message: 'Currency investment deleted successfully',
      deletedInvestmentId: investmentId,
      remainingInvestments: updatedInvestments
    })
    
  } catch (error) {
    console.error('API: Delete currency investment error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}