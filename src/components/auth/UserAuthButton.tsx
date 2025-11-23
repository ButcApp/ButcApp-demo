'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, Shield, Download, Upload } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from './AuthModal'
import { useLanguage } from '@/contexts/LanguageContext'

export function UserAuthButton() {
  const { t } = useLanguage()
  const { user, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin')

  const handleSignOut = async () => {
    await signOut()
  }

  const handleSignIn = () => {
    setAuthTab('signin')
    setShowAuthModal(true)
  }

  const handleSignUp = () => {
    setAuthTab('signup')
    setShowAuthModal(true)
  }

  const handleBackup = () => {
    // Backup functionality
    const data = {
      accounts: localStorage.getItem('cepfinans-accounts'),
      transactions: localStorage.getItem('cepfinans-transactions'),
      recurring: localStorage.getItem('cepfinans-recurring'),
      notes: localStorage.getItem('cepfinans-notes'),
      settings: localStorage.getItem('cepfinans-settings')
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cepfinans-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (user) {
    // User is logged in
    const userInitials = user.email?.charAt(0).toUpperCase() || 'U'
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={userName} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>{t('auth.profile') || 'Profil'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t('auth.settings') || 'Ayarlar'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleBackup}>
              <Download className="mr-2 h-4 w-4" />
              <span>{t('auth.backup') || 'Yedekle'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Upload className="mr-2 h-4 w-4" />
              <span>{t('auth.restore') || 'Geri Yükle'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('auth.signOut') || 'Çıkış Yap'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          defaultTab={authTab}
        />
      </>
    )
  }

  // User is not logged in
  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={handleSignIn}>
          {t('auth.signIn') || 'Giriş Yap'}
        </Button>
        <Button onClick={handleSignUp}>
          {t('auth.signUp') || 'Kayıt Ol'}
        </Button>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        defaultTab={authTab}
      />
    </>
  )
}