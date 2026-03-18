
-- Allow vendedores to view profiles (needed for client note author names and general staff operations)
CREATE POLICY "Vendedores can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'vendedor'::app_role));
