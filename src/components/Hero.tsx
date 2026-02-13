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
          className="w-full h-full object-cover max-[480px]:object-[50%_70%] object-center lg:object-[50%_65%]"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-greenpac-dark/30 via-transparent to-greenpac-dark/40" />
      </div>

      {/* Top Content - Title */}
      <div className="relative z-10 greenpac-container text-center pt-[calc(108px+env(safe-area-inset-top,0px))] sm:pt-36 lg:pt-32 xl:pt-28">
        <div className="animate-slide-up">
          <p className="hidden md:block text-primary font-display font-semibold text-lg md:text-xl mb-2 tracking-widest uppercase">
            Maquinaria Agrícola de Calidad
          </p>
          <h1 className="text-primary-foreground mb-6 mx-auto leading-[1.06] max-[480px]:text-[clamp(32px,7vw,40px)] max-[480px]:max-w-[18ch] max-[480px]:[text-wrap:balance] greenpac-title max-w-4xl">
            {/* Mobile: 3 líneas */}
            <span className="md:hidden">
              Construimos el<br />
              <span className="greenpac-gradient-text">Futuro del</span><br />
              Campo Argentino
            </span>
            {/* Desktop: 2 líneas */}
            <span className="hidden md:inline">
              Construimos{" "}
              <span className="greenpac-gradient-text">el Futuro</span>
              <br />
              del Campo Argentino
            </span>
          </h1>
        </div>
      </div>

      {/* Bottom Content - Buttons */}
      <div className="relative z-10 mt-auto mb-32 md:mb-40">
        <div className="greenpac-container">
          <div className="flex flex-col-reverse sm:flex-row gap-4 justify-center animate-slide-up">
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
