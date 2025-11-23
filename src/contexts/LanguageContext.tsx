'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'tr' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Basit çeviri objesi
const translations: Record<Language, Record<string, string>> = {
  tr: {
    'home.title': 'CepFinans',
    'home.subtitle': 'Kişisel Muhasebenizi Tek Yerden Kontrol Edin.',
    'home.start': 'Başla',
    'home.sourceCode': 'Kaynak Kodları',
    'home.howToUse': 'Nasıl Kullanılır?',
    'features.title': 'Her Şey Bir Arada',
    'features.subtitle': 'Finansal yönetimi basitleştıran akıllı özellikler',
    'features.smartBalance': 'Akıllı Bakiye Takibi',
    'features.smartBalanceDesc': '3 hesap türü, tek yönetim paneli',
    'features.autoTransactions': 'Otomatik İşlemler',
    'features.autoTransactionsDesc': 'Maaş, kira, taksitleri otomatik ekle',
    'features.instantTransfer': 'Anında Transfer',
    'features.instantTransferDesc': 'Hesaplar arasında hızlı para transferi',
    'features.detailedReports': 'Detaylı Raporlar',
    'features.detailedReportsDesc': 'Gelir-gider analizi ve takibi',
    'stats.secure': 'Güvenli',
    'stats.fast': 'Hızlı',
    'stats.simple': 'Basit',
    'guide.title': 'CepFinans Nasıl Kullanılır?',
    'guide.quickStart': 'Hızlı Başlangıç',
    'guide.quickStartDesc': 'CepFinans\'ı kullanmaya başlamak için herhangi bir üyelik veya kayıt işlemi gerekmez.',
    'guide.accountManagement': 'Hesap Yönetimi',
    'guide.accountManagementDesc': 'CepFinans\'ta üç farklı hesap türü bulunur:',
    'guide.cashAccount': 'Nakit Hesabı',
    'guide.cashAccountDesc': 'Cüzdanınızda veya evde bulunan nakit paranızı takip edin.',
    'guide.bankAccount': 'Banka Hesabı',
    'guide.bankAccountDesc': 'Banka hesaplarınızın bakiyesini ve işlemlerini takip edin.',
    'guide.savingsAccount': 'Birikim Hesabı',
    'guide.savingsAccountDesc': 'Gelecek için ayırdığınız birikimlerinizi takip edin.',
    'guide.addingTransactions': 'İşlem Ekleme',
    'guide.addingTransactionsDesc': 'Finansal işlemlerinizi eklemek çok basit:',
    'guide.addingIncome': 'Gelir Ekleme',
    'guide.addingIncomeDesc': 'Maaş, ek gelir, yan gelir gibi para girişlerinizi kaydedin.',
    'guide.addingExpense': 'Gider Ekleme',
    'guide.addingExpenseDesc': 'Market alışverişi, fatura ödemeleri gibi tüm giderlerinizi kaydedin.',
    'guide.addingTransfer': 'Transfer İşlemi',
    'guide.addingTransferDesc': 'Hesaplar arasında para transferi yapın.',
    'guide.autoTransactionsTitle': 'Otomatik İşlemler',
    'guide.autoTransactionsDesc': 'Düzenli tekrar eden işlemleri otomatikleştirin.',
    'guide.reporting': 'Raporlama ve Analiz',
    'guide.reportingDesc': 'Finansal durumunuzu detaylı olarak analiz edin.',
    'guide.dataSecurity': 'Veri Güvenliği ve Yedekleme',
    'guide.dataSecurityDesc': 'Tüm finansal verileriniz tamamen yerel olarak tarayıcınızda saklanır.',
    'guide.tips': 'İpuçları ve Öneriler',
    'guide.tip1': 'Her işlemi girdikten sonra bakiyeleri kontrol edin',
    'guide.tip2': 'Düzenli olarak işlem geçmişinizi gözden geçirin',
    'guide.tip3': 'Otomatik işlemler özelliğini aktif edin',
    'guide.tip4': 'Aylık bütçe hedefleri belirleyin',
    'guide.tip5': 'Verilerinizi düzenli olarak yedekleyin',
    'contact.title': 'İletişim',
    'contact.suggestion': 'Öneri',
    'cta.title': 'Finansal Geleceğinizi Bugün Yönetmeye Başlayın',
    'cta.subtitle': 'Üstelik Tamamen Ücretsiz Ve Açık Kaynak Kodlu',
    'cta.freeStart': 'Ücretsiz Başla',
    'footer.copyright': '© 2025 CepFinans. Modern kişisel muhasebe.',
    
    // Authentication
    'auth.welcome': 'Hoş Geldiniz',
    'auth.description': 'CepFinans hesabınıza giriş yapın veya yeni hesap oluşturun',
    'auth.signIn': 'Giriş Yap',
    'auth.signUp': 'Kayıt Ol',
    'auth.signOut': 'Çıkış Yap',
    'auth.email': 'E-posta',
    'auth.password': 'Şifre',
    'auth.fullName': 'Ad Soyad',
    'auth.emailPlaceholder': 'ornek@email.com',
    'auth.passwordPlaceholder': '••••••••',
    'auth.fullNamePlaceholder': 'Ahmet Yılmaz',
    'auth.signingIn': 'Giriş Yapılıyor',
    'auth.signingUp': 'Kayıt Yapılıyor',
    'auth.signUpSuccess': 'Kayıt başarılı! Lütfen e-postanızı kontrol edin.',
    'auth.cancel': 'İptal',
    'auth.forgotPassword': 'Şifremi Unuttum',
    'auth.forgotPasswordDescription': 'Şifre sıfırlama bağlantısı almak için e-posta adresinizi girin',
    'auth.sendResetEmail': 'Şifre Sıfırlama Bağlantısı Gönder',
    'auth.sendingResetEmail': 'Gönderiliyor',
    'auth.resetEmailSent': 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!',
    'auth.backToSignIn': 'Girişe Geri Dön',
    'auth.close': 'Kapat',
    'auth.profile': 'Profil',
    'auth.settings': 'Ayarlar',
    'auth.backup': 'Yedekle',
    'auth.restore': 'Geri Yükle'
  },
  en: {
    'home.title': 'CepFinans',
    'home.subtitle': 'Manage Your Personal Finances in One Place.',
    'home.start': 'Get Started',
    'home.sourceCode': 'Source Code',
    'home.howToUse': 'How to Use?',
    'features.title': 'Everything in One Place',
    'features.subtitle': 'Smart features that simplify financial management',
    'features.smartBalance': 'Smart Balance Tracking',
    'features.smartBalanceDesc': '3 account types, single management panel',
    'features.autoTransactions': 'Automatic Transactions',
    'features.autoTransactionsDesc': 'Automatically add salary, rent, installments',
    'features.instantTransfer': 'Instant Transfer',
    'features.instantTransferDesc': 'Quick money transfer between accounts',
    'features.detailedReports': 'Detailed Reports',
    'features.detailedReportsDesc': 'Income-expense analysis and tracking',
    'stats.secure': 'Secure',
    'stats.fast': 'Fast',
    'stats.simple': 'Simple',
    'guide.title': 'How to Use CepFinans?',
    'guide.quickStart': 'Quick Start',
    'guide.quickStartDesc': 'You don\'t need any membership or registration to start using CepFinans.',
    'guide.accountManagement': 'Account Management',
    'guide.accountManagementDesc': 'CepFinans has three different account types:',
    'guide.cashAccount': 'Cash Account',
    'guide.cashAccountDesc': 'Track your cash in your wallet or at home.',
    'guide.bankAccount': 'Bank Account',
    'guide.bankAccountDesc': 'Track your bank account balances and transactions.',
    'guide.savingsAccount': 'Savings Account',
    'guide.savingsAccountDesc': 'Track your savings for future.',
    'guide.addingTransactions': 'Adding Transactions',
    'guide.addingTransactionsDesc': 'Adding your financial transactions is very simple:',
    'guide.addingIncome': 'Adding Income',
    'guide.addingIncomeDesc': 'Record your money inflows like salary, extra income.',
    'guide.addingExpense': 'Adding Expenses',
    'guide.addingExpenseDesc': 'Record all your expenses like grocery shopping, bills.',
    'guide.addingTransfer': 'Transfer Transaction',
    'guide.addingTransferDesc': 'Transfer money between accounts.',
    'guide.autoTransactionsTitle': 'Automatic Transactions',
    'guide.autoTransactionsDesc': 'Automate regularly recurring transactions.',
    'guide.reporting': 'Reporting and Analysis',
    'guide.reportingDesc': 'Analyze your financial situation in detail.',
    'guide.dataSecurity': 'Data Security and Backup',
    'guide.dataSecurityDesc': 'All your financial data is stored completely locally in your browser.',
    'guide.tips': 'Tips and Suggestions',
    'guide.tip1': 'Check balances after entering each transaction',
    'guide.tip2': 'Regularly review your transaction history',
    'guide.tip3': 'Activate automatic transactions feature',
    'guide.tip4': 'Set monthly budget goals',
    'guide.tip5': 'Regularly backup your data',
    'contact.title': 'Contact',
    'contact.suggestion': 'Suggestion',
    'cta.title': 'Start Managing Your Financial Future Today',
    'cta.subtitle': 'Completely Free and Open Source',
    'cta.freeStart': 'Get Started Free',
    'footer.copyright': '© 2025 CepFinans. Modern personal finance.'
  }
}

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('tr')

  useEffect(() => {
    // localStorage'dan dil ayarını yükle
    const savedLanguage = localStorage.getItem('cepfinans-language') as Language
    if (savedLanguage && (savedLanguage === 'tr' || savedLanguage === 'en')) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('cepfinans-language', lang)
  }

  const t = (key: string): string => {
    const translation = translations[language]?.[key]
    return translation || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}