ALTER TABLE public.emergency_requests
  ADD COLUMN IF NOT EXISTS request_source text NOT NULL DEFAULT 'emergency',
  ADD COLUMN IF NOT EXISTS hospital_id text,
  ADD COLUMN IF NOT EXISTS hospital_contact_phone text,
  ADD COLUMN IF NOT EXISTS risk_flags jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS emergency_requests_filter_idx
  ON public.emergency_requests (status, blood_group, city, created_at DESC);
CREATE INDEX IF NOT EXISTS emergency_requests_source_idx
  ON public.emergency_requests (request_source, created_at DESC);

CREATE TABLE public.emergency_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  detail text,
  actor_id uuid,
  actor_kind text NOT NULL DEFAULT 'system',
  channel text,
  status text,
  eta_minutes integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.emergency_request_events TO authenticated;
GRANT ALL ON public.emergency_request_events TO service_role;
ALTER TABLE public.emergency_request_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY emergency_events_owner_select ON public.emergency_request_events
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.emergency_requests r
    WHERE r.id = emergency_request_events.request_id AND r.created_by = auth.uid()
  ));
CREATE POLICY emergency_events_admin_select ON public.emergency_request_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY emergency_events_owner_insert ON public.emergency_request_events
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.emergency_requests r
    WHERE r.id = emergency_request_events.request_id AND r.created_by = auth.uid()
  ));
CREATE POLICY emergency_events_admin_insert ON public.emergency_request_events
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX emergency_request_events_request_idx ON public.emergency_request_events (request_id, created_at);

CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  channel text NOT NULL,
  name text NOT NULL,
  subject text,
  body text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_type, channel)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_templates_admin_all ON public.notification_templates
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER notification_templates_updated_at BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.notification_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  notification_id uuid REFERENCES public.emergency_notifications(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  recipient_kind text NOT NULL,
  masked_recipient text,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempt_number integer NOT NULL DEFAULT 1,
  provider_message_id text,
  error_message text,
  initiated_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_attempts TO authenticated;
GRANT ALL ON public.notification_attempts TO service_role;
ALTER TABLE public.notification_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_attempts_admin_all ON public.notification_attempts
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY notification_attempts_owner_select ON public.notification_attempts
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.emergency_requests r
    WHERE r.id = notification_attempts.request_id AND r.created_by = auth.uid()
  ));
CREATE INDEX notification_attempts_request_idx ON public.notification_attempts (request_id, created_at DESC);

CREATE TABLE public.admin_alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rule_type text NOT NULL,
  severity text NOT NULL DEFAULT 'high',
  threshold_value numeric NOT NULL DEFAULT 10,
  window_minutes integer NOT NULL DEFAULT 10,
  blood_group text,
  city text,
  channels text[] NOT NULL DEFAULT ARRAY['in_app']::text[],
  recipient_user_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  cooldown_minutes integer NOT NULL DEFAULT 30,
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_alert_rules TO authenticated;
GRANT ALL ON public.admin_alert_rules TO service_role;
ALTER TABLE public.admin_alert_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_alert_rules_admin_all ON public.admin_alert_rules
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER admin_alert_rules_updated_at BEFORE UPDATE ON public.admin_alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES public.admin_alert_rules(id) ON DELETE SET NULL,
  request_id uuid REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  recipient_user_id uuid,
  severity text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  channels text[] NOT NULL DEFAULT ARRAY['in_app']::text[],
  delivery_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL UNIQUE,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.admin_alerts TO authenticated;
GRANT ALL ON public.admin_alerts TO service_role;
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_alerts_admin_all ON public.admin_alerts
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX admin_alerts_open_idx ON public.admin_alerts (resolved_at, created_at DESC);

CREATE TABLE public.hospital_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  name text NOT NULL,
  address text,
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  phone text,
  emergency_phone text,
  capabilities text[] NOT NULL DEFAULT '{}'::text[],
  blood_bank_available boolean NOT NULL DEFAULT false,
  verification_status text NOT NULL DEFAULT 'unverified',
  verified_at timestamptz,
  source text NOT NULL DEFAULT 'curated',
  source_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hospital_directory TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hospital_directory TO authenticated;
