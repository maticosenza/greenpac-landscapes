import { useState } from "react";
import { ChevronDown, Pencil, Upload, Save, X, Loader2, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useEditMode } from "@/hooks/useEditMode";
import EditableSection from "@/components/EditableSection";
import DraggableHeroBlock from "@/components/DraggableHeroBlock";
import HeroAlignmentToggle from "@/components/HeroAlignmentToggle";
import heroImageDefault from "@/assets/hero-banner-greenpac-v5.jpg";

const HeroBannerEditor = ({ onSaved }: { onSaved?: () => void }) => {
  const { updateAsset } = useSiteContent();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (f: File | null) => {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      await updateAsset.mutateAsync({
        sectionKey: "hero-banner",
        file,
        altText,
      });
      setIsOpen(false);
      setFile(null);
      setPreview(null);
      onSaved?.();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        className="absolute top-32 right-4 z-[15] shadow-lg gap-1.5 h-9 text-xs"
        onClick={() => setIsOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar Banner
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar sección: Hero Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Texto alternativo (alt)</Label>
              <Input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Campo argentino con silobolsas"
              />
            </div>
            <div className="space-y-2">
              <Label>Imagen de fondo</Label>
              <p className="text-xs text-muted-foreground">
                Recomendado: 1920×1080 px (JPG/WEBP). Mantener el sujeto centrado porque la imagen se recorta en distintas pantallas.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => document.getElementById("hero-banner-upload")?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {file ? file.name : "Subir imagen"}
                </Button>
                <input
                  id="hero-banner-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
              </div>
              {preview && (
                <img src={preview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg border border-border/50 mt-2" />
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !file}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Hero = () => {
  const { getText, getAsset } = useSiteContent();
  const { isEditMode } = useEditMode();

  const heroAsset = getAsset("hero-banner", heroImageDefault, "Campo argentino con silobolsas");
  const kicker = getText("hero-kicker", "Maquinaria de alto rendimiento");
  const h1Text = getText("hero-title", "Tecnología y potencia para el campo argentino");
  const subtitleLine1 = getText("hero-subtitle-line1", "Equipos listos para trabajar, con asesoramiento experto.");
  const subtitleLine2 = getText("hero-subtitle-line2", "Cotizá en minutos y coordinamos entrega a todo el país.");
  const ctaQuote = getText("hero-cta-primary", "Solicitar Cotización");
  const ctaProducts = getText("hero-cta-secondary", "Ver Productos");

  const h1Align = getText("hero-h1-align", "left");
  const subAlign = getText("hero-sub-align", "left");

  const alignClass = (align: string) =>
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  const itemsClass = (align: string) =>
    align === "center" ? "items-center" : align === "right" ? "items-end" : "items-start";

  const justifyClass = (align: string) =>
    align === "center" ? "sm:justify-center" : align === "right" ? "sm:justify-end" : "sm:justify-start";

  return (
    <section
      id="inicio"
      className="relative overflow-hidden"
      style={{ minHeight: "100svh" }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroAsset.url}
          alt={heroAsset.alt}
          className="w-full h-full object-cover max-[480px]:object-[50%_70%] object-center lg:object-[50%_65%]"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-greenpac-dark/60 via-greenpac-dark/25 to-greenpac-dark/50" />
      </div>

      {/* Banner edit */}
      {isEditMode && <HeroBannerEditor />}

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end sm:justify-center greenpac-container" style={{ minHeight: "100svh" }}>
        <div className="max-w-[560px] md:max-w-[640px] lg:max-w-[760px] xl:max-w-[860px] pt-24 sm:pt-32 pb-32 sm:pb-20 lg:pb-24">
            <EditableSection
              sectionId="Hero Textos"
              fields={[
                { key: "hero-kicker", label: "Kicker (subtítulo superior)", type: "text", fallback: "Maquinaria de alto rendimiento" },
                { key: "hero-title", label: "Título H1", type: "text", fallback: "Tecnología y potencia para el campo argentino" },
                { key: "hero-subtitle-line1", label: "Subtítulo — Línea 1", type: "text", fallback: "Equipos listos para trabajar, con asesoramiento experto." },
                { key: "hero-subtitle-line2", label: "Subtítulo — Línea 2", type: "text", fallback: "Cotizá en minutos y coordinamos entrega a todo el país." },
                { key: "hero-cta-primary", label: "Botón primario", type: "text", fallback: "Solicitar Cotización" },
                { key: "hero-cta-secondary", label: "Botón secundario", type: "text", fallback: "Ver Productos" },
              ]}
            >
              <div className={`animate-slide-up space-y-4 sm:space-y-5 lg:space-y-7 xl:space-y-8 flex flex-col ${itemsClass(h1Align)}`}>
                {/* Kicker with leaf icon */}
                <div className="flex items-center gap-2.5">
                  <Leaf className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
                  <p className="text-primary font-semibold text-[clamp(0.95rem,1.1vw,1.1rem)] md:text-[0.85rem] lg:text-[0.85rem] tracking-[0.2em] uppercase">
                    {kicker}
                  </p>
                </div>

                {/* H1 with alignment toggle */}
                <div className="w-full relative">
                  {isEditMode && (
                    <div className="absolute -top-8 left-0 z-20">
                      <HeroAlignmentToggle alignKey="hero-h1-align" defaultAlign="left" />
                    </div>
                  )}
                  <h1 className={`text-primary-foreground font-extrabold leading-[1.05] tracking-tight text-[clamp(2.35rem,4.6vw,5.1rem)] md:text-[3rem] lg:text-[clamp(2.35rem,4.6vw,5.1rem)] ${alignClass(h1Align)}`}>
                    Tecnología y<br />potencia para el<br />campo argentino
                  </h1>
                </div>

                {/* Subtitle with alignment toggle */}
                <div className="w-full relative">
                  {isEditMode && (
                    <div className="absolute -top-8 left-0 z-20">
                      <HeroAlignmentToggle alignKey="hero-sub-align" defaultAlign="left" />
                    </div>
                  )}
                  <p className={`text-primary-foreground/85 text-[clamp(1.02rem,1.5vw,1.55rem)] max-w-[52ch] leading-relaxed ${alignClass(subAlign)}`}>
                    {subtitleLine1}
                    {subtitleLine2 ? (
                      <>
                        <span className="inline lg:hidden"> </span>
                        <br className="hidden lg:block" />
                        {subtitleLine2}
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            </EditableSection>

            {/* CTAs */}
            <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-5 mt-7 sm:mt-8 lg:mt-10 animate-slide-up ${justifyClass(h1Align)}`}>
              <Button variant="heroOutline" size="lg" className="w-full sm:w-auto h-[54px] sm:h-[50px] lg:h-[54px] text-base lg:text-lg sm:px-10 lg:px-12" asChild>
                <a href="#cotizacion">{ctaQuote}</a>
              </Button>
              <Button variant="hero" size="lg" className="w-full sm:w-auto h-[54px] sm:h-[50px] lg:h-[54px] text-base lg:text-lg sm:px-10 lg:px-12" asChild>
                <a href="#productos">{ctaProducts}</a>
              </Button>
            </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#productos"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary-foreground/60 hover:text-primary transition-colors animate-float z-10"
      >
        <ChevronDown className="h-10 w-10" />
      </a>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
