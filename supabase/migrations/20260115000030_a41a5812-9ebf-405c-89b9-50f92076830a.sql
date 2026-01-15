-- Add technical_specs column to products table
ALTER TABLE public.products 
ADD COLUMN technical_specs JSONB DEFAULT '{}';

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Storage policies for product images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND has_role('admin'::app_role, auth.uid())
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND has_role('admin'::app_role, auth.uid())
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND has_role('admin'::app_role, auth.uid())
);

-- Add RLS policies for admins to manage products
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (has_role('admin'::app_role, auth.uid()));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (has_role('admin'::app_role, auth.uid()));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (has_role('admin'::app_role, auth.uid()));