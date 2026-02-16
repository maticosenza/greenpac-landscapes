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
      className="relative overflow-hidden"
      style={{ minHeight: "100svh" }}
    >
      {/* Background Image — full bleed cover */}
      <div className="absolute inset-0">
        <img
          src={heroAsset.url}
          alt={heroAsset.alt}
          className="w-full h-full object-cover max-[480px]:object-[50%_70%] object-center lg:object-[50%_65%]"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        {/* Stronger gradient at top for header readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-greenpac-dark/50 via-greenpac-dark/15 to-greenpac-dark/45" />
      </div>

      {/* Banner edit — floating button, always clickable */}
      {isEditMode && <HeroBannerEditor />}

      {/* Content container — flex layout, no absolute positioning */}
      <div className="relative z-10 flex flex-col justify-center pt-24 sm:pt-28 pb-24 sm:pb-16 px-4 sm:px-6" style={{ minHeight: "100svh" }}>
        <div className="max-w-6xl mx-auto w-full">
          <div className="max-w-3xl">
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
                <h1 className="text-primary-foreground mb-8 leading-[1.06] text-[clamp(32px,7vw,40px)] sm:text-5xl md:text-6xl lg:text-7xl [text-wrap:balance] greenpac-title">
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

            {/* CTAs — full width on mobile, inline on desktop */}
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
              <Button variant="heroOutline" size="lg" className="w-full sm:w-auto" asChild>
                <a href="#cotizacion">{ctaQuote}</a>
              </Button>
              <Button variant="hero" size="lg" className="w-full sm:w-auto" asChild>
                <a href="#productos">{ctaProducts}</a>
              </Button>
            </div>
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

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
