import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Package, ArrowLeft, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductStoreDetail from "./ProductStoreDetail";

interface StoreProduct {
  id: string;
  name: string;
  description: string;
  category: string | null;
  image_url: string | null;
  images: string[] | null;
  features: string[] | null;
  price: number | null;
  is_active: boolean | null;
}

interface ProductsStoreProps {
  onBack: () => void;
  initialCategory?: string;
}

const ProductsStore = ({ onBack, initialCategory }: ProductsStoreProps) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory || "all");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [searchFocused, setSearchFocused] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["store-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, category, image_url, images, features, price, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as StoreProduct[];
    },
  });

  const activeCategories = useMemo(() => {
    const countMap: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || "Sin categoría";
      countMap[cat] = (countMap[cat] || 0) + 1;
    });
    return Object.entries(countMap).map(([name, count]) => ({ name, count }));
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (categoryFilter !== "all") {
      list = list.filter((p) => (p.category || "Sin categoría") === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return (a.price ?? 999999) - (b.price ?? 999999);
        case "price-desc":
          return (b.price ?? 0) - (a.price ?? 0);
        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [products, categoryFilter, search, sortBy]);

  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProductId(productId);
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Package className="h-6 w-6" style={{ color: "#16a34a" }} />
              <h1 className="text-xl font-bold">Catálogo de Maquinaria</h1>
            </div>
            <span className="text-sm text-muted-foreground hidden sm:block">
              Mostrando {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Search + Sort row */}
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="pl-10 transition-colors"
                style={searchFocused ? { borderColor: "#16a34a", boxShadow: "0 0 0 1px #16a34a33" } : {}}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] hidden sm:flex">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nombre A-Z</SelectItem>
                <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
                <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category filters */}
          {activeCategories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                  categoryFilter === "all"
                    ? "text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
                style={categoryFilter === "all" ? { backgroundColor: "#16a34a" } : {}}
              >
                Todos ({products.length})
              </button>
              {activeCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setCategoryFilter(cat.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                    categoryFilter === cat.name
                      ? "text-white border-transparent"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  style={categoryFilter === cat.name ? { backgroundColor: "#16a34a" } : {}}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile result count */}
      <div className="container mx-auto px-4 pt-4 sm:hidden">
        <p className="text-xs text-muted-foreground">
          Mostrando {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 py-5">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No se encontraron productos</p>
            <p className="text-sm">Probá con otro término de búsqueda o categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 justify-items-center">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group w-full max-w-[300px] bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg relative"
                onClick={() => handleSelectProduct(product.id)}
              >
                {/* Image */}
                <div className="relative h-[180px] bg-gray-50 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Package className="h-14 w-14 text-gray-200" />
                  )}
                  {product.category && (
                    <span
                      className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-md text-white"
                      style={{ backgroundColor: "#16a34a" }}
                    >
                      {product.category}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3.5 space-y-1.5">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between pt-1">
                    {product.price != null ? (
                      <p className="text-base font-bold" style={{ color: "#16a34a" }}>
                        ${product.price.toLocaleString("es-AR")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Consultar precio</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      {selectedProduct && (
        <ProductStoreDetail
          product={selectedProduct}
          open={!!selectedProductId}
          onOpenChange={(o) => !o && setSelectedProductId(null)}
        />
      )}
    </div>
  );
};

export default ProductsStore;
