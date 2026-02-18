
-- Fix contact_inquiries: drop overly permissive UPDATE and DELETE policies
-- Staff already have their own UPDATE/DELETE policies via has_role checks
DROP POLICY IF EXISTS "Require authentication for updating contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Require authentication for deleting contact inquiries" ON public.contact_inquiries;
