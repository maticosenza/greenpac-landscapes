import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Loader2, Package, Hash, DollarSign, Upload, X, Image as ImageIcon, Wrench, Truck, Tag, FileDown, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { exportSparePartsPDF, exportSuppliersPDF } from "@/lib/generateSparePartsPDF";
import SuppliersManagement from "./SuppliersManagement";
import SparePartCategoriesManager from "./SparePartCategoriesManager";
import type { Supplier } from "./SuppliersManagement";
import type { SparePartCategory } from "./SparePartCategoriesManager";

interface SparePart {
  id: string;
  name: string;
  code: string;
  price: number | null;
  stock: number;
  vendor_id: string | null;
  supplier: string | null;
  supplier_id: string | null;
  category_id: string | null;
  image_url: string | null;
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
  supplier_id: "",
  category_id: "",
};

const SparePartsManagement = ({ searchTerm }: SparePartsManagementProps) => {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [subTab, setSubTab] = useState("list");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SparePart | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [partToDelete, setPartToDelete] = useState<SparePart | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [supplierDetail, setSupplierDetail] = useState<Supplier | null>(null);

  const { data: parts, isLoading } = useQuery({
    queryKey: ["spare-parts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("spare_parts" as any).select("*").order("name");
      if (error) throw error;
      return (data as any[]) as SparePart[];
    },
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendor-profiles"],
    queryFn: async () => {
      const { data: vendorRoles, error: rolesError } = await supabase.from("user_roles").select("user_id").eq("role", "vendedor");
      if (rolesError) throw rolesError;
      const vendorIds = vendorRoles?.map((r) => r.user_id) || [];
      if (vendorIds.length === 0) return [];
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id, full_name").in("id", vendorIds);
      if (profilesError) throw profilesError;
      return profiles as VendorProfile[];
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers" as any).select("*").order("name");
      if (error) throw error;
      return (data as any[]) as Supplier[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["spare-part-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("spare_part_categories" as any).select("*").order("name");
      if (error) throw error;
      return (data as any[]) as SparePartCategory[];
    },
  });

  const { data: supplierSpareParts } = useQuery({
    queryKey: ["supplier-spare-parts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("supplier_spare_parts" as any).select("*");
      if (error) throw error;
      return (data as any[]) as { supplier_id: string; spare_part_id: string }[];
    },
  });

  // Reverse map: spare_part_id -> supplier names
  const partSuppliersMap = useMemo(() => {
    const map: Record<string, Supplier[]> = {};
    supplierSpareParts?.forEach((r) => {
      const sup = suppliers?.find((s) => s.id === r.supplier_id);
      if (sup) {
        if (!map[r.spare_part_id]) map[r.spare_part_id] = [];
        map[r.spare_part_id].push(sup);
      }
    });
    return map;
  }, [supplierSpareParts, suppliers]);

  const combinedSearch = (searchTerm + " " + localSearch).trim().toLowerCase();
  const filtered = parts?.filter((p) => {
    if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;
    if (!combinedSearch) return true;
    return p.name.toLowerCase().includes(combinedSearch) || p.code.toLowerCase().includes(combinedSearch);
  });

  const totalParts = filtered?.length ?? 0;
  const totalStock = filtered?.reduce((sum, p) => sum + p.stock, 0) ?? 0;
  const totalValue = filtered?.reduce((sum, p) => sum + (p.price ?? 0) * p.stock, 0) ?? 0;

  const resetForm = () => { setForm(emptyForm); setEditing(null); setIsDialogOpen(false); setImageFile(null); setImagePreview(null); setExistingImageUrl(null); };

  const openCreate = () => { setForm(emptyForm); setEditing(null); setImageFile(null); setImagePreview(null); setExistingImageUrl(null); setIsDialogOpen(true); };

  const openEdit = (part: SparePart) => {
    setEditing(part);
    setForm({
      name: part.name,
      code: part.code,
      price: part.price != null ? String(part.price) : "",
      stock: String(part.stock),
      vendor_id: part.vendor_id || "",
      supplier_id: part.supplier_id || "",
      category_id: part.category_id || "",
    });
    setImageFile(null); setImagePreview(null); setExistingImageUrl(part.image_url || null);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
    e.target.value = "";
  };

  const uploadImage = async (file: File, partId: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `${partId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("spare-part-images").upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("spare-part-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!form.code.trim()) { toast.error("El código es obligatorio"); return; }
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        code: form.code.trim(),
        price: form.price ? parseFloat(form.price) : null,
        stock: parseInt(form.stock) || 0,
        vendor_id: form.vendor_id || null,
        supplier_id: form.supplier_id || null,
        category_id: form.category_id || null,
        supplier: null, // legacy field
      };

      if (editing) {
        if (imageFile) payload.image_url = await uploadImage(imageFile, editing.id);
        else if (!existingImageUrl) payload.image_url = null;
        const { error } = await supabase.from("spare_parts" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Repuesto actualizado");
      } else {
        payload.created_by = user.id;
        const { data: newPart, error } = await supabase.from("spare_parts" as any).insert(payload).select().single();
        if (error) throw error;
        if (imageFile && newPart) {
          const imgUrl = await uploadImage(imageFile, (newPart as any).id);
          await supabase.from("spare_parts" as any).update({ image_url: imgUrl } as any).eq("id", (newPart as any).id);
        }
        toast.success("Repuesto creado");
      }
      queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
      resetForm();
    } catch (err: any) { toast.error(err.message || "Error al guardar"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!partToDelete) return;
    try {
      const { error } = await supabase.from("spare_parts" as any).delete().eq("id", partToDelete.id);
      if (error) throw error;
      toast.success("Repuesto eliminado");
      queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
    } catch (err: any) { toast.error(err.message || "Error al eliminar"); }
    finally { setPartToDelete(null); }
  };

  const getVendorName = (vendorId: string | null) => {
    if (!vendorId || !vendors) return "—";
    return vendors.find((v) => v.id === vendorId)?.full_name || "—";
  };

  const getSupplier = (supplierId: string | null): Supplier | undefined => {
    if (!supplierId || !suppliers) return undefined;
    return suppliers.find((s) => s.id === supplierId);
  };

  const getCategory = (categoryId: string | null): SparePartCategory | undefined => {
    if (!categoryId || !categories) return undefined;
    return categories.find((c) => c.id === categoryId);
  };

  return (
    <div className="space-y-6">
      {/* Subtabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="bg-muted/50 w-full sm:w-auto justify-center">
            <TabsTrigger value="list" className="gap-1 text-xs sm:text-sm px-2.5 sm:px-3"><Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4" />Repuestos</TabsTrigger>
            <TabsTrigger value="categories" className="gap-1 text-xs sm:text-sm px-2.5 sm:px-3"><Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />Categorías</TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-1 text-xs sm:text-sm px-2.5 sm:px-3"><Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />Proveedores</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => {
                if (!parts?.length) { toast.info("No hay repuestos para exportar"); return; }
                const mapped = (filtered || parts).map((p) => ({
                  name: p.name,
                  code: p.code,
                  price: p.price,
                  stock: p.stock,
                  categoryName: getCategory(p.category_id)?.name,
                  supplierNames: (partSuppliersMap[p.id] || []).map((s) => s.name),
                }));
                exportSparePartsPDF(mapped);
                toast.success("PDF de repuestos descargado");
              }}
            >
              <FileDown className="h-3.5 w-3.5" />Repuestos PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => {
                if (!suppliers?.length) { toast.info("No hay proveedores para exportar"); return; }
                const mapped = suppliers.map((s) => ({
                  name: s.name,
                  cuit: s.cuit,
                  email: s.email,
                  phone: s.phone,
                  province: s.province,
                  city: s.city,
                  company: s.company,
                  categoryName: categories?.find((c) => c.id === s.category_id)?.name,
                  sparePartCount: supplierSpareParts?.filter((r) => r.supplier_id === s.id).length ?? 0,
                }));
                exportSuppliersPDF(mapped);
                toast.success("PDF de proveedores descargado");
              }}
            >
              <FileDown className="h-3.5 w-3.5" />Proveedores PDF
            </Button>
          </div>
        </div>

        <TabsContent value="list" className="mt-6">
          {isLoading ? <p className="text-muted-foreground">Cargando repuestos...</p> : (
            <>
              {/* Metrics */}
              <div className="grid gap-4 grid-cols-3 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Total Repuestos</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  </CardHeader>
                  <CardContent><div className="text-xl sm:text-2xl font-bold">{totalParts}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Stock Total</CardTitle>
                    <Hash className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  </CardHeader>
                  <CardContent><div className="text-xl sm:text-2xl font-bold">{totalStock.toLocaleString("es-AR")}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Valor Inventario</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  </CardHeader>
                  <CardContent><div className="text-xl sm:text-2xl font-bold">${totalValue.toLocaleString("es-AR")}</div></CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <CardTitle className="text-lg sm:text-xl">
                    Repuestos
                    <span className="ml-2 text-sm font-normal text-muted-foreground">({totalParts})</span>
                  </CardTitle>
                  <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nuevo Repuesto</Button>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por nombre o código..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="pl-10" />
                  </div>

                  {/* Category filter pills */}
                  {categories && categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Button
                        size="sm"
                        variant={categoryFilter === "all" ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => setCategoryFilter("all")}
                      >Todos</Button>
                      {categories.map((cat) => (
                        <Button
                          key={cat.id}
                          size="sm"
                          variant={categoryFilter === cat.id ? "default" : "outline"}
                          className="h-7 text-xs gap-1.5"
                          onClick={() => setCategoryFilter(categoryFilter === cat.id ? "all" : cat.id)}
                        >
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </Button>
                      ))}
                    </div>
                  )}

                  {filtered && filtered.length > 0 ? (
                    <>
                      {/* Mobile */}
                      <div className="block md:hidden space-y-4">
                        {filtered.map((p) => {
                          const cat = getCategory(p.category_id);
                          const linkedSuppliers = partSuppliersMap[p.id] || [];
                          return (
                            <div key={p.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                  {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded border shrink-0" />
                                  ) : (
                                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                                  )}
                                  <div className="min-w-0">
                                    <h3 className="font-medium text-sm truncate">{p.name}</h3>
                                    <p className="text-xs text-muted-foreground">Código: {p.code}</p>
                                  </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                                  {isAdmin && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setPartToDelete(p)}><Trash2 className="h-4 w-4" /></Button>}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>{p.price != null ? `$${Number(p.price).toLocaleString("es-AR")}` : "Sin precio"}</span>
                                <span>Stock: {p.stock}</span>
                                {cat && <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: cat.color, color: cat.color }}>{cat.name}</Badge>}
                                {linkedSuppliers.length > 0 && linkedSuppliers.map((s) => (
                                  <button key={s.id} className="underline text-primary text-[10px]" onClick={() => setSupplierDetail(s)}>{s.name}</button>
                                ))}
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
                              <TableHead className="w-[60px]">Foto</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Código</TableHead>
                              <TableHead>Categoría</TableHead>
                              <TableHead>Precio</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Vendedor</TableHead>
                              <TableHead>Proveedor</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filtered.map((p) => {
                              const cat = getCategory(p.category_id);
                              const linkedSuppliers = partSuppliersMap[p.id] || [];
                              return (
                                <TableRow key={p.id}>
                                  <TableCell>
                                    {p.image_url ? (
                                      <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded border" />
                                    ) : (
                                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium">{p.name}</TableCell>
                                  <TableCell>{p.code}</TableCell>
                                  <TableCell>
                                    {cat ? (
                                      <Badge variant="outline" className="text-xs" style={{ borderColor: cat.color, color: cat.color }}>
                                        <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: cat.color }} />
                                        {cat.name}
                                      </Badge>
                                    ) : "—"}
                                  </TableCell>
                                  <TableCell>{p.price != null ? `$${Number(p.price).toLocaleString("es-AR")}` : "—"}</TableCell>
                                  <TableCell>{p.stock}</TableCell>
                                  <TableCell>{getVendorName(p.vendor_id)}</TableCell>
                                  <TableCell>
                                    {linkedSuppliers.length > 0 ? (
                                      linkedSuppliers.map((s, i) => (
                                        <span key={s.id}>
                                          <button className="text-primary underline text-sm hover:text-primary/80 transition-colors" onClick={() => setSupplierDetail(s)}>
                                            {s.name}
                                          </button>
                                          {i < linkedSuppliers.length - 1 && ", "}
                                        </span>
                                      ))
                                    ) : "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                                      {isAdmin && <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setPartToDelete(p)}><Trash2 className="h-4 w-4" /></Button>}
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
                      {combinedSearch || categoryFilter !== "all" ? "No hay repuestos que coincidan." : "Aún no hay repuestos. Usá el botón \"Nuevo Repuesto\" para comenzar."}
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <SparePartCategoriesManager />
        </TabsContent>

        <TabsContent value="suppliers" className="mt-6">
          <SuppliersManagement />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Repuesto" : "Nuevo Repuesto"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image */}
            <div className="space-y-2">
              <Label>Foto del repuesto</Label>
              <div className="flex items-center gap-4">
                {(imagePreview || existingImageUrl) ? (
                  <div className="relative">
                    <img src={imagePreview || existingImageUrl!} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
                    <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => { setImageFile(null); setImagePreview(null); setExistingImageUrl(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/50" /></div>
                )}
                <div className="flex-1">
                  <Input type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG o WebP. Máximo 5MB.</p>
                </div>
              </div>
            </div>

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
                <Label>Categoría</Label>
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
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin asignar</SelectItem>
                    {vendors?.map((v) => <SelectItem key={v.id} value={v.id}>{v.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Proveedor</Label>
                <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v === "_none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar proveedor..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin proveedor</SelectItem>
                    {suppliers?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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
            <AlertDialogDescription>Estás por eliminar <strong>{partToDelete?.name}</strong> (código: {partToDelete?.code}). Esta acción es irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Supplier detail dialog */}
      <Dialog open={!!supplierDetail} onOpenChange={(open) => !open && setSupplierDetail(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Detalle del Proveedor</DialogTitle></DialogHeader>
          {supplierDetail && (
            <div className="space-y-3 text-sm">
              <div><span className="font-medium text-muted-foreground">Nombre:</span> <span className="font-semibold">{supplierDetail.name}</span></div>
              {supplierDetail.cuit && <div><span className="font-medium text-muted-foreground">CUIT:</span> {supplierDetail.cuit}</div>}
              {supplierDetail.email && <div><span className="font-medium text-muted-foreground">Email:</span> {supplierDetail.email}</div>}
              {supplierDetail.phone && <div><span className="font-medium text-muted-foreground">Teléfono:</span> {supplierDetail.phone}</div>}
              {supplierDetail.province && <div><span className="font-medium text-muted-foreground">Provincia:</span> {supplierDetail.province}</div>}
              {supplierDetail.city && <div><span className="font-medium text-muted-foreground">Localidad:</span> {supplierDetail.city}</div>}
              {(() => {
                const linkedParts = parts?.filter((p) => {
                  const sups = partSuppliersMap[p.id] || [];
                  return sups.some((s) => s.id === supplierDetail.id);
                }) || [];
                return linkedParts.length > 0 ? (
                  <div>
                    <span className="font-medium text-muted-foreground">Repuestos ({linkedParts.length}):</span>
                    <div className="mt-1 space-y-1">
                      {linkedParts.map((p) => (
                        <div key={p.id} className="text-xs border rounded px-2 py-1">{p.name} <span className="text-muted-foreground">({p.code})</span></div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SparePartsManagement;
