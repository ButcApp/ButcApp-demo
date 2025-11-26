import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Investment ID is required'
      }, { status: 400 })
    }

    // Get the auth token from the request
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authorization token is required'
      }, { status: 401 })
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 })
    }

    // First check if the investment belongs to the current user
    const { data: investment, error: fetchError } = await supabaseAdmin
      .from('investments')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !investment) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Investment not found or access denied'
      }, { status: 404 })
    }

    // Delete the investment
    const { error: deleteError } = await supabaseAdmin
      .from('investments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Delete investment error:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete investment'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Investment deleted successfully',
      data: { id }
    })

  } catch (error) {
    console.error('Delete investment API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}