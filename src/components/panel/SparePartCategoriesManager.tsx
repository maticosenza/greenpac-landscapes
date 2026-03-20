import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SparePartCategory {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

const DEFAULT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#6b7280",
];

const SparePartCategoriesManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SparePartCategory | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<SparePartCategory | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["spare-part-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("spare_part_categories" as any).select("*").order("name");
      if (error) throw error;
      return (data as any[]) as SparePartCategory[];
    },
  });

  const resetForm = () => { setName(""); setColor(DEFAULT_COLORS[0]); setEditing(null); setIsDialogOpen(false); };

  const openEdit = (c: SparePartCategory) => {
    setEditing(c); setName(c.name); setColor(c.color); setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      const payload: any = { name: name.trim(), color };
      if (editing) {
        const { error } = await supabase.from("spare_part_categories" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Categoría actualizada");
      } else {
        const { error } = await supabase.from("spare_part_categories" as any).insert(payload);
        if (error) throw error;
        toast.success("Categoría creada");
      }
      queryClient.invalidateQueries({ queryKey: ["spare-part-categories"] });
      resetForm();
    } catch (err: any) { toast.error(err.message || "Error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      const { error } = await supabase.from("spare_part_categories" as any).delete().eq("id", toDelete.id);
      if (error) throw error;
      toast.success("Categoría eliminada");
      queryClient.invalidateQueries({ queryKey: ["spare-part-categories"] });
    } catch (err: any) { toast.error(err.message || "Error"); }
    finally { setToDelete(null); }
  };

  if (isLoading) return <p className="text-muted-foreground">Cargando categorías...</p>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <CardTitle className="text-lg sm:text-xl">
            Categorías de Repuestos
            <span className="ml-2 text-sm font-normal text-muted-foreground">({categories?.length ?? 0})</span>
          </CardTitle>
          <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />Nueva Categoría
          </Button>
        </CardHeader>
        <CardContent>
          {categories && categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="font-medium text-sm truncate">{c.name}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setToDelete(c)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Aún no hay categorías.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} placeholder="Ej: Filtros" />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-16 h-8 p-0 border-0 cursor-pointer" />
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

      <AlertDialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>Estás por eliminar <strong>{toDelete?.name}</strong>. Los repuestos que la tengan asignada quedarán sin categoría.</AlertDialogDescription>
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

export default SparePartCategoriesManager;
