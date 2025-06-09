-- Güvenlik güncellemeleri ve iyileştirmeler

-- 1. RLS (Row Level Security) Güncellemeleri
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Güvenlik politikaları
DROP POLICY IF EXISTS "tasks_isolation_policy" ON public.tasks;
DROP POLICY IF EXISTS "settings_isolation_policy" ON public.settings;
DROP POLICY IF EXISTS "sessions_isolation_policy" ON public.pomodoro_sessions;

CREATE POLICY "tasks_isolation_policy" ON public.tasks 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "settings_isolation_policy" ON public.settings 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "sessions_isolation_policy" ON public.pomodoro_sessions 
  FOR ALL USING (auth.uid() = user_id);

-- 2. Veri Doğrulama ve Kısıtlamalar
-- Önce priority kolonunu TEXT'e çevir
ALTER TABLE public.tasks 
  ALTER COLUMN priority TYPE TEXT USING priority::TEXT;

-- Önce eski constraint'leri sil
ALTER TABLE public.tasks 
  DROP CONSTRAINT IF EXISTS valid_priority;

ALTER TABLE public.settings 
  DROP CONSTRAINT IF EXISTS valid_durations;

-- Yeni constraint'leri ekle
ALTER TABLE public.tasks 
  ADD CONSTRAINT valid_priority 
  CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE public.settings 
  ADD CONSTRAINT valid_durations 
  CHECK (
    work_duration BETWEEN 1 AND 120 AND
    short_break_duration BETWEEN 1 AND 30 AND
    long_break_duration BETWEEN 1 AND 60
  );

-- Zorunlu alanlar
ALTER TABLE public.tasks 
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL;

-- 3. İndeksler
DROP INDEX IF EXISTS idx_tasks_user_id;
DROP INDEX IF EXISTS idx_tasks_created_at;
DROP INDEX IF EXISTS idx_pomodoro_sessions_user_id;
DROP INDEX IF EXISTS idx_pomodoro_sessions_start_time;

CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at);
CREATE INDEX idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_sessions_start_time ON public.pomodoro_sessions(start_time);

-- 4. Otomatik Zaman Damgası
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.tasks;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 5. Veri Şifreleme için Hazırlık
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 6. Rate Limiting için Tablo
DROP TABLE IF EXISTS public.request_limits;
CREATE TABLE public.request_limits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 0,
  last_request timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Rate limiting için RLS
ALTER TABLE public.request_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rate_limit_policy" ON public.request_limits;
CREATE POLICY "rate_limit_policy" ON public.request_limits
  FOR ALL USING (auth.uid() = user_id);

-- 7. Aktivite Logları için Tablo
DROP TABLE IF EXISTS public.activity_logs;
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Aktivite logları için RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_logs_policy" ON public.activity_logs;
CREATE POLICY "activity_logs_policy" ON public.activity_logs
  FOR ALL USING (auth.uid() = user_id);

-- 8. Soft Delete için Hazırlık
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users;

-- Soft delete için view
DROP VIEW IF EXISTS public.active_tasks;
CREATE VIEW public.active_tasks AS
  SELECT * FROM public.tasks
  WHERE deleted_at IS NULL;

-- 9. Version Control için Kolonlar
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_modified_by uuid REFERENCES auth.users;

-- Version control trigger
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.last_modified_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_version_trigger ON public.tasks;
CREATE TRIGGER tasks_version_trigger
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION increment_version(); 