'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'tr' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Çeviri dosyaları
const translations: Record<Language, Record<string, string>> = {
  tr: {
    // Ana Sayfa
    'home.title': 'CepFinans',
    'home.subtitle': 'Kişisel Muhasebenizi Tek Yerden Kontrol Edin.',
    'home.start': 'Başla',
    'home.sourceCode': 'Kaynak Kodları',
    'home.howToUse': 'Nasıl Kullanılır?',
    
    // Features
    'features.smartBalance': 'Akıllı Bakiye Takibi',
    'features.smartBalanceDesc': '3 hesap türü, tek yönetim paneli',
    'features.autoTransactions': 'Otomatik İşlemler',
    'features.autoTransactionsDesc': 'Maaş, kira, taksitleri otomatik ekle',
    'features.instantTransfer': 'Anında Transfer',
    'features.instantTransferDesc': 'Hesaplar arasında hızlı para transferi',
    'features.detailedReports': 'Detaylı Raporlar',
    'features.detailedReportsDesc': 'Gelir-gider analizi ve takibi',
    
    // Features Section
    'features.title': 'Her Şey Bir Arada',
    'features.subtitle': 'Finansal yönetimi basitleştıran akıllı özellikler',
    
    // Stats
    'stats.secure': 'Güvenli',
    'stats.fast': 'Hızlı',
    'stats.simple': 'Basit',
    
    // Nasıl Kullanılır Modal
    'guide.title': 'CepFinans Nasıl Kullanılır?',
    'guide.quickStart': 'Hızlı Başlangıç',
    'guide.quickStartDesc': 'CepFinans\'ı kullanmaya başlamak için herhangi bir üyelik veya kayıt işlemi gerekmez. Ana sayfadaki "Başla" butonuna tıklayarak doğrudan uygulamaya erişebilirsiniz. Tüm verileriniz tarayıcınızda güvenli bir şekilde saklanır.',
    'guide.accountManagement': 'Hesap Yönetimi',
    'guide.accountManagementDesc': 'CepFinans\'ta üç farklı hesap türü bulunur:',
    'guide.cashAccount': 'Nakit Hesabı',
    'guide.cashAccountDesc': 'Cüzdanınızda veya evde bulunan nakit paranızı takip edin. Alışveriş, fatura ödemeleri gibi nakit işlemlerini buradan kaydedin.',
    'guide.bankAccount': 'Banka Hesabı',
    'guide.bankAccountDesc': 'Banka hesaplarınızın bakiyesini ve işlemlerini takip edin. Maaş girişi, kredi kartı ödemeleri, EFT/havale işlemlerini buradan yönetin.',
    'guide.savingsAccount': 'Birikim Hesabı',
    'guide.savingsAccountDesc': 'Gelecek için ayırdığınız birikimlerinizi takip edin. Acil durum fonu, tatil birikimi, yatırım hesabı gibi farklı birikim hedeflerinizi burada toplayın.',
    'guide.addingTransactions': 'İşlem Ekleme',
    'guide.addingTransactionsDesc': 'Finansal işlemlerinizi eklemek çok basit:',
    'guide.addingIncome': 'Gelir Ekleme',
    'guide.addingIncomeDesc': 'Maaş, ek gelir, yan gelir gibi para girişlerinizi kaydedin. Hangi hesaba geldiğini, miktarını ve açıklamasını belirtin.',
    'guide.addingExpense': 'Gider Ekleme',
    'guide.addingExpenseDesc': 'Market alışverişi, fatura ödemeleri, kira, eğlence harcamaları gibi tüm giderlerinizi kaydedin. Kategori ve açıklama ekleyerek daha detaylı takip yapın.',
    'guide.addingTransfer': 'Transfer İşlemi',
    'guide.addingTransferDesc': 'Hesaplar arasında para transferi yapın. Nakitten bankaya, bankadan birikime gibi kolayca transfer gerçekleştirin.',
    'guide.autoTransactionsTitle': 'Otomatik İşlemler',
    'guide.autoTransactionsDesc': 'Düzenli tekrar eden işlemleri otomatikleştirin. Aylık maaşınız, kira ödemeniz, kredi taksitleri, fatura ödemeleri gibi düzenli işlemleri bir kez tanımlayın ve CepFinans otomatik olarak kaydetsin. Bu sayede her ay aynı işlemleri tekrar tekrar girmek zorunda kalmazsınız.',
    'guide.reporting': 'Raporlama ve Analiz',
    'guide.reportingDesc': 'Finansal durumunuzu detaylı olarak analiz edin. Aylık gelir-gider dengenizi görüntüleyin, kategori bazında harcama alışkanlıklarınızı analiz edin, birikim hedeflerinize ne kadar ulaştığınızı takip edin. Grafikler ve tablolar sayesinde finansal sağlığınızı tek bakışta anlayın.',
    'guide.dataSecurity': 'Veri Güvenliği ve Yedekleme',
    'guide.dataSecurityDesc': 'Tüm finansal verileriniz tamamen yerel olarak tarayıcınızda saklanır. Hiçbir kişisel bilgi sunucularımıza gönderilmez veya üçüncü kişilerle paylaşılmaz. Verilerinizi dışa aktararak yedekleyebilir ve istediğiniz zaman geri yükleyebilirsiniz. Bu sayede verilerinizin kontrolü tamamen sizde olur.',
    'guide.tips': 'İpuçları ve Öneriler',
    'guide.tip1': 'Her işlemi girdikten sonra bakiyeleri kontrol ederek doğruluğundan emin olun',
    'guide.tip2': 'Düzenli olarak işlem geçmişinizi gözden geçirerek harcama alışkanlıklarınızı analiz edin',
    'guide.tip3': 'Otomatik işlemler özelliğini aktif edin',
    'guide.tip4': 'Aylık bütçe hedefleri belirleyin',
    'guide.tip5': 'Verilerinizi düzenli olarak yedekleyin',
    
    // İletişim
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
    'auth.passwordPlaceholder': '•••••••',
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
    'auth.restore': 'Geri Yükle',
    'auth.invalidEmail': 'Geçerli bir e-posta adresi girin',
    'auth.passwordTooShort': 'Şifre en az 6 karakter olmalıdır',

    // App
    'app.title': 'CepFinans',
    'app.modernPersonalFinance': 'Modern Kişisel Finans',
    'app.settings': 'Ayarlar',
    'app.manageData': 'Veri Yönetimi',
    'app.dataBackup': 'Veri Yedekleme',
    'app.totalBalance': 'Toplam Bakiye',
    'app.allAccounts': 'Tüm Hesaplar',
    'app.monthlyRecurringIncome': 'Aylık Tekrarlayan Gelir',
    'app.monthlyRecurringExpense': 'Aylık Tekrarlayan Gider',
    'app.monthlyNet': 'Aylık Net',
    'app.estimatedSavings': 'Tahmini Birikim',
    'app.cash': 'Nakit',
    'app.bank': 'Banka',
    'app.savings': 'Birikim',
    'app.addNewTransaction': 'Yeni İşlem Ekle',
    'app.addTransaction': 'İşlem Ekle',
    'app.addTransactionDesc': 'Gelir, gider veya transfer işlemi ekleyin',
    'app.transferTitle': 'Transfer',
    'app.transferBetweenAccounts': 'Hesaplar Arası Transfer',
    'app.transferDesc': 'Hesaplar arasında para transferi yapın',
    'app.addRecurring': 'Tekrarlayan İşlem Ekle',
    'app.addRecurringDesc': 'Düzenli tekrar eden işlemleri otomatikleştirin',
    'app.upcomingTransactions': 'Yaklaşan İşlemler',
    'app.income': 'Gelir',
    'app.expense': 'Gider',
    'app.transactions': 'İşlemler',
    'app.recurring': 'Tekrarlayan',
    'app.reports': 'Raporlar',
    'app.viewStatistics': 'İstatistikleri Görüntüle',
    'app.financialStatistics': 'Finansal İstatistikler',
    'app.incomeExpenseAnalysis': 'Gelir-Gider Analizi',
    'app.accountDistributionChart': 'Hesap Dağılımı',
    'app.totalIncomeReport': 'Toplam Gelir',
    'app.totalExpenseReport': 'Toplam Gider',
    'app.incomeExpenseChart': 'Gelir-Gider Grafiği',
    'app.monthlySpendingTrendReport': 'Aylık Harcama Trendi',
    'app.notes': 'Notlar',
    'app.writeNote': 'Not Yaz',
    'app.allNotes': 'Tüm Notlar',
    'app.newNote': 'Yeni Not',
    'app.cancel': 'İptal',
    'app.saveNoteButton': 'Notu Kaydet',
    'app.footer': '© 2025 CepFinans. Modern kişisel finans yönetimi.',
    'app.initialSetup': 'İlk Kurulum',
    'app.initialSetupDesc': 'Başlamak için hesap bakiyelerinizi girin',
    'app.insufficientBalance': 'Yetersiz bakiye',
    'app.moneyTransfer': 'para transferi',
    'app.transferFrom': 'Transfer (Hesaptan)',
    'app.transferTo': 'Transfer (Hesaba)',
    'app.amount': 'Tutar',
    'app.currentBalance': 'Mevcut Bakiye',
    'app.description': 'Açıklama',
    'app.optional': 'İsteğe bağlı',
    'app.doTransfer': 'Transfer Yap',
    'app.transactionType': 'İşlem Türü',
    'app.transactionCategory': 'İşlem Kategorisi',
    'app.selectCategory': 'Kategori Seçin',
    'app.account': 'Hesap',
    'app.recurringFrequency': 'Tekrarlama Sıklığı',
    'app.monthly': 'Aylık',
    'app.yearly': 'Yıllık',
    'app.day': 'Gün',
    'app.ofMonth': 'ayda',
    'app.ofYear': 'yıl',
    'app.startDate': 'Başlangıç Tarihi',
    'app.addRecurringTransaction': 'Tekrarlayan İşlem Ekle',
    'app.all': 'Tümü',
    'app.noTransactions': 'Henüz işlem bulunmuyor',
    'app.noTransactionsForDate': 'Bu tarihte işlem bulunmuyor',
    'app.recurringTransactions': 'Tekrarlayan İşlemler',
    'app.noRecurringTransactions': 'Henüz tekrarlayan işlem bulunmuyor',
    'app.dailyReports': 'Günlük Raporlar',
    'app.noReports': 'Henüz rapor bulunmuyor',
  },
  en: {
    // Home Page
    'home.title': 'CepFinans',
    'home.subtitle': 'Manage Your Personal Finances in One Place.',
    'home.start': 'Get Started',
    'home.sourceCode': 'Source Code',
    'home.howToUse': 'How to Use?',
    
    // Features
    'features.smartBalance': 'Smart Balance Tracking',
    'features.smartBalanceDesc': '3 account types, single management panel',
    'features.autoTransactions': 'Automatic Transactions',
    'features.autoTransactionsDesc': 'Automatically add salary, rent, installments',
    'features.instantTransfer': 'Instant Transfer',
    'features.instantTransferDesc': 'Quick money transfer between accounts',
    'features.detailedReports': 'Detailed Reports',
    'features.detailedReportsDesc': 'Income-expense analysis and tracking',
    
    // Features Section
    'features.title': 'Everything in One Place',
    'features.subtitle': 'Smart features that simplify financial management',
    
    // Stats
    'stats.secure': 'Secure',
    'stats.fast': 'Fast',
    'stats.simple': 'Simple',
    
    // How to Use Modal
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
    
    // Contact
    'contact.title': 'Contact',
    'contact.suggestion': 'Suggestion',
    
    // Call to Action
    'cta.title': 'Start Managing Your Financial Future Today',
    'cta.subtitle': 'Completely Free and Open Source',
    'cta.freeStart': 'Get Started Free',
    
    // Footer
    'footer.copyright': '© 2025 CepFinans. Modern personal finance.',
    
    // Authentication
    'auth.welcome': 'Welcome to CepFinans',
    'auth.description': 'Sign in to your CepFinans account or create a new account',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.signOut': 'Sign Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.emailPlaceholder': 'example@email.com',
    'auth.passwordPlaceholder': '•••••••',
    'auth.fullNamePlaceholder': 'John Doe',
    'auth.signingIn': 'Signing In',
    'auth.signingUp': 'Signing Up',
    'auth.signUpSuccess': 'Registration successful! Please check your email.',
    'auth.cancel': 'Cancel',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.forgotPasswordDescription': 'Enter your email address to receive a password reset link',
    'auth.sendResetEmail': 'Send Password Reset Link',
    'auth.sendingResetEmail': 'Sending',
    'auth.resetEmailSent': 'Password reset link sent to your email address!',
    'auth.backToSignIn': 'Back to Sign In',
    'auth.close': 'Close',
    'auth.profile': 'Profile',
    'auth.settings': 'Settings',
    'auth.backup': 'Backup',
    'auth.restore': 'Restore',
    'auth.invalidEmail': 'Please enter a valid email address',
    'auth.passwordTooShort': 'Password must be at least 6 characters',

    // App
    'app.title': 'CepFinans',
    'app.modernPersonalFinance': 'Modern Personal Finance',
    'app.settings': 'Settings',
    'app.manageData': 'Data Management',
    'app.dataBackup': 'Data Backup',
    'app.totalBalance': 'Total Balance',
    'app.allAccounts': 'All Accounts',
    'app.monthlyRecurringIncome': 'Monthly Recurring Income',
    'app.monthlyRecurringExpense': 'Monthly Recurring Expense',
    'app.monthlyNet': 'Monthly Net',
    'app.estimatedSavings': 'Estimated Savings',
    'app.cash': 'Cash',
    'app.bank': 'Bank',
    'app.savings': 'Savings',
    'app.addNewTransaction': 'Add New Transaction',
    'app.addTransaction': 'Add Transaction',
    'app.addTransactionDesc': 'Add income, expense or transfer transaction',
    'app.transferTitle': 'Transfer',
    'app.transferBetweenAccounts': 'Transfer Between Accounts',
    'app.transferDesc': 'Transfer money between accounts',
    'app.addRecurring': 'Add Recurring Transaction',
    'app.addRecurringDesc': 'Automate regularly recurring transactions',
    'app.upcomingTransactions': 'Upcoming Transactions',
    'app.income': 'Income',
    'app.expense': 'Expense',
    'app.transactions': 'Transactions',
    'app.recurring': 'Recurring',
    'app.reports': 'Reports',
    'app.viewStatistics': 'View Statistics',
    'app.financialStatistics': 'Financial Statistics',
    'app.incomeExpenseAnalysis': 'Income-Expense Analysis',
    'app.accountDistributionChart': 'Account Distribution',
    'app.totalIncomeReport': 'Total Income',
    'app.totalExpenseReport': 'Total Expense',
    'app.incomeExpenseChart': 'Income-Expense Chart',
    'app.monthlySpendingTrendReport': 'Monthly Spending Trend',
    'app.notes': 'Notes',
    'app.writeNote': 'Write Note',
    'app.allNotes': 'All Notes',
    'app.newNote': 'New Note',
    'app.cancel': 'Cancel',
    'app.saveNoteButton': 'Save Note',
    'app.footer': '© 2025 CepFinans. Modern personal finance management.',
    'app.initialSetup': 'Initial Setup',
    'app.initialSetupDesc': 'Enter your account balances to get started',
    'app.insufficientBalance': 'Insufficient balance',
    'app.moneyTransfer': 'money transfer',
    'app.transferFrom': 'Transfer (From)',
    'app.transferTo': 'Transfer (To)',
    'app.amount': 'Amount',
    'app.currentBalance': 'Current Balance',
    'app.description': 'Description',
    'app.optional': 'Optional',
    'app.doTransfer': 'Do Transfer',
    'app.transactionType': 'Transaction Type',
    'app.transactionCategory': 'Transaction Category',
    'app.selectCategory': 'Select Category',
    'app.account': 'Account',
    'app.recurringFrequency': 'Recurring Frequency',
    'app.monthly': 'Monthly',
    'app.yearly': 'Yearly',
    'app.day': 'Day',
    'app.ofMonth': 'of month',
    'app.ofYear': 'of year',
    'app.startDate': 'Start Date',
    'app.addRecurringTransaction': 'Add Recurring Transaction',
    'app.all': 'All',
    'app.noTransactions': 'No transactions yet',
    'app.noTransactionsForDate': 'No transactions for this date',
    'app.recurringTransactions': 'Recurring Transactions',
    'app.noRecurringTransactions': 'No recurring transactions yet',
    'app.dailyReports': 'Daily Reports',
    'app.noReports': 'No reports yet',
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