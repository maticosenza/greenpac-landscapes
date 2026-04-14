import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { LogOut, FileText, User, ArrowLeft, Clock, UserCircle, MessageSquare, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/greenpac-logo.png";
import AccountSettingsDialog from "@/components/auth/AccountSettingsDialog";
import QuotationDetailDialog from "@/components/panel/QuotationDetailDialog";
import SparePartsStore from "@/components/panel/SparePartsStore";

const CustomerPanel = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [detailQuotationId, setDetailQuotationId] = useState<string | null>(null);
  const [showStore, setShowStore] = useState(false);

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

  const getUnreadCount = (quotationId: string) => {
    if (!unreadMessages) return 0;
    const qMessages = unreadMessages.filter((m) => m.quotation_id === quotationId);
    let count = 0;
    for (const msg of qMessages) {
      if (msg.is_from_staff) {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
      default:
        return <Badge variant="outline">Consulta</Badge>;
    }
  };

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

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mi Perfil</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{profile?.phone || "Sin teléfono"}</p>
            </CardContent>
          </Card>
        </div>

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
