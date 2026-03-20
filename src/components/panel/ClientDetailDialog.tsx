import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Loader2, Pencil, Save, X, Send, Trash2 } from "lucide-react";
import { ARGENTINA_PROVINCES } from "@/lib/argentinaProvinces";
import { CLIENT_STATUSES, getStatusInfo } from "./clientConstants";
import { Separator } from "@/components/ui/separator";
import LocalityAutocomplete from "./LocalityAutocomplete";
import AddressAutocomplete from "./AddressAutocomplete";

export interface ClientRecord {
  id: string;
  full_name: string;
  company: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  product_interest: string | null;
  spare_part_interest: string | null;
  price: number | null;
  province: string | null;
  city: string | null;
  postal_code: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  lat?: number | null;
  lng?: number | null;
}

interface ClientNote {
  id: string;
  client_id: string;
  user_id: string;
  note: string;
  created_at: string;
  author_name?: string;
}

interface Props {
  client: ClientRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ClientDetailDialog = ({ client, open, onOpenChange }: Props) => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<ClientRecord>>({});
  const [newNote, setNewNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);

  useEffect(() => {
    if (client) {
      setForm({ ...client });
      setEditing(false);
      setNewNote("");
    }
  }, [client]);

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ["client-notes", client?.id],
    queryFn: async () => {
      const { data: rawNotes, error } = await supabase
        .from("client_notes" as any)
        .select("*")
        .eq("client_id", client!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((rawNotes as any[]).map((n: any) => n.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const nameMap: Record<string, string> = {};
        profiles?.forEach((p) => {
          nameMap[p.id] = p.full_name;
        });

        return rawNotes.map((n: any) => ({
          ...n,
          author_name: nameMap[n.user_id] || "Usuario",
        }));
      }

      return rawNotes;
    },
    enabled: !!client && open,
  });

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
          company: form.company?.trim() || null,
          document: form.document?.trim() || null,
          email: form.email?.trim() || null,
          phone: form.phone?.trim() || null,
          product_interest: form.product_interest?.trim() || null,
          spare_part_interest: form.spare_part_interest?.trim() || null,
          price: form.price || null,
          province: form.province || null,
          city: form.city?.trim() || null,
          postal_code: form.postal_code?.trim() || null,
          address: form.address?.trim() || null,
          notes: form.notes?.trim() || null,
          status: form.status || "activo",
          lat: form.lat ?? null,
          lng: form.lng ?? null,
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

  const handleAddNote = async () => {
    if (!newNote.trim() || !user?.id) return;
    setSendingNote(true);
    try {
      const { error } = await supabase.from("client_notes" as any).insert({
        client_id: client.id,
        user_id: user.id,
        note: newNote.trim(),
      } as any);

      if (error) throw error;
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["client-notes", client.id] });
      toast.success("Nota agregada");
    } catch (err: any) {
      toast.error(err.message || "Error al agregar nota");
    } finally {
      setSendingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("client_notes" as any)
        .delete()
        .eq("id", noteId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["client-notes", client.id] });
    } catch (err: any) {
      toast.error("Error al eliminar nota");
    }
  };

  const statusInfo = getStatusInfo(form.status || "activo");

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle>{editing ? "Editar Cliente" : "Detalle del Cliente"}</DialogTitle>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full border ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
            </div>
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
              <div className="space-y-2 sm:col-span-2">
                <Label>Empresa</Label>
                <Input
                  value={form.company || ""}
                  onChange={(e) => update("company", e.target.value)}
                  maxLength={200}
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
                <Label>Estado</Label>
                <Select
                  value={form.status || "activo"}
                  onValueChange={(v) => update("status", v)}
                >
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
                  onValueChange={(v) => {
                    setForm((prev) => ({ ...prev, province: v, city: "", lat: null, lng: null }));
                  }}
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
                <LocalityAutocomplete
                  province={form.province || ""}
                  value={form.city || ""}
                  onChange={(city) => {
                    setForm((prev) => ({ ...prev, city, lat: null, lng: null }));
                  }}
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
                <AddressAutocomplete
                  city={form.city || ""}
                  province={form.province || ""}
                  value={form.address || ""}
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
              <Label>Notas generales</Label>
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
                <p className="text-xs text-muted-foreground mb-1">Notas generales</p>
                <p className="text-sm whitespace-pre-wrap">{form.notes}</p>
              </div>
            )}

            <Separator />

            {/* Follow-up history */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Historial de seguimiento</h3>

              {/* Add note */}
              <div className="flex gap-2 mb-4">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Escribí una nota de seguimiento..."
                  rows={2}
                  maxLength={1000}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={sendingNote || !newNote.trim()}
                  className="self-end"
                >
                  {sendingNote ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Notes list */}
              {notesLoading ? (
                <p className="text-xs text-muted-foreground">Cargando historial...</p>
              ) : notes && notes.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {notes.map((n: any) => (
                    <div key={n.id} className="bg-muted/50 rounded-lg p-3 relative group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{n.author_name || "Usuario"}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(n.created_at).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {n.user_id === user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteNote(n.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{n.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Sin notas de seguimiento aún.
                </p>
              )}
            </div>

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
