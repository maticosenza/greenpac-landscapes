import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteContent } from "@/hooks/useSiteContent";
import EditableSection from "@/components/EditableSection";
import heroImageDefault from "@/assets/hero-banner-greenpac-v5.jpg";

const Hero = () => {
  const { getText, getAsset } = useSiteContent();

  const heroAsset = getAsset("hero-banner", heroImageDefault, "Campo argentino con silobolsas");
  const h1Line1 = getText("hero-h1-line1", "Construimos el");
  const h1Highlight = getText("hero-h1-highlight", "Futuro del");
  const h1Line3 = getText("hero-h1-line3", "Campo Argentino");
  const ctaProducts = getText("hero-cta-products", "Ver Productos");
  const ctaQuote = getText("hero-cta-quote", "Solicitar Cotización");

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex flex-col overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <EditableSection
          sectionId="Hero Banner"
          fields={[
            { key: "hero-banner", label: "Imagen de fondo", type: "image", fallback: heroImageDefault, assetKey: "hero-banner" },
          ]}
        >
          <img
            src={heroAsset.url}
            alt={heroAsset.alt}
            className="w-full h-full object-cover max-[480px]:object-[50%_70%] object-center lg:object-[50%_65%]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </EditableSection>
        <div className="absolute inset-0 bg-gradient-to-b from-greenpac-dark/30 via-transparent to-greenpac-dark/40" />
      </div>

      {/* Top Content - Title */}
      <div className="relative z-10 greenpac-container text-center pt-[calc(108px+env(safe-area-inset-top,0px))] sm:pt-36 lg:pt-32 xl:pt-28">
        <EditableSection
          sectionId="Hero Textos"
          fields={[
            { key: "hero-h1-line1", label: "H1 línea 1", type: "text", fallback: "Construimos el" },
            { key: "hero-h1-highlight", label: "H1 destacado", type: "text", fallback: "Futuro del" },
            { key: "hero-h1-line3", label: "H1 línea 3", type: "text", fallback: "Campo Argentino" },
            { key: "hero-cta-products", label: "Botón productos", type: "text", fallback: "Ver Productos" },
            { key: "hero-cta-quote", label: "Botón cotización", type: "text", fallback: "Solicitar Cotización" },
          ]}
        >
          <div className="animate-slide-up">
            <p className="hidden md:block text-primary font-display font-semibold text-lg md:text-xl mb-2 tracking-widest uppercase">
              Maquinaria Agrícola de Calidad
            </p>
            <h1 className="text-primary-foreground mb-6 mx-auto leading-[1.06] max-[480px]:text-[clamp(32px,7vw,40px)] max-[480px]:max-w-[18ch] max-[480px]:[text-wrap:balance] greenpac-title max-w-4xl">
              <span className="md:hidden">
                {h1Line1}<br />
                <span className="greenpac-gradient-text">{h1Highlight}</span><br />
                {h1Line3}
              </span>
              <span className="hidden md:inline">
                {h1Line1}{" "}
                <span className="greenpac-gradient-text">{h1Highlight.replace("del", "el Futuro").includes("Futuro") ? "el Futuro" : h1Highlight}</span>
                <br />
                del {h1Line3}
              </span>
            </h1>
          </div>
        </EditableSection>
      </div>

      {/* Bottom Content - Buttons */}
      <div className="relative z-10 mt-auto mb-32 md:mb-40">
        <div className="greenpac-container">
          <div className="flex flex-col-reverse sm:flex-row gap-4 justify-center animate-slide-up">
            <Button variant="hero" size="lg" asChild>
              <a href="#productos">{ctaProducts}</a>
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <a href="#cotizacion">{ctaQuote}</a>
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
