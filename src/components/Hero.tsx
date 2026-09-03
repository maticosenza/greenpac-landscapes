import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import HeroAlignmentToggle from "@/components/HeroAlignmentToggle";
import { useAuth } from "@/hooks/useAuth";
const heroImageDefault = "/__l5e/assets-v1/51c50412-94a8-41da-a3ef-11e4a58c0fed/greenpac-hero-desktop-final.png";
const heroMobileDefault = "/__l5e/assets-v1/4aaeb193-33bf-4bd4-8582-6b61c64fad72/greenpac-hero-mobile-final.png";

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleVerRepuestos = useCallback(() => {
    if (user) {
      navigate("/panel?tab=tienda-repuestos");
    } else {
      navigate("/auth?redirect=tienda-repuestos");
    }
  }, [user, navigate]);

  const heroAsset = getAsset("hero-banner", heroImageDefault, "Campo argentino con silobolsas");
  const heroMobileAsset = getAsset("hero-banner-mobile", heroMobileDefault, "Hero móvil");
  const kicker = getText("hero-kicker", "Maquinaria de alto rendimiento");
  const h1Text = getText("hero-title", "Tecnología y potencia para el campo argentino");
  const subtitleLine1 = getText("hero-subtitle-line1", "Equipos listos para trabajar, con asesoramiento experto.");
  const ctaQuote = getText("hero-cta-primary", "Solicitar Cotización");
  const ctaProducts = getText("hero-cta-secondary", "Ver Maquinaria");
  

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
          className="w-full h-full object-cover object-[50%_54%] sm:hidden"
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

      {/* Content — mobile: top, sm+: left column */}
      <div className="relative z-10 flex flex-col justify-start greenpac-container pb-20 sm:pb-20 lg:pb-24 pt-[180px] sm:pt-32 lg:pt-40" style={{ minHeight: "100svh" }}>
        <div className="w-full max-w-[380px] sm:max-w-[480px] lg:max-w-[760px]">
          <EditableSection
            sectionId="Hero Textos"
            fields={[
              { key: "hero-kicker", label: "Kicker (subtítulo superior)", type: "text", fallback: "Maquinaria de alto rendimiento" },
              { key: "hero-title", label: "Título H1", type: "text", fallback: "Tecnología y potencia para el campo argentino" },
              { key: "hero-subtitle-line1", label: "Subtítulo", type: "text", fallback: "Equipos listos para trabajar, con asesoramiento experto." },
              { key: "hero-cta-primary", label: "Botón primario", type: "text", fallback: "Solicitar Cotización" },
              { key: "hero-cta-secondary", label: "Botón secundario", type: "text", fallback: "Ver Maquinaria" },
            ]}
          >
            <div className={`animate-slide-up flex flex-col items-start sm:${itemsClass(h1Align)} space-y-2.5 sm:space-y-4 lg:space-y-5`}>
              {/* Kicker with leaf icon */}
              <div className="flex items-center gap-2 sm:gap-2.5 w-fit">
                <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <p className="text-primary font-semibold text-[11px] sm:text-[clamp(0.8rem,1.1vw,0.95rem)] tracking-[0.18em] sm:tracking-[0.22em] uppercase whitespace-nowrap">
                  {kicker}
                </p>
              </div>

              {/* H1 — editable, constrained to left column */}
              <div className="w-full relative">
                {isEditMode && (
                  <div className="absolute -top-8 left-0 z-20">
                    <HeroAlignmentToggle alignKey="hero-h1-align" defaultAlign="left" />
                  </div>
                )}
                <h1 className={`text-primary-foreground font-extrabold leading-[1.05] tracking-tight text-[44px] max-w-[360px] sm:text-[clamp(3rem,6vw,3.5rem)] sm:leading-[1.05] sm:max-w-[460px] lg:text-[clamp(4rem,5.2vw,4.5rem)] lg:leading-[1.04] lg:max-w-[9.7em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] sm:drop-shadow-none text-left sm:${alignClass(h1Align)}`}>
                  {h1Text}
                </h1>
              </div>

              {/* Subtitle — short on mobile, compact on desktop */}
              <div className="w-full relative">
                {isEditMode && (
                  <div className="absolute -top-8 left-0 z-20">
                    <HeroAlignmentToggle alignKey="hero-sub-align" defaultAlign="left" />
                  </div>
                )}
                <p className={`text-primary-foreground/85 text-[16px] sm:text-[clamp(0.95rem,1.2vw,1.15rem)] max-w-[52ch] leading-snug sm:leading-relaxed text-left sm:${alignClass(subAlign)}`}>
                  {subtitleLine1}
                </p>
              </div>

              {/* CTAs */}
              <div className="w-full pt-1.5 sm:pt-2">
                {/* Mobile CTAs */}
                <div className="flex sm:hidden flex-col items-stretch gap-2.5 w-full">
                  <a
                    href="#cotizacion"
                    className="flex items-center justify-center h-[44px] rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold text-[15px] shadow-lg transition-all duration-300"
                  >
                    {ctaQuote}
                  </a>
                  <div className="flex gap-2.5 w-full">
                    <a
                      href="#productos"
                      className="flex-1 flex items-center justify-center h-[42px] rounded-lg border-2 border-white/80 text-white bg-transparent hover:bg-white/10 font-display font-semibold text-[14px] transition-all duration-300"
                    >
                      Maquinaria
                    </a>
                    <button
                      onClick={handleVerRepuestos}
                      className="flex-1 flex items-center justify-center h-[42px] rounded-lg border-2 border-white/80 text-white bg-transparent hover:bg-white/10 font-display font-semibold text-[14px] transition-all duration-300"
                    >
                      Repuestos
                    </button>
                  </div>
                </div>

                {/* Tablet CTAs — portrait: quote full row + two below; landscape: one row of three */}
                <div className="hidden sm:grid lg:hidden grid-cols-2 landscape:grid-cols-3 gap-3 w-full">
                  <Button variant="hero" size="lg" className="col-span-2 landscape:col-span-1 h-[48px] landscape:h-[44px] text-base landscape:text-sm w-full" asChild>
                    <a href="#cotizacion">{ctaQuote}</a>
                  </Button>
                  <Button variant="heroOutline" size="lg" className="h-[46px] landscape:h-[44px] text-base landscape:text-sm w-full" asChild>
                    <a href="#productos">{ctaProducts}</a>
                  </Button>
                  <Button
                    size="lg"
                    className="h-[46px] landscape:h-[44px] text-base landscape:text-sm w-full border-2 border-white/80 text-white bg-transparent hover:bg-white hover:text-foreground font-display font-semibold transition-all duration-300"
                    onClick={handleVerRepuestos}
                  >
                    Ver Repuestos
                  </Button>
                </div>

                {/* Desktop CTAs — one compact row, three buttons */}
                <div className="hidden lg:flex items-center gap-3 w-fit">
                  <Button variant="hero" size="lg" className="h-[46px] text-sm px-6 w-auto whitespace-nowrap" asChild>
                    <a href="#cotizacion">{ctaQuote}</a>
                  </Button>
                  <Button variant="heroOutline" size="lg" className="h-[46px] text-sm px-6 w-auto whitespace-nowrap" asChild>
                    <a href="#productos">{ctaProducts}</a>
                  </Button>
                  <Button
                    size="lg"
                    className="h-[46px] text-sm px-6 w-auto whitespace-nowrap border-2 border-white/80 text-white bg-transparent hover:bg-white hover:text-foreground font-display font-semibold transition-all duration-300"
                    onClick={handleVerRepuestos}
                  >
                    Ver Repuestos
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
