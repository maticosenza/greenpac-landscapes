import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SparePartStoreDetail from "./SparePartStoreDetail";

interface StoreSparePart {
  id: string;
  name: string;
  code: string;
  price: number | null;
  stock: number;
  category_id: string | null;
  image_url: string | null;
}

interface StoreCategory {
  id: string;
  name: string;
  color: string | null;
}

interface SparePartsStoreProps {
  onBack: () => void;
}

const SparePartsStore = ({ onBack }: SparePartsStoreProps) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  const { data: parts = [] } = useQuery({
    queryKey: ["store-spare-parts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_parts")
        .select("id, name, code, price, stock, category_id, image_url")
        .order("name");
      if (error) throw error;
      return data as StoreSparePart[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["store-spare-part-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_part_categories")
        .select("id, name, color")
        .order("name");
      if (error) throw error;
      return data as StoreCategory[];
    },
  });

  const categoryMap = useMemo(() => {
    const map: Record<string, StoreCategory> = {};
    categories.forEach((c) => (map[c.id] = c));
    return map;
  }, [categories]);

  // Categories that have at least one part
  const activeCategories = useMemo(() => {
    const ids = new Set(parts.map((p) => p.category_id).filter(Boolean));
    return categories.filter((c) => ids.has(c.id));
  }, [parts, categories]);

  const filtered = useMemo(() => {
    let list = parts;
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.category_id === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
      );
    }
    return list;
  }, [parts, categoryFilter, search]);

  const selectedPart = useMemo(
    () => parts.find((p) => p.id === selectedPartId) || null,
    [parts, selectedPartId]
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0fdf4" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Package className="h-6 w-6" style={{ color: "#16a34a" }} />
            <h1 className="text-xl font-bold">Tienda de Repuestos</h1>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category filters */}
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
              Todos
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                  categoryFilter === cat.id
                    ? "text-white border-transparent"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
                style={
                  categoryFilter === cat.id
                    ? { backgroundColor: cat.color || "#16a34a" }
                    : { color: cat.color || "#374151" }
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No se encontraron repuestos</p>
            <p className="text-sm">Probá con otro término de búsqueda o categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((part) => {
              const cat = part.category_id ? categoryMap[part.category_id] : null;
              return (
                <div
                  key={part.id}
                  onClick={() => setSelectedPartId(part.id)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                    {part.image_url ? (
                      <img
                        src={part.image_url}
                        alt={part.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-16 w-16 text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-sm line-clamp-2 leading-tight">
                      {part.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">Cód: {part.code}</p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {cat && (
                        <Badge
                          className="text-[10px] border"
                          style={{
                            backgroundColor: (cat.color || "#6b7280") + "18",
                            color: cat.color || "#6b7280",
                            borderColor: (cat.color || "#6b7280") + "40",
                          }}
                        >
                          {cat.name}
                        </Badge>
                      )}
                      {part.stock > 0 ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>
                          Disponible
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
                          Sin stock
                        </span>
                      )}
                    </div>

                    {part.price != null && (
                      <p className="text-lg font-bold" style={{ color: "#16a34a" }}>
                        ${part.price.toLocaleString("es-AR")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedPart && (
        <SparePartStoreDetail
          part={selectedPart}
          category={selectedPart.category_id ? categoryMap[selectedPart.category_id] : null}
          open={!!selectedPartId}
          onOpenChange={(open) => !open && setSelectedPartId(null)}
        />
      )}
    </div>
  );
};

export default SparePartsStore;
