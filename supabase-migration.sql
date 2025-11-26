-- Supabase investments tablosu için yeni alanları ekle
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- Yeni alanları ekle (eğer yoksa)
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS sell_price REAL,
ADD COLUMN IF NOT EXISTS sell_date TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'partial'));

-- Mevcut kayıtları güncelle (status alanını ayarla)
UPDATE investments 
SET status = 'active' 
WHERE status IS NULL;

-- İndeks oluştur (performans için)
CREATE INDEX IF NOT EXISTS idx_investments_user_status ON investments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_investments_currency ON investments(currency);

-- RLS (Row Level Security) politikalarını güncelle
-- Mevcut politikaları kontrol et ve gerekirse güncelle