-- Fix: contact_inquiries - Make restrictive policy require staff role, not just authentication
DROP POLICY IF EXISTS "Require authentication for reading contact inquiries" ON public.contact_inquiries;

-- The existing "Staff can view all contact inquiries" policy already handles this correctly
-- No additional policy needed for SELECT

-- Fix: testimonials - Add policies for write operations (admin only)
CREATE POLICY "Admins can insert testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK (has_role('admin'::app_role, auth.uid()));

CREATE POLICY "Admins can update testimonials"
ON public.testimonials
FOR UPDATE
USING (has_role('admin'::app_role, auth.uid()));

CREATE POLICY "Admins can delete testimonials"
ON public.testimonials
FOR DELETE
USING (has_role('admin'::app_role, auth.uid()));

-- Fix: rate_limits - Update policy to allow service role operations
DROP POLICY IF EXISTS "Service role only" ON public.rate_limits;

CREATE POLICY "Allow rate limit operations via security definer functions"
ON public.rate_limits
FOR ALL
USING (false)
WITH CHECK (false);
-- Note: Rate limiting is handled by security definer functions (check_rate_limit, record_rate_limit)
-- which bypass RLS, so this policy correctly blocks direct access while allowing function access