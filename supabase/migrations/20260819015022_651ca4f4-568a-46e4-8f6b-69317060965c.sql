CREATE TABLE public.voice_call_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES public.emergency_requests(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assistant_id text,
  outcome text NOT NULL DEFAULT 'unknown',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  duration_seconds integer,
  error_message text,
  fallback_reason text,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.voice_call_logs TO authenticated;
GRANT INSERT ON public.voice_call_logs TO anon;
GRANT ALL ON public.voice_call_logs TO service_role;

ALTER TABLE public.voice_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a voice call log"
  ON public.voice_call_logs FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users read their own voice call logs"
  ON public.voice_call_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins and coordinators read all voice call logs"
  ON public.voice_call_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coordinator'));

CREATE INDEX voice_call_logs_request_idx ON public.voice_call_logs (request_id, created_at DESC);