GRANT ALL ON public.hospital_directory TO service_role;
ALTER TABLE public.hospital_directory ENABLE ROW LEVEL SECURITY;
CREATE POLICY hospital_directory_authenticated_select ON public.hospital_directory
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY hospital_directory_admin_insert ON public.hospital_directory
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY hospital_directory_admin_update ON public.hospital_directory
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY hospital_directory_admin_delete ON public.hospital_directory
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER hospital_directory_updated_at BEFORE UPDATE ON public.hospital_directory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX hospital_directory_location_idx ON public.hospital_directory (state, city, active);

CREATE TABLE public.phone_verification_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  purpose text NOT NULL,
  phone_hash text NOT NULL,
  masked_phone text NOT NULL,
  otp_hash text NOT NULL,
  draft_key uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  expires_at timestamptz NOT NULL,
  resend_available_at timestamptz NOT NULL,
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phone_verification_challenges TO authenticated;
GRANT ALL ON public.phone_verification_challenges TO service_role;
ALTER TABLE public.phone_verification_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY phone_challenges_own_select ON public.phone_verification_challenges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY phone_challenges_own_insert ON public.phone_verification_challenges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY phone_challenges_own_update ON public.phone_verification_challenges
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY phone_challenges_own_delete ON public.phone_verification_challenges
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY phone_challenges_admin_select ON public.phone_verification_challenges
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX phone_challenges_user_purpose_idx ON public.phone_verification_challenges (user_id, purpose, created_at DESC);

CREATE TABLE public.admin_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_push_subscriptions TO authenticated;
GRANT ALL ON public.admin_push_subscriptions TO service_role;
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_push_own_all ON public.admin_push_subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER admin_push_subscriptions_updated_at BEFORE UPDATE ON public.admin_push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.log_emergency_request_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.emergency_request_events
      (request_id, event_type, title, detail, actor_id, actor_kind, status, eta_minutes)
    VALUES
      (NEW.id, 'created', 'Request created', 'Request entered the operational queue.', NEW.created_by, 'requester', NEW.status, NEW.eta_minutes);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.emergency_request_events
      (request_id, event_type, title, detail, actor_kind, status, eta_minutes, metadata)
    VALUES
      (NEW.id, NEW.status, 'Status changed to ' || replace(NEW.status, '_', ' '), NEW.resolution_note, 'system', NEW.status, NEW.eta_minutes,
       jsonb_build_object('previous_status', OLD.status));
  ELSIF NEW.eta_minutes IS DISTINCT FROM OLD.eta_minutes THEN
    INSERT INTO public.emergency_request_events
      (request_id, event_type, title, detail, actor_kind, status, eta_minutes, metadata)
    VALUES
      (NEW.id, 'eta_updated', 'ETA updated', 'Estimated arrival time changed.', 'system', NEW.status, NEW.eta_minutes,
       jsonb_build_object('previous_eta_minutes', OLD.eta_minutes));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS emergency_request_event_log ON public.emergency_requests;
CREATE TRIGGER emergency_request_event_log
AFTER INSERT OR UPDATE ON public.emergency_requests
FOR EACH ROW EXECUTE FUNCTION public.log_emergency_request_event();

INSERT INTO public.notification_templates (event_type, channel, name, subject, body)
VALUES
 ('dispatch', 'sms', 'Emergency dispatch SMS', NULL, 'SANJEEVANI X: {{blood_group}} request {{request_id}} is live at {{hospital}}. {{notified_count}} donors alerted.'),
 ('donor_alert', 'whatsapp', 'Donor emergency alert', NULL, 'Emergency: {{blood_group}} blood needed at {{hospital}}. Reply YES to accept or NO to decline.'),
 ('accepted', 'sms', 'Donor accepted SMS', NULL, '{{donor_name}} accepted request {{request_id}}. ETA {{eta_minutes}} minutes.'),
 ('eta_update', 'push', 'ETA update push', 'ETA updated', 'Request {{request_id}} ETA is now {{eta_minutes}} minutes.'),
 ('timeout', 'email', 'Request timeout email', 'Emergency request needs escalation', 'No donor accepted request {{request_id}} within the configured response window.'),
 ('verification_otp', 'sms', 'Phone verification OTP', NULL, 'Your Sanjeevani X verification code is {{otp}}. It expires in 10 minutes.'),
 ('delivery_failure', 'email', 'Delivery failure alert', 'Notification delivery failed', 'Delivery failed for request {{request_id}} on {{channel}}: {{error}}.')
