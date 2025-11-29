import { db } from '@/lib/prisma'

async function checkDatabase() {
  try {
    console.log('Checking database connection...')
    
    // Try to get all tables
    const result = await db.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`
    console.log('Tables in database:', result)
    
    // Try to run raw SQL to create a simple table
    console.log('Creating test table...')
    await db.$executeRaw`CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT)`
    
    // Check tables again
    const tables = await db.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`
    console.log('Tables after creating test table:', tables)
    
  } catch (error) {
    console.error('Database error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkDatabase()