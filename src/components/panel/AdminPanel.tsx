import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut, FileText, Users, Plus, ArrowLeft, Search, Settings, Shield, MessageSquare, Package, KeyRound, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/greenpac-logo.png";
import QuotationsList from "./QuotationsList";
import CustomersList from "./CustomersList";
import TeamManagement from "./TeamManagement";
import ContactInquiriesList from "./ContactInquiriesList";
import CreateQuotationDialog from "./CreateQuotationDialog";
import ProductManagement from "./ProductManagement";
import ZonalReports from "./ZonalReports";
import ChangePasswordDialog from "@/components/auth/ChangePasswordDialog";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [quotationsRes, customersRes, employeesRes, inquiriesRes, productsRes] = await Promise.all([
        supabase.from("quotations").select("id, status", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("user_roles").select("id").eq("role", "employee"),
        supabase.from("contact_inquiries").select("id, status"),
        supabase.from("products").select("id, is_active", { count: "exact" }),
      ]);

      return {
        totalQuotations: quotationsRes.count || 0,
        pendingQuotations: quotationsRes.data?.filter((q) => q.status === "pending").length || 0,
        totalCustomers: customersRes.count || 0,
        totalEmployees: employeesRes.data?.length || 0,
        pendingInquiries: inquiriesRes.data?.filter((i) => i.status === "pending").length || 0,
        totalProducts: productsRes.count || 0,
        activeProducts: productsRes.data?.filter((p) => p.is_active).length || 0,
      };
    },
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
              <span className="font-display font-bold text-lg">Panel de Administración</span>
              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                Admin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowChangePassword(true)} title="Cambiar contraseña">
              <KeyRound className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Cotizaciones</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.totalQuotations || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Cotiz. Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-yellow-500 hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.pendingQuotations || 0}</div>
            </CardContent>
          </Card>
          <Card className={stats?.pendingInquiries ? "border-primary/50 bg-primary/5" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Consultas Nuevas</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold">{stats?.pendingInquiries || 0}</span>
                {(stats?.pendingInquiries || 0) > 0 && (
                  <Badge variant="destructive" className="animate-pulse text-[10px] sm:text-xs">Nuevas</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.activeProducts || 0}/{stats?.totalProducts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.totalCustomers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Empleados</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.totalEmployees || 0}</div>
            </CardContent>
          </Card>
        </div>

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

        <Tabs defaultValue="quotations" className="w-full">
          <div className="bg-card rounded-xl border shadow-sm p-1.5 sm:p-2 mb-6">
            {/* Mobile: horizontal scrollable tabs */}
            <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-lg hidden sm:grid sm:grid-cols-6 gap-1">
              <TabsTrigger 
                value="quotations" 
                className="text-sm px-3 py-2.5 min-h-[40px] rounded-md gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
              >
                <FileText className="h-4 w-4 shrink-0" />
                Cotizaciones
              </TabsTrigger>
              <TabsTrigger 
                value="inquiries" 
                className="relative text-sm px-3 py-2.5 min-h-[40px] rounded-md gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                Consultas
                {(stats?.pendingInquiries || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                    {stats?.pendingInquiries}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                className="text-sm px-3 py-2.5 min-h-[40px] rounded-md gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
              >
                <Package className="h-4 w-4 shrink-0" />
                Productos
              </TabsTrigger>
              <TabsTrigger 
                value="customers" 
                className="text-sm px-3 py-2.5 min-h-[40px] rounded-md gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
              >
                <Users className="h-4 w-4 shrink-0" />
                Clientes
              </TabsTrigger>
              <TabsTrigger 
                value="team" 
                className="text-sm px-3 py-2.5 min-h-[40px] rounded-md gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
              >
                <Settings className="h-4 w-4 shrink-0" />
                Equipo
              </TabsTrigger>
              <TabsTrigger 
                value="zones" 
                className="text-sm px-3 py-2.5 min-h-[40px] rounded-md gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
              >
                <MapPin className="h-4 w-4 shrink-0" />
                Zonas
              </TabsTrigger>
            </TabsList>
            {/* Mobile: 2-row grid (3 columns x 2 rows) */}
            <TabsList className="sm:hidden w-full h-auto p-2 bg-muted rounded-xl border border-border/50 grid grid-cols-3 gap-1.5">
              <TabsTrigger value="quotations" className="text-[11px] px-2 py-2 min-h-[48px] rounded-lg flex flex-col items-center justify-center gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/40 data-[state=active]:text-foreground transition-all">
                <FileText className="h-[18px] w-[18px]" />
                <span>Cotizaciones</span>
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="relative text-[11px] px-2 py-2 min-h-[48px] rounded-lg flex flex-col items-center justify-center gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/40 data-[state=active]:text-foreground transition-all">
                <MessageSquare className="h-[18px] w-[18px]" />
                <span>Consultas</span>
                {(stats?.pendingInquiries || 0) > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                    {stats?.pendingInquiries}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="products" className="text-[11px] px-2 py-2 min-h-[48px] rounded-lg flex flex-col items-center justify-center gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/40 data-[state=active]:text-foreground transition-all">
                <Package className="h-[18px] w-[18px]" />
                <span>Productos</span>
              </TabsTrigger>
              <TabsTrigger value="customers" className="text-[11px] px-2 py-2 min-h-[48px] rounded-lg flex flex-col items-center justify-center gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/40 data-[state=active]:text-foreground transition-all">
                <Users className="h-[18px] w-[18px]" />
                <span>Clientes</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="text-[11px] px-2 py-2 min-h-[48px] rounded-lg flex flex-col items-center justify-center gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/40 data-[state=active]:text-foreground transition-all">
                <Settings className="h-[18px] w-[18px]" />
                <span>Equipo</span>
              </TabsTrigger>
              <TabsTrigger value="zones" className="text-[11px] px-2 py-2 min-h-[48px] rounded-lg flex flex-col items-center justify-center gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/40 data-[state=active]:text-foreground transition-all">
                <MapPin className="h-[18px] w-[18px]" />
                <span>Zonas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="quotations">
            <QuotationsList searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="inquiries">
            <ContactInquiriesList searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="customers">
            <CustomersList searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="zones">
            <ZonalReports />
          </TabsContent>
        </Tabs>

        <CreateQuotationDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />

        <ChangePasswordDialog
          open={showChangePassword}
          onOpenChange={setShowChangePassword}
        />
      </main>
    </div>
  );
};

export default AdminPanel;
