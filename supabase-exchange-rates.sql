-- Döviz kurları tablosu
CREATE TABLE IF NOT EXISTS exchange_rates (
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
CREATE TABLE IF NOT EXISTS exchange_rate_history (
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
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency_code ON exchange_rates(currency_code);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_last_update ON exchange_rates(last_update);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_currency_code ON exchange_rate_history(currency_code);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_record_date ON exchange_rate_history(record_date);

-- RLS (Row Level Security) politikaları
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rate_history ENABLE ROW LEVEL SECURITY;

-- Herkesin döviz kurlarını okuyabilmesi için
CREATE POLICY "Public read access for exchange_rates" ON exchange_rates
  FOR SELECT USING (true);

-- Herkesin döviz geçmişini okuyabilmesi için  
CREATE POLICY "Public read access for exchange_rate_history" ON exchange_rate_history
  FOR SELECT USING (true);

-- Sadece authenticated kullanıcıların yazabilmesi için
CREATE POLICY "Authenticated write access for exchange_rates" ON exchange_rates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated write access for exchange_rate_history" ON exchange_rate_history
  FOR ALL USING (auth.role() = 'authenticated');

-- Fonksiyon: Döviz kuru güncelleme
CREATE OR REPLACE FUNCTION update_exchange_rate(
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
  FROM exchange_rates
  WHERE currency_code = p_currency_code;
  
  -- Değişim oranlarını hesapla (eğer belirtilmemişse)
  IF p_change_rate IS NULL AND old_buy_rate IS NOT NULL THEN
    p_change_rate := p_buy_rate - old_buy_rate;
    p_change_percent := (p_change_rate / old_buy_rate) * 100;
  END IF;
  
  -- Ana tabloyu güncelle veya ekle
  INSERT INTO exchange_rates (
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
  INSERT INTO exchange_rate_history (
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
CREATE OR REPLACE FUNCTION get_exchange_rates()
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
  FROM exchange_rates er
  ORDER BY 
    CASE 
      WHEN er.currency_code IN ('USD', 'EUR', 'GBP', 'CHF') THEN 0
      ELSE 1
    END,
    er.currency_code;
END;
$$;

-- Fonksiyon: Döviz kuru geçmişini getir
CREATE OR REPLACE FUNCTION get_exchange_rate_history(
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
  FROM exchange_rate_history erh
  WHERE 
    (p_currency_code IS NULL OR erh.currency_code = p_currency_code)
    AND erh.record_date >= NOW() - INTERVAL '1 day' * p_days
  ORDER BY erh.record_date DESC, erh.currency_code;
END;
$$;

-- Trigger: updated_at alanını otomatik güncelle
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_exchange_rates_updated_at
  BEFORE UPDATE ON exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();