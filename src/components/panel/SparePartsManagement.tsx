import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Loader2, Package, Hash, DollarSign, Upload, X, Image as ImageIcon } from "lucide-react";

interface SparePart {
  id: string;
  name: string;
  code: string;
  price: number | null;
  stock: number;
  vendor_id: string | null;
  supplier: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface VendorProfile {
  id: string;
  full_name: string;
}

interface SparePartsManagementProps {
  searchTerm: string;
}

const emptyForm = {
  name: "",
  code: "",
  price: "",
  stock: "0",
  vendor_id: "",
  supplier: "",
};

const SparePartsManagement = ({ searchTerm }: SparePartsManagementProps) => {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SparePart | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [partToDelete, setPartToDelete] = useState<SparePart | null>(null);

  const { data: parts, isLoading } = useQuery({
    queryKey: ["spare-parts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_parts" as any)
        .select("*")
        .order("name");
      if (error) throw error;
      return (data as any[]) as SparePart[];
    },
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendor-profiles"],
    queryFn: async () => {
      const { data: vendorRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "vendedor");
      if (rolesError) throw rolesError;

      const vendorIds = vendorRoles?.map((r) => r.user_id) || [];
      if (vendorIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", vendorIds);
      if (profilesError) throw profilesError;
      return profiles as VendorProfile[];
    },
  });

  const combinedSearch = (searchTerm + " " + localSearch).trim().toLowerCase();
  const filtered = parts?.filter((p) => {
    if (!combinedSearch) return true;
    return (
      p.name.toLowerCase().includes(combinedSearch) ||
      p.code.toLowerCase().includes(combinedSearch)
    );
  });

  const totalParts = filtered?.length ?? 0;
  const totalStock = filtered?.reduce((sum, p) => sum + p.stock, 0) ?? 0;
  const totalValue = filtered?.reduce((sum, p) => sum + (p.price ?? 0) * p.stock, 0) ?? 0;

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setIsDialogOpen(false);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setIsDialogOpen(true);
  };

  const openEdit = (part: SparePart) => {
    setEditing(part);
    setForm({
      name: part.name,
      code: part.code,
      price: part.price != null ? String(part.price) : "",
      stock: String(part.stock),
      vendor_id: part.vendor_id || "",
      supplier: part.supplier || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!form.code.trim()) { toast.error("El código es obligatorio"); return; }
    if (!user?.id) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        price: form.price ? parseFloat(form.price) : null,
        stock: parseInt(form.stock) || 0,
        vendor_id: form.vendor_id || null,
        supplier: form.supplier.trim() || null,
      };

      if (editing) {
        const { error } = await supabase
          .from("spare_parts" as any)
          .update(payload as any)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Repuesto actualizado");
      } else {
        const { error } = await supabase
          .from("spare_parts" as any)
          .insert({ ...payload, created_by: user.id } as any);
        if (error) throw error;
        toast.success("Repuesto creado");
      }

      queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!partToDelete) return;
    try {
      const { error } = await supabase
        .from("spare_parts" as any)
        .delete()
        .eq("id", partToDelete.id);
      if (error) throw error;
      toast.success("Repuesto eliminado");
      queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setPartToDelete(null);
    }
  };

  const getVendorName = (vendorId: string | null) => {
    if (!vendorId || !vendors) return "—";
    return vendors.find((v) => v.id === vendorId)?.full_name || "—";
  };

  if (isLoading) return <p className="text-muted-foreground">Cargando repuestos...</p>;

  return (
    <>
      {/* Metrics */}
      <div className="grid gap-4 grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Repuestos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalParts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Stock Total</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalStock.toLocaleString("es-AR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Valor Inventario</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">${totalValue.toLocaleString("es-AR")}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <CardTitle className="text-lg sm:text-xl">
            Repuestos
            <span className="ml-2 text-sm font-normal text-muted-foreground">({totalParts})</span>
          </CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Repuesto
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {filtered && filtered.length > 0 ? (
            <>
              {/* Mobile */}
              <div className="block md:hidden space-y-4">
                {filtered.map((p) => (
                  <div key={p.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{p.name}</h3>
                        <p className="text-xs text-muted-foreground">Código: {p.code}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setPartToDelete(p)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{p.price != null ? `$${Number(p.price).toLocaleString("es-AR")}` : "Sin precio"}</span>
                      <span>Stock: {p.stock}</span>
                      {p.supplier && <span>Prov: {p.supplier}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.code}</TableCell>
                        <TableCell>{p.price != null ? `$${Number(p.price).toLocaleString("es-AR")}` : "—"}</TableCell>
                        <TableCell>{p.stock}</TableCell>
                        <TableCell>{getVendorName(p.vendor_id)}</TableCell>
                        <TableCell>{p.supplier || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setPartToDelete(p)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {combinedSearch ? "No hay repuestos que coincidan." : "Aún no hay repuestos. Usá el botón \"Nuevo Repuesto\" para comenzar."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Repuesto" : "Nuevo Repuesto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required maxLength={50} placeholder="Ej: REP-001" />
              </div>
              <div className="space-y-2">
                <Label>Precio</Label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="$" />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Vendedor</Label>
                <Select value={form.vendor_id} onValueChange={(v) => setForm({ ...form, vendor_id: v === "_none" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin asignar</SelectItem>
                    {vendors?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Proveedor</Label>
                <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} maxLength={200} placeholder="Nombre del proveedor" />
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

      {/* Delete confirmation */}
      <AlertDialog open={!!partToDelete} onOpenChange={() => setPartToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar repuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar <strong>{partToDelete?.name}</strong> (código: {partToDelete?.code}). Esta acción es irreversible.
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
    </>
  );
};

export default SparePartsManagement;
