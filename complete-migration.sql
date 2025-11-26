-- Investments Tablosu için Tam Migration Script
-- Supabase SQL Editor'da bu script'i çalıştırın

-- 1. Önce investments tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    currency TEXT NOT NULL,
    currency_name TEXT NOT NULL,
    amount REAL NOT NULL,
    buy_price REAL NOT NULL,
    buy_date TEXT NOT NULL,
    sell_price REAL,
    sell_date TEXT,
    current_value REAL NOT NULL DEFAULT 0,
    profit REAL NOT NULL DEFAULT 0,
    profit_percent REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'partial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Yeni sütunları ekle (eğer yoksa)
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS sell_price REAL,
ADD COLUMN IF NOT EXISTS sell_date TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'partial'));

-- 3. Mevcut kayıtları güncelle
UPDATE investments 
SET status = 'active' 
WHERE status IS NULL;

-- 4. İndeksleri oluştur (performans için)
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_status ON investments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_investments_currency ON investments(currency);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at);

-- 5. Row Level Security (RLS) ayarları
-- RLS'i etkinleştir
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (varsa)
DROP POLICY IF EXISTS "Users can view their own investments" ON investments;
DROP POLICY IF EXISTS "Users can insert their own investments" ON investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON investments;
DROP POLICY IF EXISTS "Users can delete their own investments" ON investments;

-- Yeni politikalar oluştur
CREATE POLICY "Users can view their own investments" ON investments
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own investments" ON investments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own investments" ON investments
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own investments" ON investments
    FOR DELETE USING (auth.uid()::text = user_id);

-- 6. Tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'investments' 
ORDER BY ordinal_position;

-- 7. Test verisi ekle (opsiyonel)
-- INSERT INTO investments (user_id, currency, currency_name, amount, buy_price, buy_date, current_value, profit, profit_percent, status)
-- VALUES ('test-user-id', 'USD', 'Amerikan Doları', 100, 28.50, '2024-01-01', 28.50, 0, 0, 'active');

-- Migration tamamlandı!