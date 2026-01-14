-- Create has_role function if not exists
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add admin role to cosenzamati@gmail.com when they sign up
-- First, check if the user exists and add the role
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Try to find user by email in profiles
  SELECT id INTO target_user_id FROM public.profiles WHERE email = 'cosenzamati@gmail.com';
  
  -- If user exists, add admin role if not already present
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'employee')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Create a trigger to auto-assign admin role when cosenzamati@gmail.com registers
CREATE OR REPLACE FUNCTION public.check_admin_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'cosenzamati@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'employee')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS on_profile_check_admin ON public.profiles;
CREATE TRIGGER on_profile_check_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_admin_email();

-- Update RLS policies for user_roles to allow admins to manage roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role('admin'::public.app_role, auth.uid()));

-- Admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role('admin'::public.app_role, auth.uid()));

-- Admins can update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role('admin'::public.app_role, auth.uid()));

-- Admins can delete roles (except their own admin role)
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role('admin'::public.app_role, auth.uid()) AND NOT (user_id = auth.uid() AND role = 'admin'));

-- Allow employees to view all profiles for customer management
DROP POLICY IF EXISTS "Employees can view all profiles" ON public.profiles;
CREATE POLICY "Employees can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role('employee'::public.app_role, auth.uid()) OR public.has_role('admin'::public.app_role, auth.uid()));

-- Allow employees to view all quotations
DROP POLICY IF EXISTS "Employees can view all quotations" ON public.quotations;
CREATE POLICY "Employees can view all quotations"
ON public.quotations FOR SELECT
USING (public.has_role('employee'::public.app_role, auth.uid()) OR public.has_role('admin'::public.app_role, auth.uid()));

-- Allow employees to update quotations
DROP POLICY IF EXISTS "Employees can update quotations" ON public.quotations;
CREATE POLICY "Employees can update quotations"
ON public.quotations FOR UPDATE
USING (public.has_role('employee'::public.app_role, auth.uid()) OR public.has_role('admin'::public.app_role, auth.uid()));