import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut, FileText, Users, Plus, ArrowLeft, Search, MessageSquare, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/greenpac-logo.png";
import CreateQuotationDialog from "./CreateQuotationDialog";
import AccountSettingsDialog from "@/components/auth/AccountSettingsDialog";
import VendedorQuotationsList from "./VendedorQuotationsList";
import VendedorCustomersList from "./VendedorCustomersList";

const VendedorPanel = () => {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["vendedor-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [quotationsRes, messagesRes] = await Promise.all([
        supabase
          .from("quotations")
          .select("id, status, customer_id")
          .eq("created_by_employee_id", user.id),
        supabase
          .from("quotation_messages")
          .select("quotation_id, is_from_staff, created_at")
          .order("created_at", { ascending: false }),
      ]);

      const quotations = quotationsRes.data || [];
      const messages = messagesRes.data || [];

      // Count unread messages (client messages with no staff response after)
      const quotationIds = quotations.map((q) => q.id);
      let unreadChats = 0;
      for (const qId of quotationIds) {
        const qMessages = messages.filter((m) => m.quotation_id === qId);
        if (qMessages.length > 0 && !qMessages[0].is_from_staff) {
          unreadChats++;
        }
      }

      // Unique customers
      const uniqueCustomers = new Set(quotations.map((q) => q.customer_id).filter(Boolean));

      return {
        totalQuotations: quotations.length,
        pendingQuotations: quotations.filter((q) => q.status === "pending").length,
        totalClients: uniqueCustomers.size,
        unreadChats,
      };
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
            <div className="hidden sm:block">
              <span className="font-display font-bold text-lg">Panel de Vendedor</span>
            </div>
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
        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Mis Cotizaciones</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.totalQuotations ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-yellow-500 hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.pendingQuotations ?? 0}</div>
            </CardContent>
          </Card>
          <Card className={(stats?.unreadChats ?? 0) > 0 ? "border-primary/50 bg-primary/5" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Chats sin leer</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold">{stats?.unreadChats ?? 0}</span>
                {(stats?.unreadChats ?? 0) > 0 && (
                  <Badge variant="destructive" className="animate-pulse text-[10px] sm:text-xs">Nuevos</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Mis Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.totalClients ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search + Nueva cotización */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cotización
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="quotations" className="w-full">
          <div className="bg-card rounded-xl border shadow-sm p-1.5 sm:p-2 mb-6">
            <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-lg grid grid-cols-2 gap-1">
              <TabsTrigger
                value="quotations"
                className="text-xs sm:text-sm px-2 sm:px-4 py-2.5 min-h-[44px] sm:min-h-[40px] rounded-md gap-2 flex items-center justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
              >
                <FileText className="h-[18px] w-[18px] sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Mis Cotizaciones</span>
                <span className="sm:hidden">Cotiz.</span>
                {(stats?.unreadChats ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                    {stats?.unreadChats}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="customers"
                className="text-xs sm:text-sm px-2 sm:px-4 py-2.5 min-h-[44px] sm:min-h-[40px] rounded-md gap-2 flex items-center justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
              >
                <Users className="h-[18px] w-[18px] sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Mis Clientes</span>
                <span className="sm:hidden">Client.</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="quotations">
            <VendedorQuotationsList searchTerm={searchTerm} vendedorId={user?.id ?? ""} />
          </TabsContent>

          <TabsContent value="customers">
            <VendedorCustomersList searchTerm={searchTerm} vendedorId={user?.id ?? ""} />
          </TabsContent>
        </Tabs>

        <CreateQuotationDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />

        <AccountSettingsDialog
          open={showChangePassword}
          onOpenChange={setShowChangePassword}
        />
      </main>
    </div>
  );
};

export default VendedorPanel;
