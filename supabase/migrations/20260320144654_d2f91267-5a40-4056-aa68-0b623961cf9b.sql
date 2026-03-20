
CREATE TABLE public.supplier_spare_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  spare_part_id uuid NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, spare_part_id)
);

ALTER TABLE public.supplier_spare_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view supplier_spare_parts" ON public.supplier_spare_parts
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'vendedor'::app_role));

CREATE POLICY "Staff can insert supplier_spare_parts" ON public.supplier_spare_parts
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'vendedor'::app_role));

CREATE POLICY "Staff can delete supplier_spare_parts" ON public.supplier_spare_parts
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'vendedor'::app_role));
