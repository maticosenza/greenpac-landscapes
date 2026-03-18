
-- 1. Vendedores can view ALL quotations (remove hidden_from_vendedores filter)
DROP POLICY "Vendedores can view non-hidden quotations" ON public.quotations;

CREATE POLICY "Vendedores can view all quotations"
ON public.quotations
FOR SELECT
TO public
USING (has_role('vendedor'::app_role, auth.uid()));

-- 2. Vendedores can view quotation messages
DROP POLICY "Staff can view all quotation messages" ON public.quotation_messages;

CREATE POLICY "Staff can view all quotation messages"
ON public.quotation_messages
FOR SELECT
TO public
USING (
  has_role('employee'::app_role, auth.uid()) 
  OR has_role('admin'::app_role, auth.uid())
  OR has_role('vendedor'::app_role, auth.uid())
);

-- 3. Vendedores can insert quotation messages
DROP POLICY "Staff can insert quotation messages" ON public.quotation_messages;

CREATE POLICY "Staff can insert quotation messages"
ON public.quotation_messages
FOR INSERT
TO public
WITH CHECK (
  has_role('employee'::app_role, auth.uid()) 
  OR has_role('admin'::app_role, auth.uid())
  OR has_role('vendedor'::app_role, auth.uid())
);

-- 4. Vendedores can update quotations (change status, etc.)
DROP POLICY "Employees can update quotations" ON public.quotations;

CREATE POLICY "Staff can update quotations"
ON public.quotations
FOR UPDATE
TO public
USING (
  has_role('employee'::app_role, auth.uid()) 
  OR has_role('admin'::app_role, auth.uid())
  OR has_role('vendedor'::app_role, auth.uid())
);

-- 5. Vendedores can insert quotations (create new ones)
DROP POLICY "Staff can insert quotations" ON public.quotations;

CREATE POLICY "Staff can insert quotations"
ON public.quotations
FOR INSERT
TO public
WITH CHECK (
  has_role('employee'::app_role, auth.uid()) 
  OR has_role('admin'::app_role, auth.uid())
  OR has_role('vendedor'::app_role, auth.uid())
);
