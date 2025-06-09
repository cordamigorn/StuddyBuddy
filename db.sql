-- Varolan tabloları sil (EĞER gerekliyse)
DROP TABLE IF EXISTS public.pomodoro_sessions;
DROP TABLE IF EXISTS public.tasks;
DROP TABLE IF EXISTS public.settings;

-- Kullanıcı ayarları tablosu
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    work_duration INTEGER NOT NULL DEFAULT 25,
    short_break_duration INTEGER NOT NULL DEFAULT 5,
    long_break_duration INTEGER NOT NULL DEFAULT 15,
    long_break_interval INTEGER NOT NULL DEFAULT 4,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- RLS (Row Level Security) kuralları
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kullanıcıların kendi ayarlarını okumasına izin ver" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcıların kendi ayarlarını güncellemesine izin ver" ON public.settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcıların kendi ayarlarını oluşturmasına izin ver" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcıların kendi ayarlarını silmesine izin ver" ON public.settings FOR DELETE USING (auth.uid() = user_id);

-- Görevler tablosu
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER NOT NULL DEFAULT 2, -- 1: Düşük, 2: Orta, 3: Yüksek
    estimated_pomodoros INTEGER NOT NULL DEFAULT 1,
    completed_pomodoros INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS (Row Level Security) kuralları
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kullanıcıların kendi görevlerini okumasına izin ver" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcıların kendi görevlerini güncellemesine izin ver" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcıların kendi görevlerini oluşturmasına izin ver" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcıların kendi görevlerini silmesine izin ver" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Pomodoro oturumları tablosu
CREATE TABLE public.pomodoro_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    task_id UUID REFERENCES public.tasks,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER NOT NULL, -- Dakika cinsinden
    session_type TEXT NOT NULL, -- 'work', 'short_break', 'long_break'
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS (Row Level Security) kuralları
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kullanıcıların kendi oturumlarını okumasına izin ver" ON public.pomodoro_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcıların kendi oturumlarını güncellemesine izin ver" ON public.pomodoro_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcıların kendi oturumlarını oluşturmasına izin ver" ON public.pomodoro_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcıların kendi oturumlarını silmesine izin ver" ON public.pomodoro_sessions FOR DELETE USING (auth.uid() = user_id);

-- Tetikleyiciler için fonksiyonlar
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at sütunlarını otomatik güncellemek için tetikleyiciler
CREATE TRIGGER set_updated_at_settings
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_tasks
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_pomodoro_sessions
    BEFORE UPDATE ON public.pomodoro_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); 