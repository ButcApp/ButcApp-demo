'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, TrendingUp, PiggyBank, Users, CheckCircle, BarChart3, Lock, Zap, Github, HelpCircle, X, Mail, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { UserAuthButton } from '@/components/auth/UserAuthButton'
import { AuthModal } from '@/components/auth/AuthModal'
import { useLanguage } from '@/contexts/LanguageContext'

export default function HomePage() {
  const { t } = useLanguage()
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // İletişim form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: t('contact.suggestion')
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Form verilerini güncelle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Formu Formspree ile gönder
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      
      // Formspree'ye gönder
      const response = await fetch('https://formspree.io/f/mzzwpgar', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        setSubmitStatus('success')
        setTimeout(() => {
          setShowContactDialog(false)
          setSubmitStatus('idle')
          // Formu sıfırla
          setFormData({
            name: '',
            email: '',
            subject: '',
            message: '',
            type: 'Öneri'
          })
          form.reset()
        }, 2000)
      } else {
        throw new Error('Form gönderilemedi. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.')
      }
      
    } catch (error) {
      console.error('Form gönderim hatası:', error)
      setSubmitStatus('error')
      setTimeout(() => setSubmitStatus('idle'), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const features = [
    {
      id: 1,
      icon: PiggyBank,
      title: t('features.smartBalance'),
      description: t('features.smartBalanceDesc'),
      color: 'text-green-600'
    },
    {
      id: 2,
      icon: TrendingUp,
      title: t('features.autoTransactions'),
      description: t('features.autoTransactionsDesc'),
      color: 'text-blue-600'
    },
    {
      id: 3,
      icon: ArrowRight,
      title: t('features.instantTransfer'),
      description: t('features.instantTransferDesc'),
      color: 'text-purple-600'
    },
    {
      id: 4,
      icon: BarChart3,
      title: t('features.detailedReports'),
      description: t('features.detailedReportsDesc'),
      color: 'text-orange-600'
    }
  ]

  const stats = [
    { value: t('stats.secure'), icon: Lock },
    { value: t('stats.fast'), icon: Zap },
    { value: t('stats.simple'), icon: Users }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Tema ve Dil Değiştirme Butonları */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <UserAuthButton onAuthClick={() => setShowAuthModal(true)} />
        <LanguageToggle />
        <ThemeToggle />
      </div>
      
      {/* Hero Bölümü */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-12">
              <img 
                src="/favicon.png" 
                alt="CepFinans Logo" 
                className="w-20 h-20 rounded-2xl shadow-sm"
              />
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              {t('home.title')}
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto font-medium">
              <span className="text-green-600">{t('home.subtitle')}</span>
            </p>

            {/* Başla Butonları */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 text-xl font-medium shadow-lg"
                onClick={() => setShowAuthModal(true)}
              >
                {t('home.start')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <a 
                href="https://github.com/ahwetekm/CepFinans" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-4 text-xl font-medium transition-all duration-300 hover:scale-105"
                >
                  <Github className="mr-2 w-5 h-5" />
                  {t('home.sourceCode')}
                </Button>
              </a>
            </div>

            {/* Nasıl Kullanılır Butonu */}
            <div className="flex justify-center mb-8">
              <Button 
                size="lg" 
                variant="ghost" 
                onClick={() => setShowGuide(true)}
                className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 px-6 py-3 text-lg font-medium transition-all duration-300 hover:scale-105"
              >
                <HelpCircle className="mr-2 w-5 h-5" />
                {t('home.howToUse')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Kullanım Rehberi Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('guide.title')}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGuide(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Başlangıç */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 text-lg">1</span>
                  {t('guide.quickStart')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('guide.quickStartDesc')}
                </p>
              </div>

              {/* Hesap Yönetimi */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 text-lg">2</span>
                  {t('guide.accountManagement')}
                </h3>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <p className="leading-relaxed">
                    {t('guide.accountManagementDesc')}
                  </p>
                  <div className="ml-4 space-y-2">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <strong>{t('guide.cashAccount')}:</strong> {t('guide.cashAccountDesc')}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <strong>{t('guide.bankAccount')}:</strong> {t('guide.bankAccountDesc')}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <strong>{t('guide.savingsAccount')}:</strong> {t('guide.savingsAccountDesc')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* İşlem Ekleme */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 text-lg">3</span>
                  {t('guide.addingTransactions')}
                </h3>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <p className="leading-relaxed">
                    {t('guide.addingTransactionsDesc')}
                  </p>
                  <div className="ml-4 space-y-2">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <strong>{t('guide.addingIncome')}:</strong> {t('guide.addingIncomeDesc')}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <strong>{t('guide.addingExpense')}:</strong> {t('guide.addingExpenseDesc')}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <strong>{t('guide.addingTransfer')}:</strong> {t('guide.addingTransferDesc')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Otomatik İşlemler */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 text-lg">4</span>
                  {t('guide.autoTransactionsTitle')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('guide.autoTransactionsDesc')}
                </p>
              </div>

              {/* Raporlama */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 text-lg">5</span>
                  {t('guide.reporting')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('guide.reportingDesc')}
                </p>
              </div>

              {/* Veri Güvenliği */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 text-lg">6</span>
                  {t('guide.dataSecurity')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('guide.dataSecurityDesc')}
                </p>
              </div>

              {/* İpuçları */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">
                  {t('guide.tips')}
                </h4>
                <ul className="space-y-2 text-green-700 dark:text-green-400">
                  <li>• {t('guide.tip1')}</li>
                  <li>• {t('guide.tip2')}</li>
                  <li>• {t('guide.tip3')}</li>
                  <li>• {t('guide.tip4')}</li>
                  <li>• {t('guide.tip5')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Özellikler */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card
                key={feature.id}
                className={`border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer bg-white dark:bg-gray-800 ${
                  hoveredFeature === feature.id ? 'ring-2 ring-green-500/20' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Güven İndikatörleri */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                  <stat.icon className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bölümü */}
      <section className="py-20 px-6 bg-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-8 bg-white/20 rounded-2xl flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('cta.title')}
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>

          <div className="flex justify-center">
            <Link href="/app">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 px-12 py-4 text-xl font-medium shadow-xl">
                {t('cta.freeStart')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              CepFinans
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('footer.copyright')}
          </p>
          
          {/* İletişim Linki */}
          <div className="flex justify-center">
            <Button 
              onClick={() => setShowContactDialog(true)}
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105"
            >
              <Mail className="mr-2 w-4 h-4" />
              {t('contact.title')}
            </Button>
          </div>
        </div>
      </footer>

      {/* İletişim Dialog */}
      {showContactDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  İletişim
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowContactDialog(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Durum Mesajı */}
                {submitStatus === 'success' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 dark:text-green-200 font-medium">
                      Mesajınız başarıyla gönderildi! En kısa sürede yanıtlanacaktır.
                    </span>
                  </div>
                )}
                
                {submitStatus === 'error' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 dark:text-red-200 font-medium">
                      Form gönderilemedi. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.
                    </span>
                  </div>
                )}
                
                {/* Form Alanları */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ad Soyad *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Adınızı ve soyadınız"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        E-posta *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Konu Tipi *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Öneri">Öneri</option>
                        <option value="Şikayet">Şikayet</option>
                        <option value="Hata Bildirimi">Hata Bildirimi</option>
                        <option value="Özellik Talebi">Özellik Talebi</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Konu *
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Mesajınızın konusu"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mesajınız *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      placeholder="Mesajınızı detaylı olarak yazın..."
                    />
                  </div>
                </div>
                
                {/* Bilgilendirme */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-blue-800 dark:text-blue-200 text-sm">
                      <p className="font-medium mb-1">Form Gönderim Süreci:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Formu gönderdiğinizde Formspree üzerinden mail olarak iletilir</li>
                        <li>• Tüm bilgiler güvenli bir şekilde şifrelenir</li>
                        <li>• Form gönderim başarısız olursa hata mesajı alırsınız</li>
                        <li>• Mesajlarınız en kısa sürede yanıtlanacaktır</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Butonlar */}
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowContactDialog(false)}
                    disabled={isSubmitting}
                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105"
                  >
                    İptal
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 flex items-center gap-2 transition-all duration-300 hover:scale-105"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Gönder
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        defaultTab="signup"
      />
    </div>
  )
}