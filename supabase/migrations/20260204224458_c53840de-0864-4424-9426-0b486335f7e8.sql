-- Drop the existing policy and create a proper one that blocks all access including SELECT
DROP POLICY IF EXISTS "Allow rate limit operations via security definer functions" ON public.rate_limits;

-- Create separate policies for each operation that explicitly block all direct access
CREATE POLICY "Block all direct access to rate_limits"
ON public.rate_limits
FOR ALL
USING (false)
WITH CHECK (false);