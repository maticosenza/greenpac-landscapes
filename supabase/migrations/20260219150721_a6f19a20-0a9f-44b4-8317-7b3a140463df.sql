
-- Create role_permissions table
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  tool_key text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (role, tool_key)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage role_permissions"
  ON public.role_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read role_permissions"
  ON public.role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Insert default permissions
INSERT INTO public.role_permissions (role, tool_key, is_enabled) VALUES
  ('employee', 'products', true),
  ('employee', 'quotations', false),
  ('employee', 'clients', true),
  ('employee', 'contact_inquiries', true),
  ('vendedor', 'products', false),
  ('vendedor', 'quotations', true),
  ('vendedor', 'clients', false),
  ('vendedor', 'contact_inquiries', false),
  ('admin', 'products', true),
  ('admin', 'quotations', true),
  ('admin', 'clients', true),
  ('admin', 'contact_inquiries', true);

-- Trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
