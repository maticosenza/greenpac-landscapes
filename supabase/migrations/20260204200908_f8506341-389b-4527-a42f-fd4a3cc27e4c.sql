-- Add restrictive policies to ensure no anonymous access to sensitive tables

-- PROFILES TABLE: Require authentication for all operations
-- This adds an additional layer of security on top of existing policies
CREATE POLICY "Require authentication for all profiles access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- CONTACT_INQUIRIES TABLE: 
-- INSERT should allow anyone (for contact form), but SELECT/UPDATE/DELETE need staff
-- Add restrictive policies for SELECT, UPDATE, DELETE to require authentication
CREATE POLICY "Require authentication for reading contact inquiries"
ON public.contact_inquiries
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication for updating contact inquiries"
ON public.contact_inquiries
AS RESTRICTIVE
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication for deleting contact inquiries"
ON public.contact_inquiries
AS RESTRICTIVE
FOR DELETE
USING (auth.uid() IS NOT NULL);