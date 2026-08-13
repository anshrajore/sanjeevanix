-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  blood_group TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- donor eligibility questionnaire
CREATE TABLE public.donor_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  eligible BOOLEAN NOT NULL DEFAULT false,
  score INTEGER NOT NULL DEFAULT 0,
  deferral_reason TEXT,
  next_eligible_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX donor_eligibility_user_idx ON public.donor_eligibility (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donor_eligibility TO authenticated;
GRANT ALL ON public.donor_eligibility TO service_role;
ALTER TABLE public.donor_eligibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eligibility_own_select" ON public.donor_eligibility FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "eligibility_own_insert" ON public.donor_eligibility FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "eligibility_own_delete" ON public.donor_eligibility FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- emergency requests
CREATE TABLE public.emergency_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  units_needed INTEGER NOT NULL DEFAULT 1,
  city TEXT NOT NULL,
  hospital TEXT,
  contact_phone TEXT,
  urgency TEXT NOT NULL DEFAULT 'Critical',
  status TEXT NOT NULL DEFAULT 'dispatching',
  eta_minutes INTEGER,
  notified_count INTEGER NOT NULL DEFAULT 0,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX emergency_requests_owner_idx ON public.emergency_requests (created_by, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_requests TO authenticated;
GRANT ALL ON public.emergency_requests TO service_role;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emergency_own_select" ON public.emergency_requests FOR SELECT TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "emergency_own_insert" ON public.emergency_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "emergency_own_update" ON public.emergency_requests FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- per-donor outreach log
CREATE TABLE public.emergency_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  donor_ref TEXT NOT NULL,
  donor_name TEXT NOT NULL,
  masked_phone TEXT,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'queued',
  provider_sid TEXT,
  error TEXT,
  distance_km NUMERIC,
  eta_minutes INTEGER,
  match_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX emergency_notifications_request_idx ON public.emergency_notifications (request_id, created_at);
GRANT SELECT ON public.emergency_notifications TO authenticated;
GRANT ALL ON public.emergency_notifications TO service_role;
ALTER TABLE public.emergency_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emergency_notifications_owner_select" ON public.emergency_notifications
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.emergency_requests r
    WHERE r.id = emergency_notifications.request_id AND r.created_by = auth.uid()
  ));

-- timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER emergency_requests_updated_at BEFORE UPDATE ON public.emergency_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();