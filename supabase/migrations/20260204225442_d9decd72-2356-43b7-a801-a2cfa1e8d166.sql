-- Drop the permissive policies that are too broad
DROP POLICY IF EXISTS "Block anonymous access to quotations" ON public.quotations;
DROP POLICY IF EXISTS "Block anonymous access to contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous access to user roles" ON public.user_roles;

-- Create RESTRICTIVE policies that require authentication as a baseline
-- RESTRICTIVE policies combine with AND, not OR, so they work properly
CREATE POLICY "Require authentication for quotations"
ON public.quotations
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication for contact inquiries"
ON public.contact_inquiries
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication for profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication for user roles"
ON public.user_roles
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);