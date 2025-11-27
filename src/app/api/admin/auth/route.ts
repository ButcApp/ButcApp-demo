import { NextRequest, NextResponse } from 'next/server'

// Mock admin data
const mockAdmin = {
  id: 'admin123',
  username: 'admin',
  email: 'admin@butcapp.com',
  name: 'ButcApp Admin',
  role: 'admin',
  isActive: true,
  lastLogin: new Date().toISOString(),
  createdAt: '2024-01-01T00:00:00Z'
}

export async function GET(request: NextRequest) {
  try {
    // Token kontrolü
    const token = request.cookies.get('admin-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    // Token decode et
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [adminId, username, timestamp] = decoded.split(':')

    // Token geçerliliğini kontrol et (24 saat)
    const tokenAge = Date.now() - parseInt(timestamp)
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Token süresi dolmuş' }, { status: 401 })
    }

    // Mock admin kontrolü
    if (adminId !== 'admin123' || username !== 'admin') {
      return NextResponse.json({ error: 'Geçersiz kullanıcı' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      admin: mockAdmin
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Mock authentication
    if (email === 'admin@butcapp.com' && password === 'admin123') {
      // Create simple token
      const token = Buffer.from(`${mockAdmin.id}:${mockAdmin.username}:${Date.now()}`).toString('base64')
      
      // Set token cookie
      const response = NextResponse.json({
        success: true,
        admin: mockAdmin,
        token: token
      })
      
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 hours
      })
      
      return response
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}