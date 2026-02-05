import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-banner-greenpac-v5.jpg";

const Hero = () => {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex flex-col overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Campo argentino con silobolsas"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-greenpac-dark/30 via-transparent to-greenpac-dark/40" />
      </div>

      {/* Top Content - Title */}
      <div className="relative z-10 greenpac-container text-center pt-32 md:pt-40">
        <div className="animate-slide-up">
          <p className="text-primary font-display font-semibold text-lg md:text-xl mb-4 tracking-widest uppercase">
            Maquinaria Agrícola de Calidad
          </p>
          <h1 className="greenpac-title text-primary-foreground mb-6 max-w-4xl mx-auto leading-tight">
            Construimos{" "}
            <span className="greenpac-gradient-text">el Futuro</span>
            <br />
            del Campo Argentino
          </h1>
        </div>
      </div>

      {/* Bottom Content - Buttons */}
      <div className="relative z-10 mt-auto mb-32 md:mb-40">
        <div className="greenpac-container">
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Button variant="hero" size="lg" asChild>
              <a href="#productos">Ver Productos</a>
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <a href="#cotizacion">Solicitar Cotización</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#productos"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary-foreground/60 hover:text-primary transition-colors animate-float"
      >
        <ChevronDown className="h-10 w-10" />
      </a>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
