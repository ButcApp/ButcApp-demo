import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    const targetUserId = '3cf06f63-98be-4639-b15d-10670ca6ec53'
    
    console.log('Creating initial notes for user:', targetUserId)
    
    // Create initial notes data
    const initialNotes = [
      {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        content: 'Hoş geldiniz! Bu sizin ilk notunuz.',
        tags: ['genel'],
        createdAt: new Date().toISOString()
      }
    ]
    
    // Insert notes data
    const { data: notesData, error: notesError } = await supabaseAdmin
      .from('user_data')
      .upsert({
        user_id: targetUserId,
        data_type: 'notes',
        data: initialNotes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
    
    console.log('Notes creation result:', { notesData, notesError })
    
    if (notesError) {
      return Response.json({
        success: false,
        error: notesError.message
      }, { status: 500 })
    }
    
    return Response.json({
      success: true,
      message: 'Initial notes created successfully',
      notesCount: initialNotes.length,
      data: notesData
    })
    
  } catch (error) {
    console.error('Create notes error:', error)
    return Response.json({ 
      error: 'Create notes failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}