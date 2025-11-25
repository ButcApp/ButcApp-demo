import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    // Admin bilgilerini getir
    const admin = await db.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    })

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Geçersiz kullanıcı' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      admin
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}