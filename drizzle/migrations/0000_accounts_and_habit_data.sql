CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text,
  theme_preference text NOT NULL DEFAULT 'system',
  palette text NOT NULL DEFAULT 'sunrise',
  timezone text NOT NULL DEFAULT 'UTC',
  terms_accepted_at timestamptz,
  terms_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.categories (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  name text NOT NULL,
  built_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
CREATE TABLE public.routines (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id)
);
CREATE TABLE public.habits (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '✅',
  color text NOT NULL DEFAULT 'coral',
  category_id text NOT NULL DEFAULT 'other',
  routine_id text,
  frequency jsonb NOT NULL DEFAULT '{"type":"daily"}'::jsonb,
  reminder text,
  archived boolean NOT NULL DEFAULT false,
  created_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
CREATE TABLE public.completions (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  habit_id text NOT NULL,
  day date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, habit_id, day)
);
CREATE TABLE public.goals (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  name text NOT NULL,
  habit_id text NOT NULL,
  target int NOT NULL,
  start_date date NOT NULL,
  deadline date,
  PRIMARY KEY (user_id, id)
);
CREATE TABLE public.celebrations (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  day date NOT NULL,
  PRIMARY KEY (user_id, day)
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['categories','routines','habits','completions','goals','celebrations'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "own rows select" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own rows insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own rows update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own rows delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, timezone, terms_accepted_at, terms_version)
  VALUES (
    NEW.id,
    coalesce(nullif(m->>'first_name',''), split_part(coalesce(NEW.email,''),'@',1)),
    nullif(m->>'last_name',''),
    coalesce(nullif(m->>'timezone',''), 'UTC'),
    nullif(m->>'terms_accepted_at','')::timestamptz,
    nullif(m->>'terms_version','')
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.categories (user_id, id, name, built_in)
  SELECT NEW.id, lower(n), n, true FROM unnest(ARRAY['Health','Fitness','Coding','Reading','Learning','Mindfulness','Social','Other']) AS n
  ON CONFLICT DO NOTHING;
  INSERT INTO public.routines (user_id, id, name, sort_order) VALUES
    (NEW.id,'morning','Morning',0),(NEW.id,'afternoon','Afternoon',1),(NEW.id,'evening','Evening',2)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();