-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,  -- email or IP address
  action TEXT NOT NULL,      -- 'contact_inquiry' or 'quotation'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits (identifier, action, created_at);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow inserts from service role (edge functions)
-- No public access at all
CREATE POLICY "Service role only" ON public.rate_limits
  FOR ALL USING (false) WITH CHECK (false);

-- Create function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_requests INT DEFAULT 5,
  p_window_minutes INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count INT;
BEGIN
  -- Count requests within the time window
  SELECT COUNT(*) INTO request_count
  FROM rate_limits
  WHERE identifier = p_identifier
    AND action = p_action
    AND created_at > (now() - (p_window_minutes || ' minutes')::interval);
  
  RETURN request_count < p_max_requests;
END;
$$;

-- Create function to record a request
CREATE OR REPLACE FUNCTION public.record_rate_limit(
  p_identifier TEXT,
  p_action TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO rate_limits (identifier, action)
  VALUES (p_identifier, p_action);
  
  -- Clean up old entries (older than 24 hours)
  DELETE FROM rate_limits 
  WHERE created_at < (now() - interval '24 hours');
END;
$$;