import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({ 
      success: true,
      message: 'Test API is working',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}