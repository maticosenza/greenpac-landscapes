import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut, FileText, Users, Plus, ArrowLeft, Search, MessageSquare, KeyRound } from "lucide-react";
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
import ContactInquiriesList from "./ContactInquiriesList";
import CreateQuotationDialog from "./CreateQuotationDialog";
import ChangePasswordDialog from "@/components/auth/ChangePasswordDialog";

const EmployeePanel = () => {
  const navigate = useNavigate();
  const { profile, signOut, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["employee-stats"],
    queryFn: async () => {
      const [quotationsRes, customersRes, inquiriesRes] = await Promise.all([
        supabase.from("quotations").select("id, status", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("contact_inquiries").select("id, status"),
      ]);

      return {
        totalQuotations: quotationsRes.count || 0,
        pendingQuotations: quotationsRes.data?.filter((q) => q.status === "pending").length || 0,
        totalCustomers: customersRes.count || 0,
        pendingInquiries: inquiriesRes.data?.filter((i) => i.status === "pending").length || 0,
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
              <span className="font-display font-bold text-lg">Panel de Empleado</span>
              {isAdmin && (
                <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                  Admin
                </span>
              )}
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
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
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
              <CardTitle className="text-xs sm:text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.totalCustomers || 0}</div>
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
          <div className="bg-card rounded-xl border shadow-sm p-2 mb-6">
            <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-lg grid grid-cols-3 gap-1">
              <TabsTrigger 
                value="quotations" 
                className="text-[11px] sm:text-sm px-2 sm:px-4 py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border transition-all"
              >
                <span className="hidden sm:inline">Cotizaciones</span>
                <span className="sm:hidden flex flex-col items-center gap-0.5">
                  <FileText className="h-4 w-4" />
                  <span>Cotizaciones</span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="inquiries" 
                className="relative text-[11px] sm:text-sm px-2 sm:px-4 py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border transition-all"
              >
                <span className="hidden sm:inline">Consultas</span>
                <span className="sm:hidden flex flex-col items-center gap-0.5">
                  <MessageSquare className="h-4 w-4" />
                  <span>Consultas</span>
                </span>
                {(stats?.pendingInquiries || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                    {stats?.pendingInquiries}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="customers" 
                className="text-[11px] sm:text-sm px-2 sm:px-4 py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border transition-all"
              >
                <span className="hidden sm:inline">Clientes</span>
                <span className="sm:hidden flex flex-col items-center gap-0.5">
                  <Users className="h-4 w-4" />
                  <span>Clientes</span>
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="quotations">
            <QuotationsList searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="inquiries">
            <ContactInquiriesList searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="customers">
            <CustomersList searchTerm={searchTerm} />
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

export default EmployeePanel;
