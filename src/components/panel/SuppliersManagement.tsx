import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Loader2, Truck } from "lucide-react";
import { ARGENTINA_PROVINCES } from "@/lib/argentinaProvinces";

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

const emptyForm = { name: "", cuit: "", email: "", phone: "", province: "", city: "", company: "", category_id: "", products: "" };

const SuppliersManagement = () => {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [toDelete, setToDelete] = useState<Supplier | null>(null);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers" as any).select("*").order("name");
      if (error) throw error;
      return (data as any[]) as Supplier[];
    },
  });

  const filtered = suppliers?.filter((s) => {
    if (!localSearch) return true;
    const q = localSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.cuit && s.cuit.toLowerCase().includes(q));
  });

  const resetForm = () => { setForm(emptyForm); setEditing(null); setIsDialogOpen(false); };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, cuit: s.cuit || "", email: s.email || "", phone: s.phone || "", province: s.province || "", city: s.city || "", company: s.company || "", category_id: s.category_id || "", products: s.products || "" });
    setIsDialogOpen(true);
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
        products: form.products.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("suppliers" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Proveedor actualizado");
      } else {
        const { error } = await supabase.from("suppliers" as any).insert(payload);
        if (error) throw error;
        toast.success("Proveedor creado");
      }
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
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
    } catch (err: any) { toast.error(err.message || "Error al eliminar"); }
    finally { setToDelete(null); }
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
          <Button size="sm" onClick={() => { setForm(emptyForm); setEditing(null); setIsDialogOpen(true); }}>
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
                {filtered.map((s) => (
                  <div key={s.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{s.name}</h3>
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
                      {s.products && <span className="text-foreground/70">Productos: {s.products}</span>}
                    </div>
                  </div>
                ))}
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
                      <TableHead>Localidad</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.cuit || "—"}</TableCell>
                        <TableCell>{s.email || "—"}</TableCell>
                        <TableCell>{s.phone || "—"}</TableCell>
                        <TableCell>{s.province || "—"}</TableCell>
                        <TableCell>{s.city || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                            {isAdmin && <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setToDelete(s)}><Trash2 className="h-4 w-4" /></Button>}
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
              {localSearch ? "No hay proveedores que coincidan." : "Aún no hay proveedores. Usá el botón \"Nuevo Proveedor\" para comenzar."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
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
              <div className="space-y-2 sm:col-span-2">
                <Label>Productos que provee</Label>
                <Textarea value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })} maxLength={500} placeholder="Ej: Filtros de aire, correas, rodamientos..." rows={2} />
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
