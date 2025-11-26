import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'Kullanıcı adı gereklidir'),
  password: z.string().min(1, 'Şifre gereklidir'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validasyon
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Geçersiz giriş bilgileri', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { username, password } = validation.data

    // Admin kullanıcısını bul
    const admin = await db.admin.findUnique({
      where: { 
        OR: [
          { username },
          { email: username }
        ]
      }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 401 }
      )
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { error: 'Hesap devre dışı' },
        { status: 401 }
      )
    }

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, admin.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Hatalı şifre' },
        { status: 401 }
      )
    }

    // Son giriş tarihini güncelle
    await db.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() }
    })

    // Log kaydı oluştur
    await db.adminLog.create({
      data: {
        adminId: admin.id,
        action: 'LOGIN',
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Session token oluştur (basit token, production'da JWT kullanılmalı)
    const token = Buffer.from(`${admin.id}:${admin.username}:${Date.now()}`).toString('base64')

    // Response'da token'ı set et
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 saat
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}