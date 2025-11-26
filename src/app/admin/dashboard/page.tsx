'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Settings, 
  Activity, 
  Database, 
  Shield, 
  LogOut,
  TrendingUp,
  DollarSign,
  UserCheck,
  AlertCircle
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalTransactions: number
  totalDataSize: string
  recentActivity: number
  systemHealth: 'healthy' | 'warning' | 'error'
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<any>(null)
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalDataSize: '0 MB',
    recentActivity: 0,
    systemHealth: 'healthy'
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchStats()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth')
      if (!response.ok) {
        router.push('/admin')
        return
      }
      const data = await response.json()
      setAdmin(data.admin)
    } catch (error) {
      router.push('/admin')
    }
  }

  const fetchStats = async () => {
    try {
      // Simüle edilmiş veriler - gerçek API'den gelecek
      setTimeout(() => {
        setStats({
          totalUsers: 1247,
          activeUsers: 892,
          totalTransactions: 45678,
          totalDataSize: '2.3 GB',
          recentActivity: 234,
          systemHealth: 'healthy'
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Stats fetch error:', error)
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const menuItems = [
    {
      title: 'Kullanıcı Yönetimi',
      description: 'Tüm kullanıcıları görüntüle ve yönet',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-600'
    },
    {
      title: 'Sistem Ayarları',
      description: 'Sistem yapılandırmasını yönet',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-green-600'
    },
    {
      title: 'Log ve Raporlar',
      description: 'Sistem loglarını ve raporlarını görüntüle',
      icon: Activity,
      href: '/admin/logs',
      color: 'text-orange-600'
    },
    {
      title: 'Veritabanı',
      description: 'Veritabanı yönetimi ve yedekleme',
      icon: Database,
      href: '/admin/database',
      color: 'text-purple-600'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/favicon.png" 
                alt="CepFinans Logo" 
                className="w-8 h-8 rounded-lg shadow-sm mr-3"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  CepFinans Admin
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Yönetim Paneli
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {admin?.name || admin?.username}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {admin?.role}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Hoş Geldiniz, {admin?.name || admin?.username}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            CepFinans yönetim paneline hoş geldiniz. Sistem durumunu aşağıdan takip edebilirsiniz.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                %12 artış son ay
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Kullanıcı</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                %{Math.round((stats.activeUsers / stats.totalUsers) * 100)} oran
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam İşlem</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                %8 artış son hafta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Veri Boyutu</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDataSize}</div>
              <p className="text-xs text-muted-foreground">
                Son yedek: 2 saat önce
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Sistem Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  stats.systemHealth === 'healthy' ? 'bg-green-500' :
                  stats.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium">
                  {stats.systemHealth === 'healthy' ? 'Sağlıklı' :
                   stats.systemHealth === 'warning' ? 'Uyarı' : 'Hata'}
                </span>
                <span className="text-sm text-gray-500">
                  Son aktivite: {stats.recentActivity} işlem
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Hızlı İşlemler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuItems.map((item, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(item.href)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-lg">{item.title}</span>
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}