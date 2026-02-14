import { useState, ReactNode, useRef } from "react";
import { Pencil, Save, X, Upload, Loader2 } from "lucide-react";
import { useEditMode } from "@/hooks/useEditMode";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface EditableField {
  key: string;
  label: string;
  type: "text" | "textarea" | "link" | "image";
  fallback: string;
  assetKey?: string; // for image type
}

interface EditableSectionProps {
  sectionId: string;
  fields: EditableField[];
  children: ReactNode;
}

const EditableSection = ({ sectionId, fields, children }: EditableSectionProps) => {
  const { isEditMode } = useEditMode();
  const { getText, getAsset, updateText, updateAsset } = useSiteContent();
  const [isOpen, setIsOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fileValues, setFileValues] = useState<Record<string, File | null>>({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!isEditMode) return <>{children}</>;

  const handleOpen = () => {
    const vals: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.type === "image") {
        vals[f.key] = getAsset(f.assetKey || f.key, f.fallback).alt;
      } else {
        vals[f.key] = getText(f.key, f.fallback);
      }
    });
    setFormValues(vals);
    setFileValues({});
    setIsOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const field of fields) {
        if (field.type === "image") {
          const file = fileValues[field.key];
          if (file) {
            await updateAsset.mutateAsync({
              sectionKey: field.assetKey || field.key,
              file,
              altText: formValues[field.key] || "",
            });
          }
        } else {
          const val = formValues[field.key];
          if (val !== undefined) {
            await updateText.mutateAsync({
              key: field.key,
              value: val,
              contentType: field.type === "link" ? "link" : "text",
            });
          }
        }
      }
      setIsOpen(false);
    } catch {
      // error handled by mutations
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative group/editable">
      {children}
      {/* Edit overlay */}
      <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-transparent group-hover/editable:border-primary/40 rounded-lg transition-colors z-[5]" />
      <Button
        size="sm"
        variant="secondary"
        className="absolute top-2 right-2 z-10 opacity-0 group-hover/editable:opacity-100 transition-opacity shadow-lg gap-1.5 h-8 text-xs"
        onClick={handleOpen}
      >
        <Pencil className="h-3 w-3" />
        Editar
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar sección: {sectionId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === "image" ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Texto alternativo (alt)"
                      value={formValues[field.key] || ""}
                      onChange={(e) =>
                        setFormValues((v) => ({ ...v, [field.key]: e.target.value }))
                      }
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => fileInputRefs.current[field.key]?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {fileValues[field.key] ? fileValues[field.key]!.name : "Subir imagen"}
                      </Button>
                      <input
                        ref={(el) => { fileInputRefs.current[field.key] = el; }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setFileValues((v) => ({ ...v, [field.key]: file }));
                        }}
                      />
                    </div>
                  </div>
                ) : field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    value={formValues[field.key] || ""}
                    onChange={(e) =>
                      setFormValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                    rows={3}
                    maxLength={2000}
                  />
                ) : (
                  <Input
                    id={field.key}
                    value={formValues[field.key] || ""}
                    onChange={(e) =>
                      setFormValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                    maxLength={500}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditableSection;
