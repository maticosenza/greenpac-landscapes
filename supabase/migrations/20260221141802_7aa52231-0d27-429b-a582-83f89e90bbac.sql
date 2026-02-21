-- Add column to control vendedor visibility
ALTER TABLE public.quotations 
ADD COLUMN hidden_from_vendedores boolean NOT NULL DEFAULT false;

-- Add RLS policy for vendedores to view non-hidden quotations
CREATE POLICY "Vendedores can view non-hidden quotations"
ON public.quotations
FOR SELECT
USING (
  has_role('vendedor'::app_role, auth.uid()) 
  AND hidden_from_vendedores = false
);
