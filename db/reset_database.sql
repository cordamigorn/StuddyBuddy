-- Veritabanını tamamen sıfırlayıp yeniden oluşturalım

-- 1. Mevcut tabloları temizle
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.pomodoro_sessions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.request_limits CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;

-- 2. Fonksiyonları temizle
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS increment_version() CASCADE;
DROP FUNCTION IF EXISTS create_profile_and_settings() CASCADE;

-- 3. Kullanıcı profili tablosu
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- 4. Kullanıcı ayarları tablosu
CREATE TABLE public.settings (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  work_duration INTEGER DEFAULT 25,
  short_break_duration INTEGER DEFAULT 5,
  long_break_duration INTEGER DEFAULT 15,
  long_break_interval INTEGER DEFAULT 4,
  auto_start_breaks BOOLEAN DEFAULT false,
  auto_start_pomodoros BOOLEAN DEFAULT false,
  daily_target INTEGER DEFAULT 8,
  notification_enabled BOOLEAN DEFAULT true,
  vibration_enabled BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- 5. Pomodoro verileri tablosu
CREATE TABLE public.pomodoro_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  category TEXT,
  task_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Görevler tablosu - priority TEXT olarak tanımlanıyor
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'todo',
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_pomodoros INTEGER DEFAULT 1,
  completed_pomodoros INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  last_modified_by UUID REFERENCES auth.users,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 8. Güvenlik politikaları
CREATE POLICY "profiles_policy" ON public.profiles 
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "settings_policy" ON public.settings 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "pomodoro_sessions_policy" ON public.pomodoro_sessions 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "tasks_policy" ON public.tasks 
  FOR ALL USING (auth.uid() = user_id);

-- 9. Fonksiyonlar ve tetikleyiciler
-- Updated_at güncelleyen fonksiyon
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Version kontrol fonksiyonu
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  NEW.last_modified_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Yeni kullanıcı kaydedildiğinde profil ve ayarlar oluşturan fonksiyon
CREATE OR REPLACE FUNCTION create_profile_and_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Tetikleyiciler
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_version_trigger
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- Yeni kullanıcı kayıt tetikleyicisi
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_and_settings();

-- 11. İndeksler
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at);
CREATE INDEX idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_sessions_start_time ON public.pomodoro_sessions(start_time);

-- 12. Kısıtlamalar
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