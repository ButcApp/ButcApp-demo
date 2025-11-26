'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'
import { useState } from 'react'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = (lang: 'tr' | 'en') => {
    setLanguage(lang)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        title={language === 'tr' ? 'Dil Değiştir' : 'Change Language'}
      >
        <Languages className="h-5 w-5" />
        <span className="sr-only">Change language</span>
        <span className="absolute -top-1 -right-1 text-xs font-bold bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
          {language.toUpperCase()}
        </span>
      </Button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-50 min-w-[120px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            <Button
              variant={language === 'tr' ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => handleLanguageChange('tr')}
            >
              🇹🇷 Türkçe
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => handleLanguageChange('en')}
            >
              🇺🇸 English
            </Button>
          </div>
        </>
      )}
    </div>
  )
}