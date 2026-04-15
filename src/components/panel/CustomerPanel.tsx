import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogOut, FileText, User, ArrowLeft, Clock, UserCircle, MessageSquare, Package, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/greenpac-logo.png";
import AccountSettingsDialog from "@/components/auth/AccountSettingsDialog";
import QuotationDetailDialog from "@/components/panel/QuotationDetailDialog";
import SparePartsStore, { getRecentlyViewed } from "@/components/panel/SparePartsStore";
import ProductsStore from "@/components/panel/ProductsStore";
import { toast } from "sonner";

const CustomerPanel = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, signOut } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [detailQuotationId, setDetailQuotationId] = useState<string | null>(null);
  const [showStore, setShowStore] = useState(false);
  const [storeInitialCategory, setStoreInitialCategory] = useState<string | undefined>();

  // Handle redirect from auth with tab=tienda-repuestos
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "tienda-repuestos") {
      setShowStore(true);
      searchParams.delete("tab");
      setSearchParams(searchParams, { replace: true });
      // Show welcome toast on first visit
      const welcomeKey = `greenpac-store-welcome-${user?.id}`;
      if (user?.id && !localStorage.getItem(welcomeKey)) {
        localStorage.setItem(welcomeKey, "1");
        toast.success("¡Bienvenido a la Tienda de Repuestos de Greenpac! Explorá el catálogo y solicitá tu cotización.", { duration: 5000 });
      }
    }
  }, [searchParams, setSearchParams, user?.id]);

  const { data: quotations, isLoading } = useQuery({
    queryKey: ["customer-quotations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("customer_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: unreadMessages } = useQuery({
    queryKey: ["customer-unread", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_messages")
        .select("quotation_id, is_from_staff, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch categories for shortcuts
  const { data: categories = [] } = useQuery({
    queryKey: ["store-spare-part-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_part_categories")
        .select("id, name, color")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch spare parts for category counts and recently viewed
  const { data: allParts = [] } = useQuery({
    queryKey: ["store-spare-parts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_parts")
        .select("id, name, code, price, stock, category_id, image_url")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const activeCategories = useMemo(() => {
    const countMap: Record<string, number> = {};
    allParts.forEach((p: any) => {
      if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
    });
    return categories
      .filter((c: any) => countMap[c.id])
      .map((c: any) => ({ ...c, count: countMap[c.id] || 0 }));
  }, [allParts, categories]);

  const recentlyViewedParts = useMemo(() => {
    if (!user?.id || allParts.length === 0) return [];
    const ids = getRecentlyViewed(user.id);
    const partMap = new Map(allParts.map((p: any) => [p.id, p]));
    return ids.map((id) => partMap.get(id)).filter(Boolean).slice(0, 3);
  }, [user?.id, allParts]);

  const categoryMap = useMemo(() => {
    const map: Record<string, any> = {};
    categories.forEach((c: any) => (map[c.id] = c));
    return map;
  }, [categories]);

  const getUnreadCount = (quotationId: string) => {
    if (!unreadMessages) return 0;
    const qMessages = unreadMessages.filter((m) => m.quotation_id === quotationId);
    let count = 0;
    for (const msg of qMessages) {
      if (msg.is_from_staff) count++;
      else break;
    }
    return count;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const openStore = (categoryId?: string) => {
    setStoreInitialCategory(categoryId);
    setShowStore(true);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "contacted":
        return <Badge className="bg-blue-500 text-white">Contactado</Badge>;
      case "approved":
        return <Badge className="bg-green-600 text-white">Aprobada</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rechazada</Badge>;
      case "completed":
        return <Badge className="bg-primary text-primary-foreground">Completado</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const getTypeBadge = (type: string | null) => {
    switch (type) {
      case "quote":
        return <Badge variant="outline">Cotización</Badge>;
      case "purchase":
        return <Badge variant="outline">Compra</Badge>;
      case "deposit":
        return <Badge variant="outline">Seña</Badge>;
      case "spare_part":
        return <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50">Repuesto</Badge>;
      default:
        return <Badge variant="outline">Consulta</Badge>;
    }
  };

  if (showStore) {
    return (
      <SparePartsStore
        onBack={() => { setShowStore(false); setStoreInitialCategory(undefined); }}
        initialCategory={storeInitialCategory}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logo} alt="Greenpac" className="h-10" />
            <span className="font-display font-bold text-lg hidden sm:block">Mi Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowChangePassword(true)} title="Configuración de cuenta">
              <UserCircle className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Welcome message */}
        <div>
          <h2 className="text-lg font-semibold">
            Hola, {profile?.full_name?.split(" ")[0] || "Usuario"} 👋
          </h2>
          <p className="text-sm text-muted-foreground">Bienvenido a tu panel</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotations?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotations?.filter((q) => q.status === "pending").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mi Perfil</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{profile?.phone || "Sin teléfono"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Store CTA - enhanced */}
        <Card className="overflow-hidden border-0 shadow-sm" style={{ backgroundColor: "#f0fdf4" }}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#dcfce7" }}>
                  <Package className="h-5 w-5" style={{ color: "#16a34a" }} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Tienda de Repuestos</h3>
                  <p className="text-xs text-muted-foreground">Explorá el catálogo y solicitá cotización</p>
                </div>
              </div>
              <Button
                size="sm"
                className="text-white hidden sm:flex"
                style={{ backgroundColor: "#16a34a" }}
                onClick={() => openStore()}
              >
                Ver catálogo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Category shortcuts */}
            {activeCategories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {activeCategories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => openStore(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-white border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || "#6b7280" }}
                    />
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Mobile CTA */}
            <Button
              size="sm"
              className="w-full text-white sm:hidden"
              style={{ backgroundColor: "#16a34a" }}
              onClick={() => openStore()}
            >
              Ver catálogo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Recently viewed */}
        {recentlyViewedParts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Vistos recientemente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentlyViewedParts.map((part: any) => {
                const cat = part.category_id ? categoryMap[part.category_id] : null;
                return (
                  <div
                    key={part.id}
                    onClick={() => openStore()}
                    className="flex gap-3 bg-white rounded-lg border border-gray-100 p-3 cursor-pointer hover:shadow-sm transition-shadow"
                  >
                    <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                      {part.image_url ? (
                        <img src={part.image_url} alt={part.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-gray-200" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-semibold truncate">{part.name}</p>
                      <p className="text-[10px] text-muted-foreground">Cód: {part.code}</p>
                      {part.price != null && (
                        <p className="text-xs font-bold" style={{ color: "#16a34a" }}>
                          ${part.price.toLocaleString("es-AR")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Solicitudes */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Solicitudes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : quotations && quotations.length > 0 ? (
              <div className="space-y-4">
                {quotations.map((quotation) => (
                  <div
                    key={quotation.id}
                    className="relative flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setDetailQuotationId(quotation.id)}
                  >
                    {getUnreadCount(quotation.id) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                        <MessageSquare className="h-3 w-3" />
                        {getUnreadCount(quotation.id)}
                      </span>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTypeBadge(quotation.quotation_type)}
                        {getStatusBadge(quotation.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(quotation.created_at).toLocaleDateString("es-AR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      {quotation.message && (
                        <p className="text-sm mt-2">{quotation.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No tenés solicitudes todavía. ¡Solicitá una cotización desde la página principal!
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      <AccountSettingsDialog
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
      <QuotationDetailDialog
        quotationId={detailQuotationId}
        open={!!detailQuotationId}
        onOpenChange={(open) => !open && setDetailQuotationId(null)}
      />
    </div>
  );
};

export default CustomerPanel;
