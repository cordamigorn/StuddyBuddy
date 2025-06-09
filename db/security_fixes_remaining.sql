-- Kalan Supabase Security Advisor uyarılarını çözme

-- 1. Eksik kalan Function Search Path Mutable sorunu
-- update_updated_at_column fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 2. Auth OTP Long Expiry sorunu için
-- Bu ayar Supabase Dashboard üzerinden yapılmalıdır:
-- Supabase Dashboard > Authentication > Configuration > Email/Phone Sign-in
-- "OTP Expiry" değerini azaltın (örneğin 60 dakikadan 15 dakikaya)
-- Bu SQL üzerinden yapılamaz, arayüz üzerinden elle yapılmalıdır.

-- 3. Leaked Password Protection sorunu için
-- Bu ayar da Supabase Dashboard üzerinden yapılmalıdır:
-- Supabase Dashboard > Authentication > Configuration > Password Protection
-- "Enable password protection" seçeneğini aktif edin
-- Bu SQL üzerinden yapılamaz, arayüz üzerinden elle yapılmalıdır.

-- Not: Bu SQL'i çalıştırdıktan sonra, kalan iki sorunu çözmek için mutlaka
-- Supabase Dashboard'a gidip ilgili ayarları manuel olarak yapın. 