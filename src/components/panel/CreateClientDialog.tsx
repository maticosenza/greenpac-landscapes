import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { Loader2 } from "lucide-react";
import { ARGENTINA_PROVINCES } from "@/lib/argentinaProvinces";
import { CLIENT_STATUSES } from "./clientConstants";
import LocalityAutocomplete from "./LocalityAutocomplete";
import AddressAutocomplete from "./AddressAutocomplete";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateClientDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    document: "",
    email: "",
    phone: "",
    product_interest: "",
    price: "",
    province: "",
    city: "",
    postal_code: "",
    address: "",
    notes: "",
    status: "activo",
    lat: null as number | null,
    lng: null as number | null,
  });

  const resetForm = () =>
    setForm({
      full_name: "",
      document: "",
      email: "",
      phone: "",
      product_interest: "",
      price: "",
      province: "",
      city: "",
      postal_code: "",
      address: "",
      notes: "",
      status: "activo",
      lat: null,
      lng: null,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("clients" as any).insert({
        full_name: form.full_name.trim(),
        document: form.document.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        product_interest: form.product_interest.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        province: form.province || null,
        city: form.city.trim() || null,
        postal_code: form.postal_code.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
        status: form.status,
        created_by: user.id,
        lat: form.lat,
        lng: form.lng,
      } as any);

      if (error) throw error;

      toast.success("Cliente agregado correctamente");
      queryClient.invalidateQueries({ queryKey: ["crm-clients"] });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Error al agregar el cliente");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleProvinceChange = (v: string) => {
    setForm((prev) => ({ ...prev, province: v, city: "", lat: null, lng: null }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Nombre *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">Documento</Label>
              <Input
                id="document"
                value={form.document}
                onChange={(e) => update("document", e.target.value)}
                maxLength={50}
                placeholder="DNI / CUIT"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_interest">Producto de interés</Label>
              <Input
                id="product_interest"
                value={form.product_interest}
                onChange={(e) => update("product_interest", e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="$"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Select
                value={form.province}
                onValueChange={handleProvinceChange}
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
              <Label htmlFor="city">Localidad</Label>
              <LocalityAutocomplete
                province={form.province}
                value={form.city}
                onChange={(city) => {
                  setForm((prev) => ({ ...prev, city, lat: null, lng: null }));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Código Postal</Label>
              <Input
                id="postal_code"
                value={form.postal_code}
                onChange={(e) => update("postal_code", e.target.value)}
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Domicilio</Label>
              <AddressAutocomplete
                city={form.city}
                province={form.province}
                value={form.address}
                onChange={(address, lat, lng) => {
                  setForm((prev) => ({
                    ...prev,
                    address,
                    lat: lat ?? prev.lat,
                    lng: lng ?? prev.lng,
                  }));
                }}
              />
            </div>
          </div>

          {form.lat && form.lng && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              📍 Coordenadas: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Notas de seguimiento..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClientDialog;
