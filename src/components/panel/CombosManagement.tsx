import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, X, Upload, Image as ImageIcon, Package } from "lucide-react";

interface Combo {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  combo_type: string;
  original_price: number;
  combo_price: number;
  discount_percentage: number;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

interface ComboItem {
  combo_id: string;
  spare_part_id: string;
}

interface SparePart {
  id: string;
  name: string;
  code: string;
  price: number | null;
}

const CombosManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Combo | null>(null);
  const [saving, setSaving] = useState(false);
  const [comboToDelete, setComboToDelete] = useState<Combo | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    combo_type: "combo",
    original_price: "",
    combo_price: "",
    valid_until: "",
    is_active: true,
  });
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);

  const { data: combos = [], isLoading } = useQuery({
    queryKey: ["spare-part-combos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_part_combos" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) as Combo[];
    },
  });

  const { data: comboItems = [] } = useQuery({
    queryKey: ["combo-spare-part-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("combo_spare_part_items" as any)
        .select("combo_id, spare_part_id");
      if (error) throw error;
      return (data as any[]) as ComboItem[];
    },
  });

  const { data: spareParts = [] } = useQuery({
    queryKey: ["spare-parts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_parts" as any)
        .select("id, name, code, price")
        .order("name");
      if (error) throw error;
      return (data as any[]) as SparePart[];
    },
  });

  const comboItemsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    comboItems.forEach((ci) => {
      if (!map[ci.combo_id]) map[ci.combo_id] = [];
      map[ci.combo_id].push(ci.spare_part_id);
    });
    return map;
  }, [comboItems]);

  const calcOriginalPrice = (partIds: string[]) => {
    return partIds.reduce((sum, id) => {
      const part = spareParts.find((p) => p.id === id);
      return sum + (part?.price ?? 0);
    }, 0);
  };

  const calcDiscount = (original: number, combo: number) => {
    if (original <= 0) return 0;
    return Math.round(((original - combo) / original) * 100);
  };

  const resetForm = () => {
    setForm({ name: "", description: "", combo_type: "combo", original_price: "", combo_price: "", valid_until: "", is_active: true });
    setSelectedPartIds([]);
    setEditing(null);
    setIsDialogOpen(false);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (combo: Combo) => {
    setEditing(combo);
    const partIds = comboItemsMap[combo.id] || [];
    setSelectedPartIds(partIds);
    setForm({
      name: combo.name,
      description: combo.description || "",
      combo_type: combo.combo_type,
      original_price: String(combo.original_price),
      combo_price: String(combo.combo_price),
      valid_until: combo.valid_until ? combo.valid_until.split("T")[0] : "",
      is_active: combo.is_active,
    });
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(combo.image_url);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
    e.target.value = "";
  };

  const uploadImage = async (file: File, comboId: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `combo_${comboId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("spare-part-images").upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("spare-part-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Recalc original price when parts change
  const autoOriginalPrice = calcOriginalPrice(selectedPartIds);
  const currentOriginal = form.original_price ? parseFloat(form.original_price) : autoOriginalPrice;
  const currentCombo = form.combo_price ? parseFloat(form.combo_price) : 0;
  const liveDiscount = calcDiscount(currentOriginal, currentCombo);

  const handlePartToggle = (partId: string) => {
    setSelectedPartIds((prev) => {
      const next = prev.includes(partId) ? prev.filter((id) => id !== partId) : [...prev, partId];
      const newOriginal = calcOriginalPrice(next);
      setForm((f) => ({ ...f, original_price: String(newOriginal) }));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!form.combo_price || parseFloat(form.combo_price) <= 0) { toast.error("El precio del combo es obligatorio"); return; }
    if (selectedPartIds.length === 0) { toast.error("Seleccioná al menos un repuesto"); return; }

    setSaving(true);
    try {
      const originalPrice = parseFloat(form.original_price) || autoOriginalPrice;
      const comboPrice = parseFloat(form.combo_price);
      const discount = calcDiscount(originalPrice, comboPrice);

      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        combo_type: form.combo_type,
        original_price: originalPrice,
        combo_price: comboPrice,
        discount_percentage: discount,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        is_active: form.is_active,
      };

      if (editing) {
        if (imageFile) payload.image_url = await uploadImage(imageFile, editing.id);
        else if (!existingImageUrl) payload.image_url = null;

        const { error } = await supabase.from("spare_part_combos" as any).update(payload).eq("id", editing.id);
        if (error) throw error;

        // Update items: delete old, insert new
        await supabase.from("combo_spare_part_items" as any).delete().eq("combo_id", editing.id);
        if (selectedPartIds.length > 0) {
          const items = selectedPartIds.map((spId) => ({ combo_id: editing.id, spare_part_id: spId }));
          const { error: itemError } = await supabase.from("combo_spare_part_items" as any).insert(items);
          if (itemError) throw itemError;
        }
        toast.success("Combo actualizado");
      } else {
        const { data: newCombo, error } = await supabase.from("spare_part_combos" as any).insert(payload).select().single();
        if (error) throw error;
        const comboId = (newCombo as any).id;

        if (imageFile) {
          const imgUrl = await uploadImage(imageFile, comboId);
          await supabase.from("spare_part_combos" as any).update({ image_url: imgUrl } as any).eq("id", comboId);
        }

        const items = selectedPartIds.map((spId) => ({ combo_id: comboId, spare_part_id: spId }));
        const { error: itemError } = await supabase.from("combo_spare_part_items" as any).insert(items);
        if (itemError) throw itemError;

        toast.success("Combo creado");
      }

      queryClient.invalidateQueries({ queryKey: ["spare-part-combos"] });
      queryClient.invalidateQueries({ queryKey: ["combo-spare-part-items"] });
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!comboToDelete) return;
    try {
      const { error } = await supabase.from("spare_part_combos" as any).delete().eq("id", comboToDelete.id);
      if (error) throw error;
      toast.success("Combo eliminado");
      queryClient.invalidateQueries({ queryKey: ["spare-part-combos"] });
      queryClient.invalidateQueries({ queryKey: ["combo-spare-part-items"] });
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setComboToDelete(null);
    }
  };

  const getPartName = (id: string) => spareParts.find((p) => p.id === id)?.name || "—";

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  const [partSearch, setPartSearch] = useState("");
  const filteredParts = spareParts.filter((p) => {
    if (!partSearch.trim()) return true;
    const q = partSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <CardTitle className="text-lg sm:text-xl">
            Combos y Ofertas
            <span className="ml-2 text-sm font-normal text-muted-foreground">({combos.length})</span>
          </CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Nuevo Combo
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : combos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No hay combos creados aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Repuestos</TableHead>
                    <TableHead className="text-right">Precio Original</TableHead>
                    <TableHead className="text-right">Precio Combo</TableHead>
                    <TableHead className="text-center">Descuento</TableHead>
                    <TableHead className="text-center">Vencimiento</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {combos.map((combo) => {
                    const itemCount = (comboItemsMap[combo.id] || []).length;
                    const expired = isExpired(combo.valid_until);
                    return (
                      <TableRow key={combo.id} className={expired ? "opacity-60" : ""}>
                        <TableCell className="font-medium max-w-[200px] truncate">{combo.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className="text-[11px] min-w-[60px] justify-center"
                            style={
                              combo.combo_type === "combo"
                                ? { backgroundColor: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" }
                                : { backgroundColor: "#ffedd5", color: "#c2410c", border: "1px solid #fed7aa" }
                            }
                          >
                            {combo.combo_type === "combo" ? "Combo" : "Oferta"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{itemCount}</TableCell>
                        <TableCell className="text-right text-muted-foreground line-through">
                          ${combo.original_price.toLocaleString("es-AR")}
                        </TableCell>
                        <TableCell className="text-right font-bold" style={{ color: "#16a34a" }}>
                          ${combo.combo_price.toLocaleString("es-AR")}
                        </TableCell>
                        <TableCell className="text-center">
                          {combo.discount_percentage > 0 && (
                            <Badge
                              className="text-[11px]"
                              style={{ backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }}
                            >
                              -{combo.discount_percentage}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {combo.valid_until
                            ? new Date(combo.valid_until).toLocaleDateString("es-AR")
                            : "—"}
                          {expired && <span className="block text-[10px] text-destructive">Vencido</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className="text-[11px] min-w-[60px] justify-center"
                            style={
                              combo.is_active && !expired
                                ? { backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }
                                : { backgroundColor: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" }
                            }
                          >
                            {combo.is_active && !expired ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(combo)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button size="icon" variant="ghost" onClick={() => setComboToDelete(combo)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Combo" : "Nuevo Combo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Descripción</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.combo_type} onValueChange={(v) => setForm({ ...form, combo_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combo">Combo</SelectItem>
                    <SelectItem value="oferta">Oferta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Válido hasta</Label>
                <Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </div>
            </div>

            {/* Image */}
            <div>
              <Label>Imagen</Label>
              <div className="flex items-center gap-3 mt-1">
                {(imagePreview || existingImageUrl) ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={imagePreview || existingImageUrl!} alt="" className="w-full h-full object-cover" />
                    <button type="button" className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5" onClick={() => { setImageFile(null); setImagePreview(null); setExistingImageUrl(null); }}>
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  <span className="inline-flex items-center gap-1 text-sm px-3 py-1.5 border rounded-md hover:bg-muted transition-colors">
                    <Upload className="h-3.5 w-3.5" />Subir
                  </span>
                </label>
              </div>
            </div>

            {/* Part selector */}
            <div>
              <Label>Repuestos incluidos *</Label>
              <div className="mt-1 border rounded-lg p-3 space-y-2">
                {/* Selected tags */}
                {selectedPartIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedPartIds.map((id) => {
                      const part = spareParts.find((p) => p.id === id);
                      return (
                        <span key={id} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border" style={{ backgroundColor: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0" }}>
                          {part ? `${part.name} (${part.code})` : id}
                          <button type="button" onClick={() => handlePartToggle(id)}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <Input
                  placeholder="Buscar repuesto por nombre o código..."
                  value={partSearch}
                  onChange={(e) => setPartSearch(e.target.value)}
                  className="h-8 text-sm"
                />
                <div className="max-h-[150px] overflow-y-auto space-y-0.5">
                  {filteredParts.map((part) => {
                    const selected = selectedPartIds.includes(part.id);
                    return (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => handlePartToggle(part.id)}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors flex items-center justify-between ${selected ? "bg-primary/10 font-medium" : ""}`}
                      >
                        <span>{part.name} <span className="text-muted-foreground text-xs">({part.code})</span></span>
                        <span className="text-xs text-muted-foreground">{part.price != null ? `$${part.price.toLocaleString("es-AR")}` : "—"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Precio original</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.original_price}
                  onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                  placeholder={String(autoOriginalPrice)}
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">Suma automática: ${autoOriginalPrice.toLocaleString("es-AR")}</p>
              </div>
              <div>
                <Label>Precio combo *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.combo_price}
                  onChange={(e) => setForm({ ...form, combo_price: e.target.value })}
                />
              </div>
              <div>
                <Label>Descuento</Label>
                <div className="h-10 flex items-center">
                  <Badge
                    className="text-sm px-3 py-1"
                    style={
                      liveDiscount > 0
                        ? { backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }
                        : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                    }
                  >
                    {liveDiscount > 0 ? `-${liveDiscount}%` : "0%"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Activo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? "Guardar cambios" : "Crear combo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!comboToDelete} onOpenChange={(open) => !open && setComboToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar combo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{comboToDelete?.name}" permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CombosManagement;
