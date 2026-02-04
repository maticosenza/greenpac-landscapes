-- Add images array column to products table for multiple images support
ALTER TABLE public.products 
ADD COLUMN images text[] DEFAULT '{}'::text[];

-- Migrate existing image_url to images array
UPDATE public.products 
SET images = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url != '';