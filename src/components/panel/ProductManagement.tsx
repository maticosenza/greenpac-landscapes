import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon, GripVertical, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TechnicalSpec {
  label: string;
  value: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  images: string[] | null;
  features: string[] | null;
  category: string | null;
  price: number | null;
  is_active: boolean | null;
  sort_order: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  technical_specs: any;
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  features: string[];
  is_active: boolean;
  sort_order: string;
  technical_specs: TechnicalSpec[];
}

const emptyFormData: ProductFormData = {
  name: "",
  description: "",
  category: "",
  price: "",
  features: [],
  is_active: true,
  sort_order: "0",
  technical_specs: [],
};

interface ProductManagementProps {
  searchTerm: string;
}

interface SortableImageItemProps {
  id: string;
  url: string;
  label?: string;
  isFirst: boolean;
  onRemove: () => void;
}

const SortableImageItem = ({ id, url, label, isFirst, onRemove }: SortableImageItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/img">
      <img
        src={url}
        alt="Imagen producto"
        className="w-24 h-24 object-cover rounded-lg border"
      />
      <button
        type="button"
        className="absolute top-1 left-1 cursor-grab touch-none bg-black/50 text-white rounded p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Button
        type="button"
        size="icon"
        variant="destructive"
        className="absolute -top-2 -right-2 h-6 w-6"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
      {isFirst && (
        <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
          Principal
        </span>
      )}
      {label && (
        <span className="absolute bottom-1 right-1 bg-secondary text-secondary-foreground text-xs px-1 rounded">
          {label}
        </span>
      )}
    </div>
  );
};

interface SortableFeatureItemProps {
  id: string;
  feature: string;
  onRemove: () => void;
}

