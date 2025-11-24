-- CepFinans Supabase Database Schema
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. Profiles Table (Kullanıcı profilleri)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. User Data Table (Kullanıcının finansal verileri)
CREATE TABLE IF NOT EXISTS public.user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('accounts', 'transactions', 'recurring_transactions', 'notes', 'settings')),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, data_type)
);

-- 3. Functions for automatic updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_data_updated_at
  BEFORE UPDATE ON public.user_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User Data RLS Policies
CREATE POLICY "Users can view own data"
  ON public.user_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON public.user_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON public.user_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON public.user_data FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON public.user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_type ON public.user_data(data_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 7. Storage for avatars (opsiyonel)
-- Storage bucket'ları manuel olarak oluşturmanız gerekebilir
-- Supabase Dashboard > Storage > Policies bölümünden aşağıdaki politikaları ekleyin:

-- Bucket oluşturma (manuel olarak yapın):
-- 1. Supabase Dashboard > Storage
-- 2. "New bucket" tıklayın
-- 3. Name: "avatars"
-- 4. Public: true
-- 5. File size limit: 1048576 (1MB)
-- 6. Allowed MIME types: image/png, image/jpeg, image/gif, image/webp

-- Bucket oluşturma SQL komutu:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars (bucket oluşturduktan sonra çalıştırın):
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own avatar"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Alternatif olarak daha basit policy (tüm authenticated kullanıcılar kendi avatarlarını yönetebilir):
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

CREATE POLICY "Users can manage own avatars"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR name LIKE auth.uid()::text || '%')
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR name LIKE auth.uid()::text || '%')
  );

-- Alternatif olarak daha basit policy (tüm authenticated kullanıcılar kendi avatarlarını yönetebilir):
CREATE POLICY "Allow authenticated users to manage avatars"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated'
  );

-- 8. Sample data structure for user_data
-- Bu, verilerin nasıl saklanacağını gösteren örneklerdir:

-- Accounts data örneği:
-- {
--   "cash": { balance: 1000, currency: "TRY" },
--   "bank": { balance: 5000, currency: "TRY" },
--   "savings": { balance: 2000, currency: "TRY" }
-- }

-- Transactions data örneği:
-- [
--   {
--     "id": "uuid",
--     "type": "income",
--     "amount": 1000,
--     "category": "Maaş",
--     "account": "bank",
--     "description": "Aylık maaş",
--     "date": "2025-01-15"
--   }
-- ]

-- Recurring transactions data örneği:
-- [
--   {
--     "id": "uuid",
--     "type": "expense",
--     "amount": 1500,
--     "category": "Kira",
--     "account": "bank",
--     "frequency": "monthly",
--     "dayOfMonth": 1,
--     "description": "Ev kirası",
--     "startDate": "2025-01-01"
--   }
-- ]

-- Notes data örneği:
-- [
--   {
--     "id": "uuid",
--     "content": "Finansal hedefler...",
--     "tags": ["hedef", "2025"],
--     "createdAt": "2025-01-15T10:00:00Z"
--   }
-- ]

-- Settings data örneği:
-- {
--   "currency": "TRY",
--   "language": "tr",
--   "theme": "light",
--   "notifications": true,
--   "autoBackup": true
-- }

-- 9. Exchange Rates Tables (Döviz Kurları)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  currency_code VARCHAR(3) NOT NULL,
  currency_name VARCHAR(100) NOT NULL,
  buy_rate DECIMAL(15,6) NOT NULL,
  sell_rate DECIMAL(15,6) NOT NULL,
  change_rate DECIMAL(15,6),
  change_percent DECIMAL(8,4),
  flag VARCHAR(10) NOT NULL,
  source VARCHAR(50) DEFAULT 'tcmb',
  last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(currency_code)
);

-- Döviz kuru geçmişi tablosu
CREATE TABLE IF NOT EXISTS public.exchange_rate_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  currency_code VARCHAR(3) NOT NULL,
  currency_name VARCHAR(100) NOT NULL,
  buy_rate DECIMAL(15,6) NOT NULL,
  sell_rate DECIMAL(15,6) NOT NULL,
  change_rate DECIMAL(15,6),
  change_percent DECIMAL(8,4),
  flag VARCHAR(10) NOT NULL,
  source VARCHAR(50) DEFAULT 'tcmb',
  record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency_code ON public.exchange_rates(currency_code);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_last_update ON public.exchange_rates(last_update);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_currency_code ON public.exchange_rate_history(currency_code);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_record_date ON public.exchange_rate_history(record_date);

-- Row Level Security for exchange rates
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rate_history ENABLE ROW LEVEL SECURITY;

-- Herkesin döviz kurlarını okuyabilmesi için
CREATE POLICY "Public read access for exchange_rates" ON public.exchange_rates
  FOR SELECT USING (true);

