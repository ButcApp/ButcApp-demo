-- PostgreSQL Migration Script
-- investments table oluşturma

-- UUID extension'ı etkinleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- investments table
CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    currency_name VARCHAR(100) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    buy_price DECIMAL(20,8) NOT NULL,
    buy_date DATE NOT NULL,
    sell_price DECIMAL(20,8),
    sell_date DATE,
    current_value DECIMAL(20,8) NOT NULL DEFAULT 0,
    profit DECIMAL(20,8) NOT NULL DEFAULT 0,
    profit_percent DECIMAL(10,4) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_currency ON investments(currency);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_investments_updated_at ON investments;
CREATE TRIGGER update_investments_updated_at 
    BEFORE UPDATE ON investments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- users table (Supabase auth users için referans)
CREATE TABLE IF NOT EXISTS app_users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for app_users
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_id ON app_users(id);

-- Trigger for app_users updated_at
DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at 
    BEFORE UPDATE ON app_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Foreign key constraint (isteğe bağlı)
-- ALTER TABLE investments ADD CONSTRAINT fk_investments_user 
-- FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

-- Sample data (test için)
-- INSERT INTO app_users (id, email, full_name) VALUES 
-- ('test-user-id', 'test@example.com', 'Test User')
-- ON CONFLICT (id) DO NOTHING;