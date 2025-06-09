-- 1. Önce mevcut constraint ve trigger'ları temizle
DROP TRIGGER IF EXISTS set_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS tasks_version_trigger ON public.tasks;
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS increment_version();

-- 2. Mevcut politikaları temizle
DROP POLICY IF EXISTS "tasks_isolation_policy" ON public.tasks;
DROP POLICY IF EXISTS "settings_isolation_policy" ON public.settings;
DROP POLICY IF EXISTS "sessions_isolation_policy" ON public.pomodoro_sessions;
-- Aşağıdaki satırları yorum satırına alıyoruz çünkü bu tablolar henüz yok
-- DROP POLICY IF EXISTS "rate_limit_policy" ON public.request_limits;
-- DROP POLICY IF EXISTS "activity_logs_policy" ON public.activity_logs;

-- 3. Geçici olarak RLS'i devre dışı bırak
ALTER TABLE IF EXISTS public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pomodoro_sessions DISABLE ROW LEVEL SECURITY;

-- 4. Mevcut priority değerlerini düzelt
UPDATE public.tasks 
SET priority = 'medium' 
WHERE priority IS NULL OR priority NOT IN ('low', 'medium', 'high');

-- 5. Constraint'leri yeniden ekle
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS valid_priority;
ALTER TABLE public.tasks ADD CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high'));

-- 6. Temel fonksiyonları oluştur
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  NEW.last_modified_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger'ları ekle
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_version_trigger
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- 8. RLS'i yeniden aktifleştir ve politikaları ekle
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_isolation_policy" ON public.tasks 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "settings_isolation_policy" ON public.settings 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "sessions_isolation_policy" ON public.pomodoro_sessions 
  FOR ALL USING (auth.uid() = user_id);

-- 9. İndeksleri güncelle
DROP INDEX IF EXISTS idx_tasks_user_id;
DROP INDEX IF EXISTS idx_tasks_created_at;
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at);

-- 10. Eksik kolonları ekle (eğer yoksa)
DO $$ 
BEGIN 
  BEGIN
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS last_modified_by uuid REFERENCES auth.users;
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users;
  EXCEPTION 
    WHEN duplicate_column THEN 
      NULL;
  END;
END $$; 