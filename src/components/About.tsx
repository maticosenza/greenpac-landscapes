import { CheckCircle, Users, Globe, Award, LucideIcon } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useEditMode } from "@/hooks/useEditMode";
import EditableSection from "@/components/EditableSection";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface StatItem {
  icon: string;
  value: string;
  label: string;
}

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  globe: Globe,
  award: Award,
};

const defaultStats: StatItem[] = [
  { icon: "users", value: "500+", label: "Clientes Satisfechos" },
  { icon: "globe", value: "10+", label: "Países Proveedores" },
  { icon: "award", value: "15+", label: "Años de Experiencia" },
];

const defaultFeatures = [
  "Importación directa de fábrica",
  "Servicio técnico especializado",
  "Repuestos originales garantizados",
  "Asesoramiento personalizado",
  "Financiación a medida",
  "Soporte post-venta continuo",
];

const StatsEditor = ({ stats, onSave }: { stats: StatItem[]; onSave: (items: StatItem[]) => Promise<void> }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<StatItem[]>(stats);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpen = () => {
    setItems([...stats]);
    setIsOpen(true);
  };

  const updateItem = (index: number, field: keyof StatItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(items);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        className="absolute top-2 right-2 z-10 opacity-0 group-hover/stats:opacity-100 transition-opacity shadow-lg gap-1.5 h-8 text-xs"
        onClick={handleOpen}
      >
        <Pencil className="h-3 w-3" />
        Editar Stats
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar estadísticas</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {items.map((item, index) => (
              <div key={index} className="space-y-2 p-3 rounded-lg border border-border/50 bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground">Estadística {index + 1}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Valor</Label>
                    <Input value={item.value} onChange={(e) => updateItem(index, "value", e.target.value)} placeholder="500+" maxLength={20} />
                  </div>
                  <div>
                    <Label>Ícono</Label>
                    <Input value={item.icon} onChange={(e) => updateItem(index, "icon", e.target.value)} placeholder="users / globe / award" maxLength={20} />
                  </div>
                </div>
                <div>
                  <Label>Label</Label>
                  <Input value={item.label} onChange={(e) => updateItem(index, "label", e.target.value)} placeholder="Clientes Satisfechos" maxLength={60} />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const About = () => {
  const { getText, updateText } = useSiteContent();
  const { isEditMode } = useEditMode();

  const title = getText("about-title", "Tu Socio en el");
  const titleHighlight = getText("about-title-highlight", "Agro");
  const paragraph1 = getText("about-paragraph1", "En Greenpac nos especializamos en la importación de maquinaria agrícola de alta calidad para la conservación de forrajes. Trabajamos con los mejores fabricantes internacionales para traer al campo argentino tecnología de vanguardia.");
  const paragraph2 = getText("about-paragraph2", "Nuestro compromiso es brindar soluciones integrales que optimicen la productividad de tu establecimiento, con el respaldo técnico y la confiabilidad que merecés.");

  // Stats from DB or defaults
  const statsRaw = getText("about-stats", "");
  let stats: StatItem[] = defaultStats;
  try {
    if (statsRaw) {
      const parsed = JSON.parse(statsRaw);
      if (Array.isArray(parsed) && parsed.length > 0) stats = parsed;
    }
  } catch { /* use defaults */ }

  const handleSaveStats = async (items: StatItem[]) => {
    await updateText.mutateAsync({
      key: "about-stats",
      value: JSON.stringify(items),
      contentType: "json",
    });
  };

  return (
    <section id="nosotros" className="greenpac-section bg-background">
      <div className="greenpac-container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <EditableSection
            sectionId="Nosotros"
            fields={[
              { key: "about-title", label: "Título (parte 1)", type: "text", fallback: "Tu Socio en el" },
              { key: "about-title-highlight", label: "Título (destacado)", type: "text", fallback: "Agro" },
              { key: "about-paragraph1", label: "Párrafo 1", type: "textarea", fallback: paragraph1 },
              { key: "about-paragraph2", label: "Párrafo 2", type: "textarea", fallback: paragraph2 },
            ]}
          >
            <div>
              <p className="text-primary font-display font-semibold mb-3 tracking-widest uppercase">
                Sobre Nosotros
              </p>
              <h2 className="greenpac-title text-foreground mb-6">
                {title}{" "}
                <span className="greenpac-gradient-text">{titleHighlight}</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {paragraph1}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                {paragraph2}
              </p>

              <ul className="grid sm:grid-cols-2 gap-3 mb-10">
                {defaultFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </EditableSection>

          {/* Stats */}
          <div className={`relative grid gap-6 ${isEditMode ? "group/stats" : ""}`}>
            {isEditMode && (
              <>
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-transparent group-hover/stats:border-primary/40 rounded-lg transition-colors z-[5]" />
                <StatsEditor stats={stats} onSave={handleSaveStats} />
              </>
            )}
            {stats.map((stat, index) => {
              const IconComp = iconMap[stat.icon] || Users;
              return (
                <div
                  key={`stat-${index}`}
                  className="flex items-center gap-6 p-6 rounded-2xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors duration-300"
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <IconComp className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-4xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
