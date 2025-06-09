-- Supabase Security Advisor uyarılarını çözme

-- 1. Function Search Path Mutable sorunlarını çözme
-- Bu sorunda fonksiyonların search_path parametresi eksik, ekleyelim

-- update_updated_at fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION public.update_updated_at()
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

-- increment_version fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  NEW.last_modified_by = auth.uid();
  RETURN NEW;
END;
$$;

-- create_profile_and_settings fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION public.create_profile_and_settings()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- 2. Leaked Password Protection
-- Şifre korumasını etkinleştirme
-- Bu ayar Supabase Authentication ayarlarından yapılmalı
-- Aşağıdaki SQL yerine Supabase Dashboard > Authentication > Configuration > Password Protection 
-- bölümüne gidip "Enable password protection" seçeneğini aktif etmeniz gerekir.

-- 3. MFA Options
-- Çok faktörlü kimlik doğrulama seçeneklerini etkinleştirme
-- Bu ayar Supabase Authentication ayarlarından yapılmalı
-- Aşağıdaki SQL yerine Supabase Dashboard > Authentication > Configuration > Multi-Factor Authentication
-- bölümüne gidip MFA seçeneklerini aktif etmeniz gerekir. 