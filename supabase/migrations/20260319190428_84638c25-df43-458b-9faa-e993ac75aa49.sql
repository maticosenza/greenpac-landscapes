ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS lat double precision DEFAULT NULL;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS lng double precision DEFAULT NULL;