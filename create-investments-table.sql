-- Investments Tablosu Oluşturma Script'i
-- Supabase SQL Editor'da bu kodu çalıştırın

-- 1. Investments tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    currency VARCHAR(10) NOT NULL,
    currency_name VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 4) NOT NULL,
    buy_price DECIMAL(15, 4) NOT NULL,
    buy_date DATE NOT NULL,
    sell_price DECIMAL(15, 4),
    sell_date DATE,
    current_value DECIMAL(15, 4) NOT NULL DEFAULT 0,
    profit DECIMAL(15, 4) NOT NULL DEFAULT 0,
    profit_percent DECIMAL(10, 4) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'partial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Performans için indeksler
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_status ON public.investments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_investments_currency ON public.investments(currency);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON public.investments(created_at);

-- 3. Row Level Security (RLS) etkinleştir
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- 4. Mevcut politikaları temizle (varsa)
DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can delete own investments" ON public.investments;

-- 5. RLS Politikaları oluştur
CREATE POLICY "Users can view own investments" ON public.investments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments" ON public.investments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments" ON public.investments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments" ON public.investments
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Trigger for automatic updated_at
CREATE OR REPLACE FUNCTION public.handle_investments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger'ı oluştur
DROP TRIGGER IF EXISTS handle_investments_updated_at ON public.investments;
CREATE TRIGGER handle_investments_updated_at
    BEFORE UPDATE ON public.investments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_investments_updated_at();

-- 8. Tablo yapısını doğrula
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Migration tamamlandı mesajı
DO $$
BEGIN
    RAISE NOTICE '✅ Investments tablosu başarıyla oluşturuldu!';
    RAISE NOTICE '📊 Tablo adı: public.investments';
    RAISE NOTICE '🔒 RLS politikaları eklendi';
    RAISE NOTICE '⚡ İndeksler oluşturuldu';
    RAISE NOTICE '🔄 updated_at trigger eklendi';
END $$;