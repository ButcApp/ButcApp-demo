import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Tekrarlayan işlemleri listele
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const userFinance = await db.userFinanceData.findUnique({
      where: { userId }
    })

    if (!userFinance) {
      return NextResponse.json({ transactions: [] })
    }

    const recurringTransactions = userFinance.recurring 
      ? JSON.parse(userFinance.recurring) 
      : []

    return NextResponse.json({ transactions: recurringTransactions })
  } catch (error) {
    console.error('Tekrarlayan işlemler alınırken hata:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Yeni tekrarlayan işlem ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...transactionData } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Yeni tekrarlayan işlem oluştur
    const newTransaction = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      lastProcessed: null,
      ...transactionData
    }

    // Veritabanını güncelle
    const userFinance = await db.userFinanceData.findUnique({
      where: { userId }
    })

    if (!userFinance) {
      // Yeni kullanıcı kaydı oluştur
      await db.userFinanceData.create({
        data: {
          userId,
          balances: JSON.stringify({ cash: 0, bank: 0, savings: 0 }),
          transactions: JSON.stringify([]),
          recurring: JSON.stringify([newTransaction])
        }
      })
    } else {
      // Mevcut kaydı güncelle
      const existingRecurring = userFinance.recurring 
        ? JSON.parse(userFinance.recurring) 
        : []
      
      await db.userFinanceData.update({
        where: { userId },
        data: {
          recurring: JSON.stringify([...existingRecurring, newTransaction])
        }
      })
    }

    return NextResponse.json(newTransaction)
  } catch (error) {
    console.error('Tekrarlayan işlem eklenirken hata:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Tekrarlayan işlem güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, recurringId, lastProcessed, isActive } = body

    if (!userId || !recurringId) {
      return NextResponse.json({ error: 'User ID and Recurring ID required' }, { status: 400 })
    }

    const userFinance = await db.userFinanceData.findUnique({
      where: { userId }
    })

    if (!userFinance) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const recurringTransactions = userFinance.recurring 
      ? JSON.parse(userFinance.recurring) 
      : []

    // İlgili tekrarlayan işlemi bul ve güncelle
    const updatedTransactions = recurringTransactions.map((transaction: any) => {
      if (transaction.id === recurringId) {
        return {
          ...transaction,
          ...(lastProcessed && { lastProcessed }),
          ...(isActive !== undefined && { isActive })
        }
      }
      return transaction
    })

    await db.userFinanceData.update({
      where: { userId },
      data: {
        recurring: JSON.stringify(updatedTransactions)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tekrarlayan işlem güncellenirken hata:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Tekrarlayan işlem sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const recurringId = searchParams.get('recurringId')

    if (!userId || !recurringId) {
      return NextResponse.json({ error: 'User ID and Recurring ID required' }, { status: 400 })
    }

    const userFinance = await db.userFinanceData.findUnique({
      where: { userId }
    })

    if (!userFinance) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const recurringTransactions = userFinance.recurring 
      ? JSON.parse(userFinance.recurring) 
      : []

    // İlgili tekrarlayan işlemi sil
    const updatedTransactions = recurringTransactions.filter((transaction: any) => 
      transaction.id !== recurringId
    )

    await db.userFinanceData.update({
      where: { userId },
      data: {
        recurring: JSON.stringify(updatedTransactions)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tekrarlayan işlem silinirken hata:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}