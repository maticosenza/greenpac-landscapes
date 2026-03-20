import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Loader2, Truck, X, Package } from "lucide-react";
import { ARGENTINA_PROVINCES } from "@/lib/argentinaProvinces";
import type { SparePartCategory } from "./SparePartCategoriesManager";

export interface Supplier {
  id: string;
  name: string;
  cuit: string | null;
  email: string | null;
  phone: string | null;
  province: string | null;
  city: string | null;
  company: string | null;
  category_id: string | null;
  products: string | null;
  created_at: string;
}

interface SparePartOption {
  id: string;
  name: string;
  code: string;
}

interface SupplierSparePart {
  id: string;
  supplier_id: string;
  spare_part_id: string;
}

const emptyForm = { name: "", cuit: "", email: "", phone: "", province: "", city: "", company: "", category_id: "" };

const SuppliersManagement = () => {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [partSearch, setPartSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [toDelete, setToDelete] = useState<Supplier | null>(null);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["spare-part-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("spare_part_categories" as any).select("*").order("name");
      if (error) throw error;
      return (data as any[]) as SparePartCategory[];
    },
  });

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers" as any).select("*").order("name");
      if (error) throw error;
      return (data as any[]) as Supplier[];
    },
  });

  const { data: spareParts } = useQuery({
    queryKey: ["spare-parts-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("spare_parts" as any).select("id, name, code").order("name");
      if (error) throw error;
      return (data as any[]) as SparePartOption[];
    },
  });

  const { data: supplierSpareParts } = useQuery({
    queryKey: ["supplier-spare-parts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("supplier_spare_parts" as any).select("*");
      if (error) throw error;
      return (data as any[]) as SupplierSparePart[];
    },
  });

  // Count of spare parts per supplier
  const partsCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    supplierSpareParts?.forEach((r) => {
      map[r.supplier_id] = (map[r.supplier_id] || 0) + 1;
    });
    return map;
  }, [supplierSpareParts]);

  // Reverse map: spare_part_id -> supplier_ids
  const partToSupplierMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    supplierSpareParts?.forEach((r) => {
      if (!map[r.spare_part_id]) map[r.spare_part_id] = [];
      map[r.spare_part_id].push(r.supplier_id);
    });
    return map;
  }, [supplierSpareParts]);

  const filtered = suppliers?.filter((s) => {
    if (!localSearch) return true;
    const q = localSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.cuit && s.cuit.toLowerCase().includes(q));
  });

  const filteredParts = spareParts?.filter((p) => {
    if (!partSearch) return true;
    const q = partSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setIsDialogOpen(false);
    setSelectedPartIds([]);
    setPartSearch("");
  };

  const openEdit = async (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      cuit: s.cuit || "",
      email: s.email || "",
      phone: s.phone || "",
      province: s.province || "",
      city: s.city || "",
      company: s.company || "",
      category_id: s.category_id || "",
    });
    // Load linked spare parts
    const linked = supplierSpareParts?.filter((r) => r.supplier_id === s.id).map((r) => r.spare_part_id) || [];
    setSelectedPartIds(linked);
    setPartSearch("");
    setIsDialogOpen(true);
  };

  const togglePart = (partId: string) => {
    setSelectedPartIds((prev) =>
      prev.includes(partId) ? prev.filter((id) => id !== partId) : [...prev, partId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        cuit: form.cuit.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        province: form.province || null,
        city: form.city.trim() || null,
        company: form.company.trim() || null,
        category_id: form.category_id || null,
      };

      let supplierId: string;

      if (editing) {
        supplierId = editing.id;
        const { error } = await supabase.from("suppliers" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("suppliers" as any).insert(payload).select().single();
        if (error) throw error;
        supplierId = (data as any).id;
      }

      // Sync junction table: delete existing, insert new
      await supabase.from("supplier_spare_parts" as any).delete().eq("supplier_id", supplierId);
      if (selectedPartIds.length > 0) {
        const rows = selectedPartIds.map((spId) => ({ supplier_id: supplierId, spare_part_id: spId }));
        const { error: linkError } = await supabase.from("supplier_spare_parts" as any).insert(rows);
        if (linkError) throw linkError;
      }

      toast.success(editing ? "Proveedor actualizado" : "Proveedor creado");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-spare-parts"] });
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      const { error } = await supabase.from("suppliers" as any).delete().eq("id", toDelete.id);
      if (error) throw error;
      toast.success("Proveedor eliminado");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-spare-parts"] });
    } catch (err: any) { toast.error(err.message || "Error al eliminar"); }
    finally { setToDelete(null); }
  };

  const getPartName = (partId: string) => {
    const p = spareParts?.find((sp) => sp.id === partId);
    return p ? `${p.name} (${p.code})` : partId;
  };

  // Parts linked to a specific supplier (for detail dialog)
  const getSupplierParts = (supplierId: string) => {
    const partIds = supplierSpareParts?.filter((r) => r.supplier_id === supplierId).map((r) => r.spare_part_id) || [];
    return spareParts?.filter((p) => partIds.includes(p.id)) || [];
  };

  if (isLoading) return <p className="text-muted-foreground">Cargando proveedores...</p>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <CardTitle className="text-lg sm:text-xl">
            Proveedores
            <span className="ml-2 text-sm font-normal text-muted-foreground">({filtered?.length ?? 0})</span>
          </CardTitle>
          <Button size="sm" onClick={() => { setForm(emptyForm); setEditing(null); setSelectedPartIds([]); setPartSearch(""); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />Nuevo Proveedor
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o CUIT..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="pl-10" />
          </div>

          {filtered && filtered.length > 0 ? (
            <>
              {/* Mobile */}
              <div className="block md:hidden space-y-4">
                {filtered.map((s) => {
                  const count = partsCountMap[s.id] || 0;
                  return (
                    <div key={s.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <button className="font-medium text-sm truncate text-primary underline" onClick={() => setDetailSupplier(s)}>{s.name}</button>
                          {s.cuit && <p className="text-xs text-muted-foreground">CUIT: {s.cuit}</p>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          {isAdmin && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setToDelete(s)}><Trash2 className="h-4 w-4" /></Button>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {s.email && <span>{s.email}</span>}
                        {s.phone && <span>{s.phone}</span>}
                        {s.province && <span>{s.province}{s.city ? `, ${s.city}` : ""}</span>}
                        <button className="text-primary underline" onClick={() => setDetailSupplier(s)}>
                          {count} repuesto{count !== 1 ? "s" : ""}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre / Razón Social</TableHead>
                      <TableHead>CUIT</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Provincia</TableHead>
                      <TableHead>Repuestos</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => {
                      const count = partsCountMap[s.id] || 0;
                      return (
                        <TableRow key={s.id}>
                          <TableCell>
                            <button className="font-medium text-primary underline hover:text-primary/80 transition-colors" onClick={() => setDetailSupplier(s)}>
                              {s.name}
                            </button>
                          </TableCell>
                          <TableCell>{s.cuit || "—"}</TableCell>
                          <TableCell>{s.email || "—"}</TableCell>
                          <TableCell>{s.phone || "—"}</TableCell>
                          <TableCell>{s.province || "—"}</TableCell>
                          <TableCell>
                            <button className="text-primary underline text-sm hover:text-primary/80 transition-colors" onClick={() => setDetailSupplier(s)}>
                              {count} repuesto{count !== 1 ? "s" : ""}
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                              {isAdmin && <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setToDelete(s)}><Trash2 className="h-4 w-4" /></Button>}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {localSearch ? "No hay proveedores que coincidan." : "Aún no hay proveedores. Usá el botón \"Nuevo Proveedor\" para comenzar."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nombre / Razón Social *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={200} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Empresa</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} maxLength={200} placeholder="Nombre de la empresa" />
              </div>
              <div className="space-y-2">
                <Label>CUIT</Label>
                <Input value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} maxLength={20} placeholder="XX-XXXXXXXX-X" />
              </div>
              <div className="space-y-2">
                <Label>Email de contacto</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono de contacto</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={50} />
              </div>
              <div className="space-y-2">
                <Label>Provincia</Label>
                <Select value={form.province} onValueChange={(v) => setForm({ ...form, province: v === "_none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin especificar</SelectItem>
                    {ARGENTINA_PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Localidad</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label>Categoría de producto</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v === "_none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin categoría</SelectItem>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Multi-select spare parts */}
            <div className="space-y-2">
              <Label>Repuestos que provee</Label>
              {/* Selected badges */}
              {selectedPartIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedPartIds.map((id) => (
                    <Badge key={id} variant="secondary" className="gap-1 pr-1 text-xs">
                      {getPartName(id)}
                      <button type="button" onClick={() => togglePart(id)} className="ml-0.5 hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {/* Search and list */}
              <div className="border rounded-lg">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar repuestos por nombre o código..."
                    value={partSearch}
                    onChange={(e) => setPartSearch(e.target.value)}
                    className="pl-8 border-0 border-b rounded-none h-9 text-sm focus-visible:ring-0"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {filteredParts && filteredParts.length > 0 ? (
                    filteredParts.map((p) => {
                      const isSelected = selectedPartIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePart(p.id)}
                          className={`w-full text-left px-3 py-1.5 text-sm flex items-center justify-between hover:bg-muted/50 transition-colors ${isSelected ? "bg-primary/5 font-medium" : ""}`}
                        >
                          <span className="truncate">{p.name} <span className="text-muted-foreground">({p.code})</span></span>
                          {isSelected && <span className="text-primary text-xs shrink-0 ml-2">✓</span>}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      {partSearch ? "Sin resultados" : "No hay repuestos cargados"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Supplier detail dialog */}
      <Dialog open={!!detailSupplier} onOpenChange={(open) => !open && setDetailSupplier(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalle del Proveedor</DialogTitle></DialogHeader>
          {detailSupplier && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div><span className="font-medium text-muted-foreground">Nombre:</span> <span className="font-semibold">{detailSupplier.name}</span></div>
                {detailSupplier.company && <div><span className="font-medium text-muted-foreground">Empresa:</span> {detailSupplier.company}</div>}
                {detailSupplier.cuit && <div><span className="font-medium text-muted-foreground">CUIT:</span> {detailSupplier.cuit}</div>}
                {detailSupplier.email && <div><span className="font-medium text-muted-foreground">Email:</span> {detailSupplier.email}</div>}
                {detailSupplier.phone && <div><span className="font-medium text-muted-foreground">Teléfono:</span> {detailSupplier.phone}</div>}
                {detailSupplier.province && <div><span className="font-medium text-muted-foreground">Provincia:</span> {detailSupplier.province}</div>}
                {detailSupplier.city && <div><span className="font-medium text-muted-foreground">Localidad:</span> {detailSupplier.city}</div>}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  Repuestos que provee ({getSupplierParts(detailSupplier.id).length})
                </h4>
                {getSupplierParts(detailSupplier.id).length > 0 ? (
                  <div className="space-y-1.5">
                    {getSupplierParts(detailSupplier.id).map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-sm border rounded-md px-3 py-2">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground text-xs">({p.code})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tiene repuestos asociados.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>Estás por eliminar <strong>{toDelete?.name}</strong>. Esta acción es irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SuppliersManagement;
