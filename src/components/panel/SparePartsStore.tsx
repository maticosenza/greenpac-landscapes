import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, ArrowLeft, ArrowUpDown, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SparePartStoreDetail from "./SparePartStoreDetail";
import { useAuth } from "@/hooks/useAuth";

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
  initialCategory?: string;
}

const RECENTLY_VIEWED_KEY = "greenpac-recently-viewed-parts";

export const getRecentlyViewed = (userId: string): string[] => {
  try {
    const data = localStorage.getItem(`${RECENTLY_VIEWED_KEY}-${userId}`);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const addRecentlyViewed = (userId: string, partId: string) => {
  const current = getRecentlyViewed(userId);
  const updated = [partId, ...current.filter((id) => id !== partId)].slice(0, 10);
  localStorage.setItem(`${RECENTLY_VIEWED_KEY}-${userId}`, JSON.stringify(updated));
};

const SparePartsStore = ({ onBack, initialCategory }: SparePartsStoreProps) => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory || "all");
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (initialCategory) setCategoryFilter(initialCategory);
  }, [initialCategory]);

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

  const { data: combos = [] } = useQuery({
    queryKey: ["store-combos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_part_combos" as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).filter((c: any) => !c.valid_until || new Date(c.valid_until) >= new Date());
    },
  });

  const { data: comboItems = [] } = useQuery({
    queryKey: ["store-combo-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("combo_spare_part_items" as any)
        .select("combo_id, spare_part_id");
      if (error) throw error;
      return (data as any[]) as { combo_id: string; spare_part_id: string }[];
    },
  });

  const [comboScroll, setComboScroll] = useState(0);

  const categoryMap = useMemo(() => {
    const map: Record<string, StoreCategory> = {};
    categories.forEach((c) => (map[c.id] = c));
    return map;
  }, [categories]);

  const activeCategories = useMemo(() => {
    const countMap: Record<string, number> = {};
    parts.forEach((p) => {
      if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
    });
    return categories
      .filter((c) => countMap[c.id])
      .map((c) => ({ ...c, count: countMap[c.id] || 0 }));
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
    // Sort
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
  }, [parts, categoryFilter, search, sortBy]);

  const handleSelectPart = useCallback((partId: string) => {
    setSelectedPartId(partId);
    if (user?.id) addRecentlyViewed(user.id, partId);
  }, [user?.id]);

  const selectedPart = useMemo(
    () => parts.find((p) => p.id === selectedPartId) || null,
    [parts, selectedPartId]
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
              <h1 className="text-xl font-bold">Tienda de Repuestos</h1>
            </div>
            <span className="text-sm text-muted-foreground hidden sm:block">
              Mostrando {filtered.length} repuesto{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Search + Sort row */}
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código..."
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
              Todos ({parts.length})
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors flex items-center gap-1.5 ${
                  categoryFilter === cat.id
                    ? "text-white border-transparent"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
                style={
                  categoryFilter === cat.id
                    ? { backgroundColor: "#16a34a" }
                    : {}
                }
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color || "#6b7280" }}
                />
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile result count */}
      <div className="container mx-auto px-4 pt-4 sm:hidden">
        <p className="text-xs text-muted-foreground">
          Mostrando {filtered.length} repuesto{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Combos & Ofertas */}
      {combos.length > 0 && (
        <div className="container mx-auto px-4 pt-5 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" style={{ color: "#16a34a" }} />
              <h2 className="text-lg font-bold">Combos y Ofertas</h2>
            </div>
            {combos.length > 2 && (
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setComboScroll(Math.max(0, comboScroll - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setComboScroll(Math.min(combos.length - 1, comboScroll + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 snap-x">
            {combos.map((combo: any) => {
              const itemPartIds = comboItems.filter((ci) => ci.combo_id === combo.id).map((ci) => ci.spare_part_id);
              const itemParts = parts.filter((p) => itemPartIds.includes(p.id));
              return (
                <div
                  key={combo.id}
                  className="flex-shrink-0 w-[340px] sm:w-[400px] border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow snap-start"
                >
                  <div className="flex h-full">
                    {/* Image */}
                    <div className="w-[120px] sm:w-[140px] flex-shrink-0 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {combo.image_url ? (
                        <img src={combo.image_url} alt={combo.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-10 w-10 text-gray-200" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-h-[160px]">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge
                            className="text-[10px] px-1.5 py-0"
                            style={
                              combo.combo_type === "combo"
                                ? { backgroundColor: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" }
                                : { backgroundColor: "#ffedd5", color: "#c2410c", border: "1px solid #fed7aa" }
                            }
                          >
                            {combo.combo_type === "combo" ? "Combo" : "Oferta"}
                          </Badge>
                          {combo.discount_percentage > 0 && (
                            <Badge className="text-[10px] px-1.5 py-0" style={{ backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }}>
                              -{combo.discount_percentage}%
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{combo.name}</h3>
                        <div className="mt-1.5 space-y-0.5">
                          {itemParts.slice(0, 3).map((p) => (
                            <p key={p.id} className="text-[11px] text-muted-foreground truncate">• {p.name}</p>
                          ))}
                          {itemParts.length > 3 && (
                            <p className="text-[10px] text-muted-foreground">+{itemParts.length - 3} más</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground line-through">${combo.original_price?.toLocaleString("es-AR")}</span>
                          <span className="text-base font-bold" style={{ color: "#16a34a" }}>${combo.combo_price?.toLocaleString("es-AR")}</span>
                        </div>
                        {combo.valid_until && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Válido hasta {new Date(combo.valid_until).toLocaleDateString("es-AR")}
                          </p>
                        )}
                        <Button
                          size="sm"
                          className="w-full mt-2 text-xs h-8 text-white"
                          style={{ backgroundColor: "#16a34a" }}
                          onClick={() => {
                            // Open detail of first part or handle combo request
                            if (itemParts.length > 0) handleSelectPart(itemParts[0].id);
                          }}
                        >
                          Solicitar cotización
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="container mx-auto px-4 py-5">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No se encontraron repuestos</p>
            <p className="text-sm">Probá con otro término de búsqueda o categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 justify-items-center">
            {filtered.map((part) => {
              const cat = part.category_id ? categoryMap[part.category_id] : null;
              return (
                <div
                  key={part.id}
                  className="group w-full max-w-[280px] bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg relative"
                  onClick={() => handleSelectPart(part.id)}
                >
                  {/* Image */}
                  <div className="relative h-[160px] bg-gray-50 flex items-center justify-center overflow-hidden">
                    {part.image_url ? (
                      <img
                        src={part.image_url}
                        alt={part.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-14 w-14 text-gray-200" />
                    )}
                    {/* Category badge over image */}
                    {cat && (
                      <span
                        className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-md text-white"
                        style={{ backgroundColor: cat.color || "#6b7280" }}
                      >
                        {cat.name}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3.5 space-y-1.5">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                      {part.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Cód: {part.code}</p>

                    <div className="flex items-center justify-between pt-1">
                      {part.price != null ? (
                        <p className="text-base font-bold" style={{ color: "#16a34a" }}>
                          ${part.price.toLocaleString("es-AR")}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Consultar</p>
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
                  </div>

                  {/* Hover button */}
                  <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    <button
                      className="w-full py-2.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: "#16a34a" }}
                    >
                      Solicitar
                    </button>
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
