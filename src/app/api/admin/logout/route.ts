import { NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Log kaydı oluştur (mock)
    const token = request.cookies.get('admin-token')?.value
    
    if (token) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8')
        const [adminId] = decoded.split(':')
        
        // Mock admin log kaydı
        console.log(`Admin logout: ${adminId} at ${new Date().toISOString()}`)
      } catch (error) {
        console.error('Logout log error:', error)
      }
    }

    // Token'ı temizle
    const response = NextResponse.json({
      success: true,
      message: 'Başarıyla çıkış yapıldı'
    })

    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    })

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}