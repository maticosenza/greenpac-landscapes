
-- Add company column to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company text DEFAULT NULL;

-- Add spare_part_interest column to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS spare_part_interest text DEFAULT NULL;

-- Create spare_parts table
CREATE TABLE public.spare_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  price numeric DEFAULT NULL,
  stock integer NOT NULL DEFAULT 0,
  vendor_id uuid DEFAULT NULL,
  supplier text DEFAULT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

-- RLS: Staff can view
CREATE POLICY "Staff can view spare parts" ON public.spare_parts
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'employee'::app_role) OR
    has_role(auth.uid(), 'vendedor'::app_role)
  );

-- RLS: Staff can insert
CREATE POLICY "Staff can insert spare parts" ON public.spare_parts
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'employee'::app_role) OR
    has_role(auth.uid(), 'vendedor'::app_role)
  );

-- RLS: Staff can update
CREATE POLICY "Staff can update spare parts" ON public.spare_parts
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'employee'::app_role) OR
    has_role(auth.uid(), 'vendedor'::app_role)
  );

-- RLS: Only admins can delete
CREATE POLICY "Only admins can delete spare parts" ON public.spare_parts
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_spare_parts_updated_at
  BEFORE UPDATE ON public.spare_parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
