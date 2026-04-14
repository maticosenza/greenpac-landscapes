
-- Combos/Ofertas table
CREATE TABLE public.spare_part_combos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  combo_type TEXT NOT NULL DEFAULT 'combo' CHECK (combo_type IN ('combo', 'oferta')),
  original_price NUMERIC NOT NULL DEFAULT 0,
  combo_price NUMERIC NOT NULL DEFAULT 0,
  discount_percentage NUMERIC NOT NULL DEFAULT 0,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table
CREATE TABLE public.combo_spare_part_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_id UUID NOT NULL REFERENCES public.spare_part_combos(id) ON DELETE CASCADE,
  spare_part_id UUID NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(combo_id, spare_part_id)
);

-- Enable RLS
ALTER TABLE public.spare_part_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_spare_part_items ENABLE ROW LEVEL SECURITY;

-- Combos: staff can manage
CREATE POLICY "Staff can view combos" ON public.spare_part_combos FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'vendedor'::app_role));

CREATE POLICY "Customers can view active combos" ON public.spare_part_combos FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Staff can insert combos" ON public.spare_part_combos FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Staff can update combos" ON public.spare_part_combos FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Admins can delete combos" ON public.spare_part_combos FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Junction: staff can manage
CREATE POLICY "Staff can view combo items" ON public.combo_spare_part_items FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Staff can insert combo items" ON public.combo_spare_part_items FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Staff can delete combo items" ON public.combo_spare_part_items FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_spare_part_combos_updated_at
BEFORE UPDATE ON public.spare_part_combos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
