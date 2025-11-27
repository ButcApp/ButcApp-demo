import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  end: () => pool.end()
}

// Investment queries
export const investmentQueries = {
  // Get all investments for a user
  getByUserId: async (userId: string) => {
    const result = await db.query(`
      SELECT * FROM investments 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId])
    return result.rows
  },
  
  // Create new investment
  create: async (data: {
    user_id: string;
    currency: string;
    currency_name: string;
    amount: number;
    buy_price: number;
    buy_date: string;
  }) => {
    const {
      user_id,
      currency,
      currency_name,
      amount,
      buy_price,
      buy_date
    } = data;
    
    const result = await db.query(`
      INSERT INTO investments (
        user_id, currency, currency_name, amount, buy_price, buy_date, 
        current_value, profit, profit_percent, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      ) RETURNING *
    `, [
      user_id, currency, currency_name, amount, buy_price, buy_date,
      buy_price, 0, 0, 'active'
    ])
    return result.rows[0]
  },
  
  // Update investment
  update: async (id: string, userId: string, data: any) => {
    const setClause = Object.keys(data).map((key, index) => `${key} = $${index + 3}`).join(', ')
    const values = Object.values(data)
    
    const result = await db.query(`
      UPDATE investments 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $1 AND user_id = $2 
      RETURNING *
    `, [id, userId, ...values])
    return result.rows[0]
  },
  
  // Delete investment
  delete: async (id: string, userId: string) => {
    const result = await db.query(
      'DELETE FROM investments WHERE id = $1 AND user_id = $2 RETURNING *', 
      [id, userId]
    )
    return result.rows[0]
  },
  
  // Get investment by ID
  getById: async (id: string, userId: string) => {
    const result = await db.query(
      'SELECT * FROM investments WHERE id = $1 AND user_id = $2', 
      [id, userId]
    )
    return result.rows[0]
  }
}

export default db