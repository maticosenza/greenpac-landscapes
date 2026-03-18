import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { ARGENTINA_PROVINCES } from "@/lib/argentinaProvinces";

export interface ClientRecord {
  id: string;
  full_name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  product_interest: string | null;
  price: number | null;
  province: string | null;
  city: string | null;
  postal_code: string | null;
  address: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  client: ClientRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ClientDetailDialog = ({ client, open, onOpenChange }: Props) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<ClientRecord>>({});

  useEffect(() => {
    if (client) {
      setForm({ ...client });
      setEditing(false);
    }
  }, [client]);

  if (!client) return null;

  const update = (key: string, value: string | number | null) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.full_name?.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("clients" as any)
        .update({
          full_name: form.full_name?.trim(),
          document: form.document?.trim() || null,
          email: form.email?.trim() || null,
          phone: form.phone?.trim() || null,
          product_interest: form.product_interest?.trim() || null,
          price: form.price || null,
          province: form.province || null,
          city: form.city?.trim() || null,
          postal_code: form.postal_code?.trim() || null,
          address: form.address?.trim() || null,
          notes: form.notes?.trim() || null,
        } as any)
        .eq("id", client.id);

      if (error) throw error;

      toast.success("Cliente actualizado");
      queryClient.invalidateQueries({ queryKey: ["crm-clients"] });
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const Field = ({
    label,
    value,
  }: {
    label: string;
    value: string | null | undefined;
  }) => (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle>{editing ? "Editar Cliente" : "Detalle del Cliente"}</DialogTitle>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </DialogHeader>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nombre *</Label>
                <Input
                  value={form.full_name || ""}
                  onChange={(e) => update("full_name", e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Documento</Label>
                <Input
                  value={form.document || ""}
                  onChange={(e) => update("document", e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => update("email", e.target.value)}
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={form.phone || ""}
                  onChange={(e) => update("phone", e.target.value)}
                  maxLength={30}
                />
              </div>
              <div className="space-y-2">
                <Label>Producto de interés</Label>
                <Input
                  value={form.product_interest || ""}
                  onChange={(e) => update("product_interest", e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price ?? ""}
                  onChange={(e) =>
                    update("price", e.target.value ? parseFloat(e.target.value) : null)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Provincia</Label>
                <Select
                  value={form.province || ""}
                  onValueChange={(v) => update("province", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ARGENTINA_PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Localidad</Label>
                <Input
                  value={form.city || ""}
                  onChange={(e) => update("city", e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Código Postal</Label>
                <Input
                  value={form.postal_code || ""}
                  onChange={(e) => update("postal_code", e.target.value)}
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label>Domicilio</Label>
                <Input
                  value={form.address || ""}
                  onChange={(e) => update("address", e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={form.notes || ""}
                onChange={(e) => update("notes", e.target.value)}
                maxLength={1000}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setForm({ ...client });
                  setEditing(false);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre" value={form.full_name} />
              <Field label="Documento" value={form.document} />
              <Field label="Email" value={form.email} />
              <Field label="Teléfono" value={form.phone} />
              <Field label="Producto de interés" value={form.product_interest} />
              <Field
                label="Precio"
                value={
                  form.price != null
                    ? `$${Number(form.price).toLocaleString("es-AR")}`
                    : null
                }
              />
              <Field label="Provincia" value={form.province} />
              <Field label="Localidad" value={form.city} />
              <Field label="Código Postal" value={form.postal_code} />
              <Field label="Domicilio" value={form.address} />
            </div>
            {form.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notas</p>
                <p className="text-sm whitespace-pre-wrap">{form.notes}</p>
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
              <p>Creado: {new Date(client.created_at).toLocaleDateString("es-AR")}</p>
              <p>Última actualización: {new Date(client.updated_at).toLocaleDateString("es-AR")}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailDialog;