const SortableFeatureItem = ({ id, feature, onRemove }: SortableFeatureItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between bg-muted px-3 py-2 rounded"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-sm">{feature}</span>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

interface SortableProductRowProps {
  product: Product;
  index: number;
  total: number;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleActive: (product: Product) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const SortableProductRow = ({ product, index, total, onEdit, onDelete, onToggleActive, onMoveUp, onMoveDown }: SortableProductRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>
        <button
          type="button"
          className="cursor-pointer group/img relative"
          onClick={() => onEdit(product)}
          title="Editar producto"
        >
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded transition-opacity group-hover/img:opacity-70" />
          ) : (
            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center transition-colors group-hover/img:bg-primary/10">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
            <Pencil className="h-4 w-4 text-primary" />
          </div>
        </button>
      </TableCell>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>
        {product.category && <Badge variant="outline" className="capitalize">{product.category}</Badge>}
      </TableCell>
      <TableCell>{product.price ? `$${product.price.toLocaleString("es-AR")}` : "-"}</TableCell>
      <TableCell>
        <Badge variant={product.is_active ? "default" : "secondary"}>{product.is_active ? "Activo" : "Inactivo"}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <span className="text-sm w-6 text-center">{product.sort_order}</span>
          <div className="flex flex-col">
            <Button size="icon" variant="ghost" className="h-5 w-5" disabled={index === 0} onClick={() => onMoveUp(index)}>
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-5 w-5" disabled={index === total - 1} onClick={() => onMoveDown(index)}>
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="ghost" title={product.is_active ? "Ocultar en la página" : "Mostrar en la página"} onClick={() => onToggleActive(product)}>
            {product.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onEdit(product)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { if (confirm("¿Eliminar este producto?")) onDelete(product.id); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const ProductManagement = ({ searchTerm }: ProductManagementProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newSpec, setNewSpec] = useState({ label: "", value: "" });
  const [newFeature, setNewFeature] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFeatureDragEnd = (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = formData.features.findIndex((_, i) => `feature-${i}` === active.id);
      const newIndex = formData.features.findIndex((_, i) => `feature-${i}` === over.id);

      setFormData({
        ...formData,
        features: arrayMove(formData.features, oldIndex, newIndex),
      });
    }
  };

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order");

      if (error) throw error;
      return data;
    },
  });

  const uploadImage = async (file: File, productId: string, index: number): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const fileName = `${productId}_${index}_${timestamp}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const uploadMultipleImages = async (files: File[], productId: string): Promise<string[]> => {
    const uploadPromises = files.map((file, index) => uploadImage(file, productId, index));
    return Promise.all(uploadPromises);
  };

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const featuresArray = data.features.filter((f) => f.trim());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        name: data.name,
        description: data.description,
        category: data.category || null,
        price: data.price ? parseFloat(data.price) : null,
        features: featuresArray,
        is_active: data.is_active,
        sort_order: parseInt(data.sort_order) || 0,
        technical_specs: data.technical_specs,
      };

      const { data: newProduct, error } = await supabase
        .from("products")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Upload new images if any
      if (imageFiles.length > 0 && newProduct) {
        const newImageUrls = await uploadMultipleImages(imageFiles, newProduct.id);
        const allImages = [...newImageUrls];
        await supabase
          .from("products")
          .update({ 
            images: allImages,
            image_url: allImages[0] || null 
          })
          .eq("id", newProduct.id);
      }

      return newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Producto creado exitosamente" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear producto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }) => {
      const featuresArray = data.features.filter((f) => f.trim());

      // Combine existing images with new uploads
      let allImages = [...existingImages];

      if (imageFiles.length > 0) {
        const newImageUrls = await uploadMultipleImages(imageFiles, id);
        allImages = [...allImages, ...newImageUrls];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        name: data.name,
        description: data.description,
        category: data.category || null,
        price: data.price ? parseFloat(data.price) : null,
        features: featuresArray,
        is_active: data.is_active,
        sort_order: parseInt(data.sort_order) || 0,
        technical_specs: data.technical_specs,
        images: allImages,
        image_url: allImages[0] || null,
      };

      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Producto actualizado exitosamente" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar producto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Producto eliminado" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar producto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData(emptyFormData);
    setEditingProduct(null);
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setIsDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const specs = Array.isArray(product.technical_specs) 
      ? product.technical_specs as TechnicalSpec[]
      : [];
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category || "",
      price: product.price?.toString() || "",
      features: product.features || [],
      is_active: product.is_active ?? true,
      sort_order: product.sort_order?.toString() || "0",
      technical_specs: specs,
    });
    // Load existing images
    const productImages = product.images || (product.image_url ? [product.image_url] : []);
    setExistingImages(productImages);
    setImagePreviews([]);
    setImageFiles([]);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addSpec = () => {
    if (newSpec.label && newSpec.value) {
      setFormData({
        ...formData,
        technical_specs: [...formData.technical_specs, { ...newSpec }],
      });
      setNewSpec({ label: "", value: "" });
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const removeSpec = (index: number) => {
    setFormData({
      ...formData,
      technical_specs: formData.technical_specs.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleActive = async (product: Product) => {
    const newActive = !product.is_active;
    const { error } = await supabase.from("products").update({ is_active: newActive }).eq("id", product.id);
    if (error) {
      toast({ title: "Error al cambiar visibilidad", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: newActive ? "Producto visible" : "Producto oculto" });
    }
  };

  const reorderProducts = async (items: Product[]) => {
    const updates = items.map((p, i) => supabase.from("products").update({ sort_order: i }).eq("id", p.id));
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleProductDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !filteredProducts) return;
    const oldIndex = filteredProducts.findIndex(p => p.id === active.id);
    const newIndex = filteredProducts.findIndex(p => p.id === over.id);
    const reordered = arrayMove(filteredProducts, oldIndex, newIndex);
    reorderProducts(reordered);
  };

  const handleMoveUp = (index: number) => {
    if (!filteredProducts || index === 0) return;
    const reordered = arrayMove(filteredProducts, index, index - 1);
    reorderProducts(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (!filteredProducts || index >= filteredProducts.length - 1) return;
    const reordered = arrayMove(filteredProducts, index, index + 1);
    reorderProducts(reordered);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle className="text-lg sm:text-xl">Gestión de Productos</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-3">
                <Label>Imágenes del Producto</Label>
                
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {existingImages.map((url, index) => (
                      <div key={`existing-${index}`} className="relative">
                        <img
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => removeExistingImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {imagePreviews.map((url, index) => (
                      <div key={`new-${index}`} className="relative">
                        <img
                          src={url}
                          alt={`Nueva imagen ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border border-primary"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => removeNewImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <span className="absolute bottom-1 left-1 bg-secondary text-secondary-foreground text-xs px-1 rounded">
                          Nueva
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Input */}
                <div className="flex items-center gap-4">
                  {existingImages.length === 0 && imagePreviews.length === 0 && (
                    <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG o WebP. Máximo 5MB por imagen. Podés seleccionar múltiples archivos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="ej: embolsadoras, extractores"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (opcional)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Orden</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({ ...formData, sort_order: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <span className="text-sm">
                      {formData.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <Label>Características</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva característica"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.features.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleFeatureDragEnd}
                  >
                    <SortableContext
                      items={formData.features.map((_, i) => `feature-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="border rounded-lg p-3 space-y-2">
                        {formData.features.map((feature, index) => (
                          <SortableFeatureItem
                            key={`feature-${index}`}
                            id={`feature-${index}`}
                            feature={feature}
                            onRemove={() => removeFeature(index)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>

              {/* Technical Specifications */}
              <div className="space-y-3">
                <Label>Especificaciones Técnicas</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Etiqueta (ej: Peso)"
                    value={newSpec.label}
                    onChange={(e) =>
                      setNewSpec({ ...newSpec, label: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Valor (ej: 500kg)"
                    value={newSpec.value}
                    onChange={(e) =>
                      setNewSpec({ ...newSpec, value: e.target.value })
                    }
                  />
                  <Button type="button" variant="outline" onClick={addSpec}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.technical_specs.length > 0 && (
                  <div className="border rounded-lg p-3 space-y-2">
                    {formData.technical_specs.map((spec, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-muted px-3 py-2 rounded"
                      >
                        <span className="text-sm">
                          <strong>{spec.label}:</strong> {spec.value}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => removeSpec(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Guardando..."
                    : editingProduct
                    ? "Actualizar Producto"
                    : "Crear Producto"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="block md:hidden space-y-2">
              {filteredProducts?.map((product, index) => (
                <div key={product.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === 0} onClick={() => handleMoveUp(index)}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === (filteredProducts?.length || 0) - 1} onClick={() => handleMoveDown(index)}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <button type="button" className="flex-shrink-0 cursor-pointer relative group/img" onClick={() => handleEdit(product)}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-14 h-14 object-cover rounded transition-opacity group-hover/img:opacity-70" />
                      ) : (
                        <div className="w-14 h-14 bg-muted rounded flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{product.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.category && <Badge variant="outline" className="capitalize text-xs">{product.category}</Badge>}
                        <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">{product.is_active ? "Activo" : "Inactivo"}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleToggleActive(product)}>
                        {product.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { if (confirm("¿Eliminar este producto?")) deleteMutation.mutate(product.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table layout */}
            <div className="hidden md:block overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProductDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-20">Imagen</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Orden</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <SortableContext items={filteredProducts?.map(p => p.id) || []} strategy={verticalListSortingStrategy}>
                    <TableBody>
                      {filteredProducts?.map((product, index) => (
                        <SortableProductRow
                          key={product.id}
                          product={product}
                          index={index}
                          total={filteredProducts.length}
                          onEdit={handleEdit}
                          onDelete={(id) => deleteMutation.mutate(id)}
                          onToggleActive={handleToggleActive}
                          onMoveUp={handleMoveUp}
                          onMoveDown={handleMoveDown}
                        />
                      ))}
                    </TableBody>
                  </SortableContext>
                </Table>
              </DndContext>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductManagement;
