
-- Add brochure_url column to products (stores storage path, not public URL)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS brochure_url TEXT;

-- Storage policies for product-brochures (private bucket; signed URLs for download)
CREATE POLICY "Anyone can read product brochures"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-brochures');

CREATE POLICY "Admins can upload product brochures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-brochures'
  AND has_role('admin'::app_role, auth.uid())
);

CREATE POLICY "Admins can update product brochures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-brochures'
  AND has_role('admin'::app_role, auth.uid())
);

CREATE POLICY "Admins can delete product brochures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-brochures'
  AND has_role('admin'::app_role, auth.uid())
);