ON CONFLICT (event_type, channel) DO NOTHING;

INSERT INTO public.hospital_directory
  (external_id, name, address, city, state, latitude, longitude, phone, emergency_phone, capabilities, blood_bank_available, verification_status, verified_at, source)
VALUES
 ('CUR-AIIMS-DEL', 'AIIMS New Delhi', 'Sri Aurobindo Marg, Ansari Nagar', 'Delhi', 'Delhi', 28.5672, 77.2100, '+911126588500', '+911126594444', ARRAY['trauma','emergency','transfusion'], true, 'verified', now(), 'curated'),
 ('CUR-KEM-MUM', 'KEM Hospital', 'Acharya Donde Marg, Parel', 'Mumbai', 'Maharashtra', 18.9998, 72.8421, '+912224107000', '+912224136007', ARRAY['emergency','transfusion'], true, 'verified', now(), 'curated'),
 ('CUR-LIL-MUM', 'Lilavati Hospital', 'A-791, Bandra Reclamation', 'Mumbai', 'Maharashtra', 19.0544, 72.8365, '+912226751000', '+912226751111', ARRAY['emergency','critical-care'], true, 'verified', now(), 'curated'),
 ('CUR-APOLLO-CHE', 'Apollo Hospitals Greams Road', '21 Greams Lane, Off Greams Road', 'Chennai', 'Tamil Nadu', 13.0630, 80.2520, '+914428293333', '+914428290200', ARRAY['emergency','transfusion','critical-care'], true, 'verified', now(), 'curated'),
 ('CUR-FORTIS-BLR', 'Fortis Hospital Bannerghatta Road', '154/9 Bannerghatta Road', 'Bengaluru', 'Karnataka', 12.8950, 77.5982, '+918066214444', '+918066214444', ARRAY['emergency','critical-care'], true, 'verified', now(), 'curated'),
 ('CUR-RUBY-PUN', 'Ruby Hall Clinic', '40 Sassoon Road', 'Pune', 'Maharashtra', 18.5285, 73.8745, '+912026123391', '+912066461500', ARRAY['emergency','transfusion'], true, 'verified', now(), 'curated'),
 ('CUR-NIMS-HYD', 'Nizam’s Institute of Medical Sciences', 'Punjagutta', 'Hyderabad', 'Telangana', 17.4239, 78.4738, '+914023489000', '+914023489999', ARRAY['emergency','transfusion'], true, 'verified', now(), 'curated'),
 ('CUR-PGIMER-CHD', 'PGIMER Chandigarh', 'Sector 12', 'Chandigarh', 'Chandigarh', 30.7649, 76.7757, '+911722756565', '+911722745200', ARRAY['trauma','emergency','transfusion'], true, 'verified', now(), 'curated'),
 ('CUR-CMC-VEL', 'Christian Medical College Vellore', 'Ida Scudder Road', 'Vellore', 'Tamil Nadu', 12.9249, 79.1353, '+914162282010', '+914162282040', ARRAY['emergency','transfusion','critical-care'], true, 'verified', now(), 'curated'),
 ('CUR-SGPGI-LKO', 'SGPGIMS Lucknow', 'Raebareli Road', 'Lucknow', 'Uttar Pradesh', 26.7438, 80.9462, '+915222494070', '+915222495000', ARRAY['emergency','transfusion'], true, 'verified', now(), 'curated'),
 ('CUR-SMS-JAI', 'Sawai Man Singh Hospital', 'Jawahar Lal Nehru Marg', 'Jaipur', 'Rajasthan', 26.9053, 75.8160, '+911412565251', '+911412565251', ARRAY['trauma','emergency','transfusion'], true, 'verified', now(), 'curated'),
 ('CUR-AMRI-KOL', 'AMRI Hospital Dhakuria', 'P-4 & 5, Gariahat Road', 'Kolkata', 'West Bengal', 22.5090, 88.3661, '+913366000000', '+913366000000', ARRAY['emergency','critical-care'], true, 'verified', now(), 'curated')
ON CONFLICT (external_id) DO NOTHING;

ALTER TABLE public.emergency_request_events REPLICA IDENTITY FULL;
ALTER TABLE public.admin_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_request_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_alerts;