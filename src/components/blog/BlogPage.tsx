'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, User, MessageCircle, Search, Filter, ChevronRight, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  coverImage?: string
  featured: boolean
  viewCount: number
  readTime: number
  createdAt: string
  publishedAt?: string
  author: {
    name: string
    avatar?: string
  }
  category?: {
    name: string
    slug: string
  }
  tags: Array<{
    name: string
    slug: string
    color?: string
  }>
  _count: {
    comments: number
  }
}

interface BlogPageProps {
  initialPosts?: Post[]
  categories?: Array<{
    name: string
    slug: string
    _count: {
      posts: number
    }
  }>
}

export default function BlogPage({ initialPosts = [], categories = [] }: BlogPageProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [filteredPosts, setFilteredPosts] = useState<Post[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')

  // Filter and sort posts
  useEffect(() => {
    let filtered = posts

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category?.slug === selectedCategory)
    }

    // Sort posts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
        case 'popular':
          return b.viewCount - a.viewCount
        case 'comments':
          return b._count.comments - a._count.comments
        default:
          return 0
      }
    })

    setFilteredPosts(filtered)
  }, [posts, searchTerm, selectedCategory, sortBy])

  // Load more posts
  const loadMorePosts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/blog/posts?limit=6&offset=' + posts.length)
      const data = await response.json()
      setPosts(prev => [...prev, ...data.posts])
    } catch (error) {
      console.error('Error loading more posts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Featured post component
  const FeaturedPost = ({ post }: { post: Post }) => (
    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-96">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            {post.category && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {post.category.name}
              </Badge>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4" />
              {post.viewCount}
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          <p className="text-lg mb-6 text-gray-200 line-clamp-2">{post.excerpt}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {post.author.avatar ? (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="font-medium">{post.author.name}</p>
                <p className="text-sm text-gray-300">
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
            <Link href={`/blog/${post.slug}`}>
              <Button className="bg-white text-black hover:bg-gray-100">
                Devamını Oku
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )

  // Post card component
  const PostCard = ({ post }: { post: Post }) => (
    <Card className="overflow-hidden border hover:shadow-lg transition-all duration-300 hover:scale-105">
      <div className="relative h-48">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500" />
        )}
        {post.featured && (
          <Badge className="absolute top-4 left-4 bg-yellow-500 text-white">
            Öne Çıkan
          </Badge>
        )}
      </div>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          {post.category && (
            <Badge variant="secondary" className="text-xs">
              {post.category.name}
            </Badge>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {post.readTime} dk
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Eye className="w-3 h-3" />
            {post.viewCount}
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{post.excerpt}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map(tag => (
            <Badge key={tag.slug} variant="outline" className="text-xs" style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}>
              {tag.name}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {post.author.avatar ? (
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{post.author.name}</p>
              <p className="text-xs text-gray-500">
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MessageCircle className="w-4 h-4" />
            {post._count.comments}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Blog
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Finansal okuryazarlık, yatırım stratejileri ve kişisel finans yönetimi hakkında yazılar
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Blog yazılarında ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Kategori seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {category.name} ({category._count.posts})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">En Yeni</SelectItem>
                  <SelectItem value="popular">En Popüler</SelectItem>
                  <SelectItem value="comments">En Çok Yorumlanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* AdSense Banner - Top */}
        <div className="mb-8">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-2">Reklam Alanı</p>
            <div className="bg-white dark:bg-gray-700 rounded h-32 flex items-center justify-center">
              <span className="text-gray-400">Google AdSense - 728x90</span>
            </div>
          </div>
        </div>

        {/* Featured Post */}
        {filteredPosts.filter(post => post.featured).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Öne Çıkan Yazı</h2>
            <FeaturedPost post={filteredPosts.find(post => post.featured)!} />
          </div>
        )}

        {/* Posts Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Tüm Yazılar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts
              .filter(post => !post.featured)
              .map(post => (
                <PostCard key={post.id} post={post} />
              ))}
          </div>
        </div>

        {/* AdSense Banner - Middle */}
        {filteredPosts.length > 6 && (
          <div className="mb-8">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-2">Reklam Alanı</p>
              <div className="bg-white dark:bg-gray-700 rounded h-32 flex items-center justify-center">
                <span className="text-gray-400">Google AdSense - 728x90</span>
              </div>
            </div>
          </div>
        )}

        {/* Load More */}
        {filteredPosts.length >= 6 && (
          <div className="text-center">
            <Button 
              onClick={loadMorePosts} 
              disabled={loading}
              variant="outline"
              size="lg"
            >
              {loading ? 'Yükleniyor...' : 'Daha Fazla Yazı Yükle'}
            </Button>
          </div>
        )}

        {/* AdSense Banner - Bottom */}
        <div className="mt-12">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-2">Reklam Alanı</p>
            <div className="bg-white dark:bg-gray-700 rounded h-32 flex items-center justify-center">
              <span className="text-gray-400">Google AdSense - 728x90</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}