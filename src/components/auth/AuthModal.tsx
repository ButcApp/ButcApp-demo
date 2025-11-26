'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'signin' | 'signup'
}

export function AuthModal({ isOpen, onClose, defaultTab = 'signin' }: AuthModalProps) {
  const { t } = useLanguage()
  const { signIn, signUp, loading } = useAuth()
  
  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [signInError, setSignInError] = useState('')
  
  // Sign Up form state
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpFullName, setSignUpFullName] = useState('')
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [signUpError, setSignUpError] = useState('')
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  if (!isOpen) return null

  const validateEmail = (email: string) => {
    // Test için her e-postayı kabul et - Supabase tarafında kontrol edilecek
    console.log('Validating email:', email)
    return email.length > 3 && email.includes('@')
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignInError('')
    
    const trimmedEmail = signInEmail.trim().toLowerCase()
    
    if (!validateEmail(trimmedEmail)) {
      setSignInError(t('auth.invalidEmail') || 'Geçerli bir e-posta adresi girin')
      return
    }
    
    const { error } = await signIn(trimmedEmail, signInPassword)
    if (error) {
      setSignInError(error.message)
    } else {
      // Başarılı giriş - modalı kapat (yönlendirme AuthContext'te yapılacak)
      onClose()
      // Formu temizle
      setSignInEmail('')
      setSignInPassword('')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignUpError('')
    setSignUpSuccess(false)
    
    const trimmedEmail = signUpEmail.trim().toLowerCase()
    
    if (!validateEmail(trimmedEmail)) {
      setSignUpError(t('auth.invalidEmail') || 'Geçerli bir e-posta adresi girin')
      return
    }
    
    if (signUpPassword.length < 6) {
      setSignUpError(t('auth.passwordTooShort') || 'Şifre en az 6 karakter olmalıdır')
      return
    }
    
    const { error } = await signUp(trimmedEmail, signUpPassword, signUpFullName.trim())
    if (error) {
      setSignUpError(error.message)
    } else {
      setSignUpSuccess(true)
      // Reset form
      setSignUpEmail('')
      setSignUpPassword('')
      setSignUpFullName('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {t('auth.welcome') || 'Hoş Geldiniz'}
          </CardTitle>
          <CardDescription className="text-center">
            {t('auth.description') || 'CepFinans hesabınıza giriş yapın veya yeni hesap oluşturun'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('auth.signIn') || 'Giriş Yap'}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signUp') || 'Kayıt Ol'}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t('auth.email') || 'E-posta'}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-email"
                      type="text"
                      placeholder={t('auth.emailPlaceholder') || 'ornek@email.com'}
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('auth.password') || 'Şifre'}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-password"
                      type={showSignInPassword ? 'text' : 'password'}
                      placeholder={t('auth.passwordPlaceholder') || '•••••••'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {signInError && (
                  <Alert variant="destructive">
                    <AlertDescription>{signInError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('auth.signingIn') || 'Giriş Yapılıyor'}
                    </>
                  ) : (
                    t('auth.signIn') || 'Giriş Yap'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname">{t('auth.fullName') || 'Ad Soyad'}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-fullname"
                      type="text"
                      placeholder={t('auth.fullNamePlaceholder') || 'Ahmet Yılmaz'}
                      value={signUpFullName}
                      onChange={(e) => setSignUpFullName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email') || 'E-posta'}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="text"
                      placeholder={t('auth.emailPlaceholder') || 'ornek@email.com'}
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password') || 'Şifre'}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type={showSignUpPassword ? 'text' : 'password'}
                      placeholder={t('auth.passwordPlaceholder') || '•••••••'}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {signUpError && (
                  <Alert variant="destructive">
                    <AlertDescription>{signUpError}</AlertDescription>
                  </Alert>
                )}

                {signUpSuccess && (
                  <Alert>
                    <AlertDescription>
                      {t('auth.signUpSuccess') || 'Kayıt başarılı! Lütfen e-postanızı kontrol edin.'}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('auth.signingUp') || 'Kayıt Yapılıyor'}
                    </>
                  ) : (
                    t('auth.signUp') || 'Kayıt Ol'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={onClose} className="text-sm">
              {t('auth.cancel') || 'İptal'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}