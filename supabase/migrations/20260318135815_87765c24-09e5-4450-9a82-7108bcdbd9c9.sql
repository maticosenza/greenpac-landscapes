
-- Create clients table for CRM tracking
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  document text,
  email text,
  phone text,
  product_interest text,
  price numeric,
  province text,
  city text,
  postal_code text,
  address text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- All staff can view clients
CREATE POLICY "Staff can view all clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR 
    has_role(auth.uid(), 'vendedor'::app_role)
  );

-- All staff can insert clients
CREATE POLICY "Staff can insert clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR 
    has_role(auth.uid(), 'vendedor'::app_role)
  );

-- All staff can update clients
CREATE POLICY "Staff can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR 
    has_role(auth.uid(), 'vendedor'::app_role)
  );

-- All staff can delete clients
CREATE POLICY "Staff can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR 
    has_role(auth.uid(), 'vendedor'::app_role)
  );

-- Updated_at trigger
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
