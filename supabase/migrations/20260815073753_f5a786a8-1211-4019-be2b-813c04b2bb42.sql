REVOKE ALL ON FUNCTION public.log_emergency_request_event() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_emergency_request_event() TO service_role;