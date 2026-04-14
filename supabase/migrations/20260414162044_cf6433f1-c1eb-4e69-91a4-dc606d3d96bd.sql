-- Add spare part fields to quotations
ALTER TABLE public.quotations
ADD COLUMN spare_part_id uuid REFERENCES public.spare_parts(id) ON DELETE SET NULL,
ADD COLUMN spare_part_quantity integer;

-- Allow all authenticated users to read spare_parts
CREATE POLICY "Customers can view spare parts"
ON public.spare_parts
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to read spare_part_categories
CREATE POLICY "Customers can view spare part categories"
ON public.spare_part_categories
FOR SELECT
TO authenticated
USING (true);