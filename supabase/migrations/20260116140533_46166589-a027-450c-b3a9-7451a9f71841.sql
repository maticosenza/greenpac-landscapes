-- Remove the redundant "Admins can manage all roles" ALL policy
-- The specific policies for INSERT, UPDATE, DELETE, and SELECT already provide proper access control
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;