-- Herkesin döviz geçmişini okuyabilmesi için  
CREATE POLICY "Public read access for exchange_rate_history" ON public.exchange_rate_history
  FOR SELECT USING (true);

-- Sadece authenticated kullanıcıların yazabilmesi için
CREATE POLICY "Authenticated write access for exchange_rates" ON public.exchange_rates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated write access for exchange_rate_history" ON public.exchange_rate_history
  FOR ALL USING (auth.role() = 'authenticated');

-- Fonksiyon: Döviz kuru güncelleme
CREATE OR REPLACE FUNCTION public.update_exchange_rate(
  p_currency_code VARCHAR(3),
  p_currency_name VARCHAR(100),
  p_buy_rate DECIMAL(15,6),
  p_sell_rate DECIMAL(15,6),
  p_change_rate DECIMAL(15,6) DEFAULT NULL,
  p_change_percent DECIMAL(8,4) DEFAULT NULL,
  p_flag VARCHAR(10),
  p_source VARCHAR(50) DEFAULT 'tcmb'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_buy_rate DECIMAL(15,6);
  old_sell_rate DECIMAL(15,6);
BEGIN
  -- Mevcut kurları al
  SELECT buy_rate, sell_rate INTO old_buy_rate, old_sell_rate
  FROM public.exchange_rates
  WHERE currency_code = p_currency_code;
  
  -- Değişim oranlarını hesapla (eğer belirtilmemişse)
  IF p_change_rate IS NULL AND old_buy_rate IS NOT NULL THEN
    p_change_rate := p_buy_rate - old_buy_rate;
    p_change_percent := (p_change_rate / old_buy_rate) * 100;
  END IF;
  
  -- Ana tabloyu güncelle veya ekle
  INSERT INTO public.exchange_rates (
    currency_code, currency_name, buy_rate, sell_rate, 
    change_rate, change_percent, flag, source, updated_at
  ) VALUES (
    p_currency_code, p_currency_name, p_buy_rate, p_sell_rate,
    p_change_rate, p_change_percent, p_flag, p_source, NOW()
  )
  ON CONFLICT (currency_code) 
  DO UPDATE SET
    currency_name = EXCLUDED.currency_name,
    buy_rate = EXCLUDED.buy_rate,
    sell_rate = EXCLUDED.sell_rate,
    change_rate = EXCLUDED.change_rate,
    change_percent = EXCLUDED.change_percent,
    flag = EXCLUDED.flag,
    source = EXCLUDED.source,
    updated_at = NOW();
  
  -- Geçmiş tablosuna kayıt ekle
  INSERT INTO public.exchange_rate_history (
    currency_code, currency_name, buy_rate, sell_rate,
    change_rate, change_percent, flag, source, record_date
  ) VALUES (
    p_currency_code, p_currency_name, p_buy_rate, p_sell_rate,
    p_change_rate, p_change_percent, p_flag, p_source, NOW()
  );
  
  RETURN TRUE;
END;
$$;

-- Fonksiyon: Tüm döviz kurlarını getir
CREATE OR REPLACE FUNCTION public.get_exchange_rates()
RETURNS TABLE (
  currency_code VARCHAR(3),
  currency_name VARCHAR(100),
  buy_rate DECIMAL(15,6),
  sell_rate DECIMAL(15,6),
  change_rate DECIMAL(15,6),
  change_percent DECIMAL(8,4),
  flag VARCHAR(10),
  source VARCHAR(50),
  last_update TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.currency_code,
    er.currency_name,
    er.buy_rate,
    er.sell_rate,
    er.change_rate,
    er.change_percent,
    er.flag,
    er.source,
    er.last_update
  FROM public.exchange_rates er
  ORDER BY 
    CASE 
      WHEN er.currency_code IN ('USD', 'EUR', 'GBP', 'CHF') THEN 0
      ELSE 1
    END,
    er.currency_code;
END;
$$;

-- Fonksiyon: Döviz kuru geçmişini getir
CREATE OR REPLACE FUNCTION public.get_exchange_rate_history(
  p_currency_code VARCHAR(3) DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  currency_code VARCHAR(3),
  currency_name VARCHAR(100),
  buy_rate DECIMAL(15,6),
  sell_rate DECIMAL(15,6),
  change_rate DECIMAL(15,6),
  change_percent DECIMAL(8,4),
  flag VARCHAR(10),
  source VARCHAR(50),
  record_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    erh.currency_code,
    erh.currency_name,
    erh.buy_rate,
    erh.sell_rate,
    erh.change_rate,
    erh.change_percent,
    erh.flag,
    erh.source,
    erh.record_date
  FROM public.exchange_rate_history erh
  WHERE 
    (p_currency_code IS NULL OR erh.currency_code = p_currency_code)
    AND erh.record_date >= NOW() - INTERVAL '1 day' * p_days
  ORDER BY erh.record_date DESC, erh.currency_code;
END;
$$;

-- Trigger: updated_at alanını otomatik güncelle
CREATE TRIGGER handle_exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();