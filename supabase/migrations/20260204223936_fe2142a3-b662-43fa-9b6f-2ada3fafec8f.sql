-- Add explicit policy to block anonymous SELECT access to quotations
CREATE POLICY "Block anonymous access to quotations"
ON public.quotations
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add explicit policy to block anonymous SELECT access to contact_inquiries  
CREATE POLICY "Block anonymous access to contact inquiries"
ON public.contact_inquiries
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add explicit policy to block anonymous SELECT access to profiles
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add explicit policy to block anonymous SELECT access to user_roles
CREATE POLICY "Block anonymous access to user roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() IS NOT NULL);