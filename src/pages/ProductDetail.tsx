import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

interface TechnicalSpec {
  label: string;
  value: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  images: string[] | null;
  features: string[] | null;
  category: string | null;
  price: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  technical_specs: any;
}

const fallbackImages: Record<string, string> = {
  embolsadoras: product1,
  extractores: product2,
  tolvas: product3,
  mixers: product1,
  enfardadoras: product2,
  desmalezadoras: product3,
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Scroll to top when component mounts or id changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImageIndex(0);
  }, [id]);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", product?.category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", product?.category || "")
        .neq("id", id || "")
        .limit(3);

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!product?.category,
  });

  const getProductImages = (prod: Product): string[] => {
    // First check for images array
    if (prod.images && prod.images.length > 0) {
      return prod.images;
    }
    // Fall back to single image_url
    if (prod.image_url) {
      return [prod.image_url];
    }
    // Fall back to category images
    if (prod.category && fallbackImages[prod.category]) {
      return [fallbackImages[prod.category]];
    }
    return [product1];
  };

  const getProductImage = (prod: Product) => {
    const images = getProductImages(prod);
    return images[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="greenpac-section">
          <div className="greenpac-container">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-32 mb-8"></div>
              <div className="grid lg:grid-cols-2 gap-12">
                <div className="aspect-[4/3] bg-muted rounded-xl"></div>
                <div className="space-y-4">
                  <div className="h-10 bg-muted rounded w-3/4"></div>
                  <div className="h-24 bg-muted rounded"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="greenpac-section">
          <div className="greenpac-container text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Producto no encontrado
            </h1>
            <p className="text-muted-foreground mb-8">
              El producto que buscás no existe o fue eliminado.
            </p>
            <Button asChild>
              <Link to="/#productos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Productos
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 sm:pt-20">
        {/* Breadcrumb */}
        <section className="bg-muted py-4">
          <div className="greenpac-container">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">
                Inicio
              </Link>
              <span>/</span>
              <Link to="/#productos" className="hover:text-primary transition-colors">
                Productos
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">{product.name}</span>
            </nav>
          </div>
        </section>

        {/* Product Detail */}
        <section className="greenpac-section">
          <div className="greenpac-container">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Product Images Gallery */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative overflow-hidden rounded-xl shadow-lg">
                  <img
                    src={getProductImages(product)[selectedImageIndex] || getProductImage(product)}
                    alt={product.name}
                    className="w-full h-auto object-cover aspect-[4/3]"
                  />
                  {product.category && (
                    <span className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium capitalize">
                      {product.category}
                    </span>
                  )}
                  
                  {/* Navigation Arrows */}
                  {getProductImages(product).length > 1 && (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-90 hover:opacity-100 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => setSelectedImageIndex((prev) => 
                          prev === 0 ? getProductImages(product).length - 1 : prev - 1
                        )}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-90 hover:opacity-100 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => setSelectedImageIndex((prev) => 
                          prev === getProductImages(product).length - 1 ? 0 : prev + 1
                        )}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {getProductImages(product).length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {getProductImages(product).map((img, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-transparent hover:border-muted-foreground/30'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} - Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
                    {product.name}
                  </h1>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Features */}
                {product.features && product.features.length > 0 && (
                  <div className="bg-muted rounded-xl p-6">
                    <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                      Características Principales
                    </h2>
                    <ul className="space-y-3">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                            <Check className="h-4 w-4 text-primary" />
                          </span>
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Technical Specifications */}
                {product.technical_specs && Array.isArray(product.technical_specs) && product.technical_specs.length > 0 && (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <h2 className="font-display text-xl font-semibold text-foreground p-6 pb-4">
                      Especificaciones Técnicas
                    </h2>
                    <div className="divide-y divide-border">
                      {(product.technical_specs as TechnicalSpec[]).map((spec, index) => (
                        <div key={index} className="flex justify-between px-6 py-3 even:bg-muted/50">
                          <span className="text-muted-foreground">{spec.label}</span>
                          <span className="font-medium text-foreground">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price (if available) */}
                {product.price && (
                  <div className="border-t border-border pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Precio de referencia</p>
                    <p className="text-3xl font-bold text-primary">
                      ${product.price.toLocaleString("es-AR")}
                    </p>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" asChild className="flex-1">
                    <Link to="/#cotizacion">
                      Solicitar Cotización
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="flex-1">
                    <a
                      href={`https://wa.me/5491112345678?text=Hola! Estoy interesado en el producto: ${product.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Consultar por WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="greenpac-section bg-muted">
            <div className="greenpac-container">
              <h2 className="font-display text-2xl font-bold text-foreground mb-8">
                Productos Relacionados
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <Link
                    key={relatedProduct.id}
                    to={`/productos/${relatedProduct.id}`}
                    className="greenpac-card group"
                  >
                    <div className="relative overflow-hidden aspect-[4/3]">
                      <img
                        src={getProductImage(relatedProduct)}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                        {relatedProduct.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ProductDetail;
