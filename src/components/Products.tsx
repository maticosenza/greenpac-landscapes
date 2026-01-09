import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  features: string[] | null;
  category: string | null;
}

// Fallback images for products without custom images
const fallbackImages: Record<string, string> = {
  embolsadoras: product1,
  extractores: product2,
  tolvas: product3,
  mixers: product1,
  enfardadoras: product2,
  desmalezadoras: product3,
};

const Products = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order");

      if (error) throw error;
      return data as Product[];
    },
  });

  const getProductImage = (product: Product) => {
    if (product.image_url) return product.image_url;
    if (product.category && fallbackImages[product.category]) {
      return fallbackImages[product.category];
    }
    return product1;
  };

  return (
    <section id="productos" className="greenpac-section bg-muted">
      <div className="greenpac-container">
        <div className="text-center mb-16">
          <p className="text-primary font-display font-semibold mb-3 tracking-widest uppercase">
            Catálogo
          </p>
          <h2 className="greenpac-title text-foreground mb-4">
            Nuestros Productos
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Maquinaria de primera línea para la conservación y manejo de forrajes.
            Importamos las mejores marcas del mercado internacional.
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products?.map((product, index) => (
              <div
                key={product.id}
                className="greenpac-card group"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-greenpac-dark/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-bold text-foreground mb-3">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {product.description}
                  </p>
                  {product.features && product.features.length > 0 && (
                    <ul className="flex flex-wrap gap-2 mb-5">
                      {product.features.map((feature) => (
                        <li
                          key={feature}
                          className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full"
                        >
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button variant="ghost" className="group/btn p-0 h-auto text-primary hover:bg-transparent">
                    Más información
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Button variant="default" size="lg" asChild>
            <a href="#cotizacion">
              Solicitar Cotización
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Products;
