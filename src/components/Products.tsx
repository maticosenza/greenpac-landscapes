import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

const products = [
  {
    id: 1,
    name: "Embolsadora de Granos",
    description:
      "Máquinas de alta capacidad para el embolsado eficiente de granos y forrajes. Diseño robusto y confiable.",
    image: product1,
    features: ["Alta capacidad", "Bajo mantenimiento", "Fácil operación"],
  },
  {
    id: 2,
    name: "Extractor de Silobolsa",
    description:
      "Equipos de última generación para la extracción rápida y limpia del material almacenado.",
    image: product2,
    features: ["Extracción veloz", "Mínima pérdida", "Sistema hidráulico"],
  },
  {
    id: 3,
    name: "Tolvas y Acoplados",
    description:
      "Soluciones de transporte y almacenamiento para optimizar la logística de tu establecimiento.",
    image: product3,
    features: ["Gran capacidad", "Estructura reforzada", "Versatilidad"],
  },
];

const Products = () => {
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="greenpac-card group"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="relative overflow-hidden aspect-[4/3]">
                <img
                  src={product.image}
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
                <Button variant="ghost" className="group/btn p-0 h-auto text-primary hover:bg-transparent">
                  Más información
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="default" size="lg" asChild>
            <a href="#contacto">
              Solicitar Catálogo Completo
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Products;
