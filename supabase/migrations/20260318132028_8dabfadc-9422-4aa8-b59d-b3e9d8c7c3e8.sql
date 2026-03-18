
DROP POLICY "Staff can delete quotations" ON public.quotations;

CREATE POLICY "Staff can delete quotations"
ON public.quotations
FOR DELETE
TO public
USING (
  has_role('employee'::app_role, auth.uid()) 
  OR has_role('admin'::app_role, auth.uid())
  OR has_role('vendedor'::app_role, auth.uid())
);
