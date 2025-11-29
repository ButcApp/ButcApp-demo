import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {
      status: 'PUBLISHED'
    }

    if (category && category !== 'all') {
      where.category = {
        slug: category
      }
    }

    if (featured === 'true') {
      where.featured = true
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get posts
    const posts = await db.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: {
              where: {
                status: 'APPROVED'
              }
            }
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Get total count
    const total = await db.post.count({ where })

    return NextResponse.json({
      posts: posts.map(post => ({
        ...post,
        tags: post.tags.map(postTag => postTag.tag)
      })),
      total,
      hasMore: offset + limit < total
    })

  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      excerpt,
      content,
      coverImage,
      featured = false,
      categoryId,
      tagIds = [],
      authorId,
      seoTitle,
      seoDescription,
      keywords
    } = body

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Calculate reading time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length
    const readTime = Math.ceil(wordCount / 200)

    const post = await db.post.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        featured,
        readTime,
        seoTitle,
        seoDescription,
        keywords,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        author: {
          connect: { id: authorId }
        },
        category: categoryId ? {
          connect: { id: categoryId }
        } : undefined,
        tags: {
          connect: tagIds.map((id: string) => ({ id }))
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      ...post,
      tags: post.tags.map(postTag => postTag.tag)
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}