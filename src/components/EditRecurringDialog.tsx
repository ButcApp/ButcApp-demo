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
  frequency: 'monthly' | 'yearly'
  dayOfMonth?: number
  monthOfYear?: number
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
                onValueChange={(value: 'monthly' | 'yearly') => handleChange('frequency', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t('app.monthly')}</SelectItem>
                  <SelectItem value="yearly">{t('app.yearly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gün */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {formData.frequency === 'monthly' ? t('app.dayOfMonth') : t('app.dayOfMonth')} *
              </Label>
              <Input
                type="number"
                min="1"
                max={formData.frequency === 'monthly' ? 31 : 31}
                value={formData.dayOfMonth}
                onChange={(e) => handleChange('dayOfMonth', parseInt(e.target.value) || 1)}
                required
                className="w-full"
                placeholder={formData.frequency === 'monthly' ? '1-31 arası gün' : '1-31 arası gün'}
              />
            </div>

            {/* Yıllık için ay seçimi */}
            {formData.frequency === 'yearly' && (
              <div>
                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ay *
                </Label>
                <Select
                  value={formData.monthOfYear?.toString()}
                  onValueChange={(value) => handleChange('monthOfYear', parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ocak</SelectItem>
                    <SelectItem value="2">Şubat</SelectItem>
                    <SelectItem value="3">Mart</SelectItem>
                    <SelectItem value="4">Nisan</SelectItem>
                    <SelectItem value="5">Mayıs</SelectItem>
                    <SelectItem value="6">Haziran</SelectItem>
                    <SelectItem value="7">Temmuz</SelectItem>
                    <SelectItem value="8">Ağustos</SelectItem>
                    <SelectItem value="9">Eylül</SelectItem>
                    <SelectItem value="10">Ekim</SelectItem>
                    <SelectItem value="11">Kasım</SelectItem>
                    <SelectItem value="12">Aralık</SelectItem>
                  </SelectContent>
                </Select>
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