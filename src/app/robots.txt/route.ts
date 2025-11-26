import { NextResponse } from 'next/server'

export function GET() {
  const robots = `User-agent: *
Allow: /

# Sitemap konumu
Sitemap: https://butcapp.com/sitemap.xml

# Sadece API'leri engelle
Disallow: /api/
Disallow: /_next/
Disallow: /admin/`

  return new NextResponse(robots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    }
  })
}