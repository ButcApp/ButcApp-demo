import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('API: Getting user notes...')
    
    // Get the user from the request (this would need authentication middleware)
    // For now, let's get the user ID from the query param for testing
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return Response.json({
        success: false,
        error: 'User ID required'
      }, { status: 400 })
    }
    
    console.log('API: Getting notes for user:', userId)
    
    // Use admin client to get user notes
    const { data: notesData, error: notesError } = await supabaseAdmin
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .eq('data_type', 'notes')
      .single()
    
    console.log('API: Notes result:', { notesData, notesError })
    
    if (notesError) {
      if (notesError.code === 'PGRST116') {
        return Response.json({
          success: true,
          data: [],
          message: 'No notes found'
        })
      }
      return Response.json({
        success: false,
        error: notesError.message
      }, { status: 500 })
    }
    
    return Response.json({
      success: true,
      data: notesData?.data || [],
      message: 'Notes retrieved successfully'
    })
    
  } catch (error) {
    console.error('API: Get notes error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API: Adding user note...')
    
    const body = await request.json()
    const { userId, note } = body
    
    if (!userId || !note) {
      return Response.json({
        success: false,
        error: 'User ID and note required'
      }, { status: 400 })
    }
    
    console.log('API: Adding note for user:', userId, note)
    
    // Get existing notes
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .eq('data_type', 'notes')
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      return Response.json({
        success: false,
        error: fetchError.message
      }, { status: 500 })
    }
    
    const currentNotes = existingData?.data || []
    const newNote = {
      id: Date.now().toString(),
      ...note,
      createdAt: new Date().toISOString()
    }
    
    const updatedNotes = [...currentNotes, newNote]
    
    // Update notes
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('user_data')
      .upsert({
        user_id: userId,
        data_type: 'notes',
        data: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .select()
    
    console.log('API: Update result:', { updateData, updateError })
    
    if (updateError) {
      return Response.json({
        success: false,
        error: updateError.message
      }, { status: 500 })
    }
    
    return Response.json({
      success: true,
      data: newNote,
      allNotes: updatedNotes,
      message: 'Note added successfully'
    })
    
  } catch (error) {
    console.error('API: Add note error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}