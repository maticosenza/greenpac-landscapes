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
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";

interface TechnicalSpec {
  label: string;
  value: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
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
  features: string;
  is_active: boolean;
  sort_order: string;
  technical_specs: TechnicalSpec[];
}

const emptyFormData: ProductFormData = {
  name: "",
  description: "",
  category: "",
  price: "",
  features: "",
  is_active: true,
  sort_order: "0",
  technical_specs: [],
};

interface ProductManagementProps {
  searchTerm: string;
}

const ProductManagement = ({ searchTerm }: ProductManagementProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newSpec, setNewSpec] = useState({ label: "", value: "" });

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

  const uploadImage = async (file: File, productId: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${productId}.${fileExt}`;
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

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const featuresArray = data.features
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f);

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

      if (imageFile && newProduct) {
        const imageUrl = await uploadImage(imageFile, newProduct.id);
        await supabase
          .from("products")
          .update({ image_url: imageUrl })
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
      const featuresArray = data.features
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f);

      let imageUrl = editingProduct?.image_url;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile, id);
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
        image_url: imageUrl,
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
    setImageFile(null);
    setImagePreview(null);
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
      features: product.features?.join(", ") || "",
      is_active: product.is_active ?? true,
      sort_order: product.sort_order?.toString() || "0",
      technical_specs: specs,
    });
    setImagePreview(product.image_url);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Productos</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
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
              <div className="space-y-2">
                <Label>Imagen del Producto</Label>
                <div className="flex items-start gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG o WebP. Máximo 5MB.
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

              <div className="space-y-2">
                <Label htmlFor="features">Características (separadas por coma)</Label>
                <Input
                  id="features"
                  value={formData.features}
                  onChange={(e) =>
                    setFormData({ ...formData, features: e.target.value })
                  }
                  placeholder="ej: Alta capacidad, Fácil manejo, Durabilidad"
                />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {product.category && (
                      <Badge variant="outline" className="capitalize">
                        {product.category}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.price
                      ? `$${product.price.toLocaleString("es-AR")}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.is_active ? "default" : "secondary"}
                    >
                      {product.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.sort_order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("¿Eliminar este producto?")) {
                            deleteMutation.mutate(product.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductManagement;
