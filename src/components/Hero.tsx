import { useState } from "react";
import { ChevronDown, Pencil, Upload, Save, X, Loader2 } from "lucide-react";
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
        className="absolute top-20 right-4 z-[15] shadow-lg gap-1.5 h-9 text-xs"
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
  const kicker = getText("hero-kicker", "Maquinaria Agrícola de Calidad");
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
      {/* Background Image — single source of truth */}
      <div className="absolute inset-0">
        <img
          src={heroAsset.url}
          alt={heroAsset.alt}
          className="w-full h-full object-cover max-[480px]:object-[50%_70%] object-center lg:object-[50%_65%]"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-greenpac-dark/30 via-transparent to-greenpac-dark/40" />
      </div>

      {/* Banner edit — floating button, always clickable */}
      {isEditMode && <HeroBannerEditor />}

      {/* Top Content - Title */}
      <div className="relative z-10 greenpac-container text-center pt-[calc(108px+env(safe-area-inset-top,0px))] sm:pt-36 lg:pt-32 xl:pt-28">
        <EditableSection
          sectionId="Hero Textos"
          fields={[
            { key: "hero-kicker", label: "Kicker (subtítulo superior)", type: "text", fallback: "Maquinaria Agrícola de Calidad" },
            { key: "hero-h1-line1", label: "H1 línea 1", type: "text", fallback: "Construimos el" },
            { key: "hero-h1-highlight", label: "H1 destacado", type: "text", fallback: "Futuro del" },
            { key: "hero-h1-line3", label: "H1 línea 3", type: "text", fallback: "Campo Argentino" },
            { key: "hero-cta-products", label: "Botón productos", type: "text", fallback: "Ver Productos" },
            { key: "hero-cta-quote", label: "Botón cotización", type: "text", fallback: "Solicitar Cotización" },
          ]}
        >
          <div className="animate-slide-up">
            <p className="hidden md:block text-primary font-display font-semibold text-lg md:text-xl mb-2 tracking-widest uppercase">
              {kicker}
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
