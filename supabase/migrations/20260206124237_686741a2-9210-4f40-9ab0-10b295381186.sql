
-- Drop the restrictive UPDATE policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (has_role('admin'::app_role, auth.uid()))
  WITH CHECK (has_role('admin'::app_role, auth.uid()));

-- Also fix INSERT and DELETE to be permissive
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'::app_role, auth.uid()));

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (has_role('admin'::app_role, auth.uid()));

-- Fix SELECT: public read should be permissive, and admin should see ALL products
DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
CREATE POLICY "Products are publicly readable"
  ON public.products
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (has_role('admin'::app_role, auth.uid()));
