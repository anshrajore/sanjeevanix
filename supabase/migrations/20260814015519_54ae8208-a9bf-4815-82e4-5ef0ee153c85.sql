-- 1. Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'coordinator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY user_roles_own_select ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_roles_admin_select ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. Emergency requests: expiry / timeout / admin oversight
ALTER TABLE public.emergency_requests
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '45 minutes'),
  ADD COLUMN IF NOT EXISTS resolution_note text;

CREATE POLICY emergency_admin_select ON public.emergency_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY emergency_admin_update ON public.emergency_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Emergency notifications: donor responses + requester receipts
ALTER TABLE public.emergency_notifications
  ADD COLUMN IF NOT EXISTS response text,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS recipient_kind text NOT NULL DEFAULT 'donor';

CREATE POLICY emergency_notifications_owner_insert ON public.emergency_notifications
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.emergency_requests r
    WHERE r.id = request_id AND r.created_by = auth.uid()
  ));

CREATE POLICY emergency_notifications_owner_update ON public.emergency_notifications
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.emergency_requests r
    WHERE r.id = request_id AND r.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.emergency_requests r
    WHERE r.id = request_id AND r.created_by = auth.uid()
  ));

CREATE POLICY emergency_notifications_admin_select ON public.emergency_notifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Eligibility audit trail
CREATE TABLE public.eligibility_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  eligible boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0,
  deferral_reason text,
  next_eligible_date date,
  source text NOT NULL DEFAULT 'donor-dashboard',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.eligibility_audit TO authenticated;
GRANT ALL ON public.eligibility_audit TO service_role;

ALTER TABLE public.eligibility_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY eligibility_audit_own_select ON public.eligibility_audit
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY eligibility_audit_own_insert ON public.eligibility_audit
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY eligibility_audit_admin_select ON public.eligibility_audit
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY profiles_admin_select ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY eligibility_admin_select ON public.donor_eligibility
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS eligibility_audit_user_created_idx
  ON public.eligibility_audit (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS emergency_notifications_request_idx
  ON public.emergency_notifications (request_id);
CREATE INDEX IF NOT EXISTS emergency_requests_created_idx
  ON public.emergency_requests (created_at DESC);

-- 5. Realtime
ALTER TABLE public.emergency_requests REPLICA IDENTITY FULL;
ALTER TABLE public.emergency_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_notifications;