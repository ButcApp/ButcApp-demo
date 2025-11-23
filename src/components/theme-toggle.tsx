'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="theme-toggle relative overflow-hidden transition-all duration-500 hover:scale-110 hover:shadow-lg"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-700 ease-in-out dark:-rotate-180 dark:scale-0 absolute" />
        <Moon className="h-[1.2rem] w-[1.2rem] rotate-180 scale-0 transition-all duration-700 ease-in-out dark:rotate-0 dark:scale-100 absolute" />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}