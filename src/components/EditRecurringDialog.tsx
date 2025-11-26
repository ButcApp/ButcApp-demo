'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface RecurringTransaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  account: 'cash' | 'bank' | 'savings'
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  customFrequency?: string
  dayOfWeek?: number  // Haftalık için (1-7, 1=Pazartesi)
  startDate: string
  endDate?: string
  isActive: boolean
}

interface EditRecurringDialogProps {
  recurring: RecurringTransaction
  onSave: (recurring: RecurringTransaction) => void
  onCancel: () => void
}

export default function EditRecurringDialog({ 
  recurring, 
  onSave, 
  onCancel 
}: EditRecurringDialogProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<RecurringTransaction>(recurring)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasyon
    if (formData.frequency === 'custom' && !formData.customFrequency?.trim()) {
      alert('Özel periyot seçildiğinde periyot açıklaması zorunludur.')
      return
    }
    
    onSave(formData)
  }

  const handleChange = (field: keyof RecurringTransaction, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('app.editRecurringTitle')}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* İşlem Türü */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('app.transactionType')}
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'income' | 'expense') => handleChange('type', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tutar */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('app.amount')} *
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                required
                className="w-full"
                placeholder="0.00"
              />
            </div>

            {/* Kategori */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('app.transactionCategory')} *
              </Label>
              <Input
                type="text"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
                className="w-full"
                placeholder="Örn: Maaş, Kira, Market"
              />
            </div>

            {/* Açıklama */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('app.transactionDescription')}
              </Label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full"
                placeholder={t('app.description')}
              />
            </div>

            {/* Hesap */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('app.account')} *
              </Label>
              <Select
                value={formData.account}
                onValueChange={(value: 'cash' | 'bank' | 'savings') => handleChange('account', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Nakit</SelectItem>
                  <SelectItem value="bank">Banka</SelectItem>
                  <SelectItem value="savings">Birikim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tekrar Sıklığı */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('app.recurringFrequency')} *
              </Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom') => handleChange('frequency', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Günlük</SelectItem>
                  <SelectItem value="weekly">Haftalık</SelectItem>
                  <SelectItem value="monthly">{t('app.monthly')}</SelectItem>
                  <SelectItem value="yearly">{t('app.yearly')}</SelectItem>
                  <SelectItem value="custom">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Haftalık için gün seçimi */}
            {formData.frequency === 'weekly' && (
              <div>
                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Haftanın Günü *
                </Label>
                <Select
                  value={formData.dayOfWeek?.toString()}
                  onValueChange={(value: string) => handleChange('dayOfWeek', parseInt(value) || 1)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Pazartesi</SelectItem>
                    <SelectItem value="2">Salı</SelectItem>
                    <SelectItem value="3">Çarşamba</SelectItem>
                    <SelectItem value="4">Perşembe</SelectItem>
                    <SelectItem value="5">Cuma</SelectItem>
                    <SelectItem value="6">Cumartesi</SelectItem>
                    <SelectItem value="7">Pazar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Özel Periyot için */}
            {formData.frequency === 'custom' && (
              <div>
                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Özel Periyot *
                </Label>
                <Input
                  type="text"
                  value={formData.customFrequency || ''}
                  onChange={(e) => handleChange('customFrequency', e.target.value)}
                  className="w-full"
                  placeholder="Örn: 15 günde bir, 2 ayda bir"
                />
              </div>
            )}

            {/* Başlangıç Tarihi */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('app.startDate')} *
              </Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
                className="w-full"
              />
            </div>

            {/* Bitiş Tarihi */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('app.endDateOptional')}
              </Label>
              <Input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value || undefined)}
                className="w-full"
              />
            </div>

            {/* Butonlar */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {t('app.cancel')}
              </Button>
              
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t('app.save')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}