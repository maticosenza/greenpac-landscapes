import { useState } from "react";
import { ChevronDown, Pencil, Upload, Save, X, Loader2, Leaf, Smartphone, SmartphoneNfc } from "lucide-react";
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
import heroImageDefault from "@/assets/hero-banner-greenpac-v6.jpg";
import heroMobileDefault from "@/assets/hero-banner-mobile-v2.jpg";

const HeroBannerEditor = ({ onSaved }: { onSaved?: () => void }) => {
  const { updateAsset } = useSiteContent();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);

  const handleFileChange = (f: File | null, mobile = false) => {
    if (mobile) {
      setMobileFile(f);
      setMobilePreview(f ? URL.createObjectURL(f) : null);
    } else {
      setFile(f);
      setPreview(f ? URL.createObjectURL(f) : null);
    }
  };

  const handleSave = async () => {
    if (!file && !mobileFile) return;
    setIsSaving(true);
    try {
      if (file) {
        await updateAsset.mutateAsync({ sectionKey: "hero-banner", file, altText });
      }
      if (mobileFile) {
        await updateAsset.mutateAsync({ sectionKey: "hero-banner-mobile", file: mobileFile, altText: altText || "Hero móvil" });
      }
      setIsOpen(false);
      setFile(null);
      setMobileFile(null);
      setPreview(null);
      setMobilePreview(null);
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar sección: Hero Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label>Texto alternativo (alt)</Label>
              <Input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Campo argentino con silobolsas"
              />
            </div>

            {/* Desktop banner */}
            <div className="space-y-2">
              <Label>🖥️ Banner Desktop</Label>
              <p className="text-xs text-muted-foreground">
                Recomendado: 1920×1080 px (JPG/WEBP).
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
                <img src={preview} alt="Preview desktop" className="w-full max-h-36 object-cover rounded-lg border border-border/50 mt-2" />
              )}
            </div>

            {/* Mobile banner */}
            <div className="space-y-2">
              <Label>📱 Banner Móvil</Label>
              <p className="text-xs text-muted-foreground">
                Recomendado: 1080×1920 px (JPG/WEBP). Formato vertical para celulares.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => document.getElementById("hero-banner-mobile-upload")?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {mobileFile ? mobileFile.name : "Subir imagen"}
                </Button>
                <input
                  id="hero-banner-mobile-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, true)}
                />
              </div>
              {mobilePreview && (
                <img src={mobilePreview} alt="Preview móvil" className="w-32 max-h-48 object-cover rounded-lg border border-border/50 mt-2" />
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || (!file && !mobileFile)}>
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
  const { getText, getAsset, updateText } = useSiteContent();
  const { isEditMode } = useEditMode();

  const heroAsset = getAsset("hero-banner", heroImageDefault, "Campo argentino con silobolsas");
  const heroMobileAsset = getAsset("hero-banner-mobile", heroMobileDefault, "Hero móvil");
  const kicker = getText("hero-kicker", "Maquinaria de alto rendimiento");
  const h1Text = getText("hero-title", "Tecnología y potencia para el campo argentino");
  const subtitleLine1 = getText("hero-subtitle-line1", "Equipos listos para trabajar, con asesoramiento experto.");
  const subtitleLine2 = getText("hero-subtitle-line2", "Cotizá en minutos y coordinamos entrega a todo el país.");
  const ctaQuote = getText("hero-cta-primary", "Solicitar Cotización");
  const ctaProducts = getText("hero-cta-secondary", "Ver Productos");
  const hideCtaMobile = getText("hero-cta-hide-mobile", "false") === "true";

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
        {/* Mobile image */}
        <img
          src={heroMobileAsset.url}
          alt={heroMobileAsset.alt}
          className="w-full h-full object-cover sm:hidden"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        {/* Desktop image */}
        <img
          src={heroAsset.url}
          alt={heroAsset.alt}
          className="w-full h-full object-cover object-center lg:object-[50%_65%] hidden sm:block"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-greenpac-dark/60 via-greenpac-dark/25 to-greenpac-dark/50" />
      </div>

      {/* Banner edit */}
      {isEditMode && <HeroBannerEditor />}

      {/* Content — mobile: centered-high, sm+: centered */}
      <div className="relative z-10 flex flex-col justify-start sm:justify-center greenpac-container" style={{ minHeight: "100svh" }}>
        <div className="max-w-[560px] md:max-w-[640px] lg:max-w-[760px] xl:max-w-[860px] pt-[clamp(9rem,32vw,13rem)] sm:pt-32 pb-10 sm:pb-20 lg:pb-24 sm:mt-0">
          {/* Single unified block: text + CTAs always together */}
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
            <div className={`animate-slide-up flex flex-col ${itemsClass(h1Align)} space-y-[clamp(0.75rem,2.5vw,1rem)] sm:space-y-5 lg:space-y-7`}>
              {/* Kicker with leaf icon */}
              <div className="flex items-center gap-2 sm:gap-2.5 w-fit">
                <Leaf className="h-[clamp(1rem,4vw,1.25rem)] w-[clamp(1rem,4vw,1.25rem)] sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary shrink-0" />
                <p className="text-primary font-semibold text-[clamp(0.6rem,2.2vw,0.75rem)] sm:text-[clamp(0.85rem,1.1vw,1rem)] tracking-[0.2em] uppercase">
                  {kicker}
                </p>
              </div>

              {/* H1 */}
              <div className="w-full relative">
                {isEditMode && (
                  <div className="absolute -top-8 left-0 z-20">
                    <HeroAlignmentToggle alignKey="hero-h1-align" defaultAlign="left" />
                  </div>
                )}
                <h1 className={`text-primary-foreground font-extrabold leading-[1.05] tracking-tight text-[clamp(2.1rem,7.5vw,2.8rem)] sm:text-[3.2rem] md:text-[3.8rem] lg:text-[clamp(3rem,4.6vw,5.1rem)] ${alignClass(h1Align)}`}>
                  <span className="hidden sm:inline">Tecnología y<br />potencia para el<br />campo argentino</span>
                  <span className="sm:hidden">Tecnología y<br />potencia para el<br />campo argentino</span>
                </h1>
              </div>

              {/* Subtitle */}
              <div className="w-full relative">
                {isEditMode && (
                  <div className="absolute -top-8 left-0 z-20">
                    <HeroAlignmentToggle alignKey="hero-sub-align" defaultAlign="left" />
                  </div>
                )}
                <p className={`text-primary-foreground/85 text-[clamp(0.85rem,3.2vw,1.05rem)] sm:text-[clamp(0.95rem,1.4vw,1.45rem)] max-w-[52ch] leading-relaxed ${alignClass(subAlign)}`}>
                  <span className="hidden sm:inline">
                    {subtitleLine1}
                    {subtitleLine2 ? (
                      <>
                        <br />
                        {subtitleLine2}
                      </>
                    ) : null}
                  </span>
                  <span className="sm:hidden">
                    Equipos listos para trabajar, asesoramiento experto. Cotizaciones en minutos.
                  </span>
                </p>
              </div>

              {/* CTA buttons — always immediately below text */}
              <div className="relative w-full">
                {isEditMode && (
                  <Button
                    type="button"
                    size="sm"
                    variant={hideCtaMobile ? "destructive" : "secondary"}
                    className="absolute -top-8 left-0 z-20 gap-1.5 h-7 text-[10px] px-2 shadow-md"
                    onClick={() => {
                      updateText.mutate({ key: "hero-cta-hide-mobile", value: hideCtaMobile ? "false" : "true" });
                    }}
                  >
                    {hideCtaMobile ? (
                      <><Smartphone className="h-3 w-3" />Botones ocultos en móvil</>
                    ) : (
                      <><SmartphoneNfc className="h-3 w-3" />Botones visibles en móvil</>
                    )}
                  </Button>
                )}
                <div className={`hidden sm:flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-5 pt-2 sm:pt-3 w-full ${justifyClass(h1Align)}`}>
                  <Button variant="heroOutline" size="lg" className="w-full sm:w-auto h-[54px] sm:h-[50px] lg:h-[54px] text-base lg:text-lg sm:px-10 lg:px-12" asChild>
                    <a href="#cotizacion">{ctaQuote}</a>
                  </Button>
                  <Button variant="hero" size="lg" className="w-full sm:w-auto h-[54px] sm:h-[50px] lg:h-[54px] text-base lg:text-lg sm:px-10 lg:px-12" asChild>
                    <a href="#productos">{ctaProducts}</a>
                  </Button>
                </div>
              </div>
            </div>
          </EditableSection>
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
