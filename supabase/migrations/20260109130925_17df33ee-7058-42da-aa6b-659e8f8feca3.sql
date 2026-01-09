-- Create products table for expanded catalog
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  features TEXT[] DEFAULT '{}',
  category TEXT,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotations table
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  company TEXT,
  product_ids UUID[] DEFAULT '{}',
  message TEXT,
  quotation_type TEXT DEFAULT 'quote' CHECK (quotation_type IN ('quote', 'purchase', 'deposit')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable
CREATE POLICY "Products are publicly readable" 
ON public.products 
FOR SELECT 
USING (is_active = true);

-- Testimonials are publicly readable
CREATE POLICY "Testimonials are publicly readable" 
ON public.testimonials 
FOR SELECT 
USING (is_active = true);

-- Anyone can submit a quotation
CREATE POLICY "Anyone can submit quotations" 
ON public.quotations 
FOR INSERT 
WITH CHECK (true);

-- Insert sample products
INSERT INTO public.products (name, description, features, category, sort_order) VALUES
('Embolsadora de Granos', 'Máquinas de alta capacidad para el embolsado eficiente de granos y forrajes. Diseño robusto y confiable.', ARRAY['Alta capacidad', 'Bajo mantenimiento', 'Fácil operación'], 'embolsadoras', 1),
('Extractor de Silobolsa', 'Equipos de última generación para la extracción rápida y limpia del material almacenado.', ARRAY['Extracción veloz', 'Mínima pérdida', 'Sistema hidráulico'], 'extractores', 2),
('Tolvas y Acoplados', 'Soluciones de transporte y almacenamiento para optimizar la logística de tu establecimiento.', ARRAY['Gran capacidad', 'Estructura reforzada', 'Versatilidad'], 'tolvas', 3),
('Mixer Horizontal', 'Mezclador de alimentos de alta eficiencia para la preparación de raciones balanceadas.', ARRAY['Mezcla uniforme', 'Motor potente', 'Fácil limpieza'], 'mixers', 4),
('Rotoenfardadora', 'Equipos para la confección de rollos de alta densidad con sistema de atado automático.', ARRAY['Alta densidad', 'Atado automático', 'Bajo consumo'], 'enfardadoras', 5),
('Desmalezadora', 'Maquinaria robusta para el control de malezas y mantenimiento de terrenos agrícolas.', ARRAY['Corte preciso', 'Resistente', 'Múltiples anchos'], 'desmalezadoras', 6);

-- Insert sample testimonials
INSERT INTO public.testimonials (client_name, company, role, content, rating) VALUES
('Juan Carlos Rodríguez', 'Estancia Los Alamos', 'Productor Agropecuario', 'Excelente calidad en sus productos. La embolsadora que adquirimos superó nuestras expectativas. El servicio post-venta es impecable.', 5),
('María Elena Fernández', 'Agrícola Del Sur S.A.', 'Gerente de Operaciones', 'Llevamos 3 años trabajando con GreenPac y la experiencia ha sido excepcional. Equipos confiables y un equipo técnico siempre disponible.', 5),
('Roberto Martínez', 'Campo Grande', 'Dueño', 'La relación precio-calidad es inmejorable. Nos asesoran en cada compra y el financiamiento es muy accesible.', 4);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON public.quotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();