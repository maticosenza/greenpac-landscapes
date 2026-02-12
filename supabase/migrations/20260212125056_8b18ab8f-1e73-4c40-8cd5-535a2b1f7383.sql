
-- Add price column to quotations
ALTER TABLE public.quotations ADD COLUMN price NUMERIC DEFAULT NULL;
