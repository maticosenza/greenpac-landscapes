
-- Categories table for spare parts
CREATE TABLE public.spare_part_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#6b7280',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.spare_part_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view spare part categories" ON public.spare_part_categories
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'vendedor'::app_role));

CREATE POLICY "Admins can insert spare part categories" ON public.spare_part_categories
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update spare part categories" ON public.spare_part_categories
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete spare part categories" ON public.spare_part_categories
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Suppliers table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cuit text DEFAULT NULL,
  email text DEFAULT NULL,
  phone text DEFAULT NULL,
  province text DEFAULT NULL,
  city text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view suppliers" ON public.suppliers
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'vendedor'::app_role));

CREATE POLICY "Staff can insert suppliers" ON public.suppliers
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'vendedor'::app_role));

CREATE POLICY "Staff can update suppliers" ON public.suppliers
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'vendedor'::app_role));

CREATE POLICY "Only admins can delete suppliers" ON public.suppliers
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add category_id and supplier_id to spare_parts
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.spare_part_categories(id) ON DELETE SET NULL DEFAULT NULL;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL DEFAULT NULL;
