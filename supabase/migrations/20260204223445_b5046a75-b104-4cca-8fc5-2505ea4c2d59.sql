-- Drop the overly permissive policy that allows any authenticated user to access all profiles
DROP POLICY IF EXISTS "Require authentication for all profiles access" ON public.profiles;