-- Bazit Content Management Schema

CREATE TABLE IF NOT EXISTS public.bazit_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  platform TEXT NOT NULL DEFAULT 'instagram_reel',
  title TEXT NOT NULL,
  publish_time TIME,
  script TEXT,
  caption TEXT,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'filmado', 'editado', 'publicado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bazit_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_progreso', 'completado')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('alta', 'normal', 'baja')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bazit_improvements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'contenido' CHECK (category IN ('contenido', 'diseño', 'estrategia', 'produccion', 'otro')),
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'implementado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bazit_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bazit_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bazit_improvements ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users
CREATE POLICY "bazit_content_auth" ON public.bazit_content
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "bazit_tasks_auth" ON public.bazit_tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "bazit_improvements_auth" ON public.bazit_improvements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bazit_content_updated_at
  BEFORE UPDATE ON public.bazit_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bazit_tasks_updated_at
  BEFORE UPDATE ON public.bazit_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
