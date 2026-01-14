import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut, FileText, Users, Plus, ArrowLeft, Search, Settings, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logo from "@/assets/greenpac-logo.png";
import QuotationsList from "./QuotationsList";
import CustomersList from "./CustomersList";
import TeamManagement from "./TeamManagement";
import CreateQuotationDialog from "./CreateQuotationDialog";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [quotationsRes, customersRes, employeesRes] = await Promise.all([
        supabase.from("quotations").select("id, status", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("user_roles").select("id").eq("role", "employee"),
      ]);

      return {
        totalQuotations: quotationsRes.count || 0,
        pendingQuotations: quotationsRes.data?.filter((q) => q.status === "pending").length || 0,
        totalCustomers: customersRes.count || 0,
        totalEmployees: employeesRes.data?.length || 0,
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
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cotizaciones</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalQuotations || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingQuotations || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empleados</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
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
          <TabsList className="mb-6">
            <TabsTrigger value="quotations">Cotizaciones</TabsTrigger>
            <TabsTrigger value="customers">Clientes</TabsTrigger>
            <TabsTrigger value="team">
              <Settings className="h-4 w-4 mr-2" />
              Equipo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotations">
            <QuotationsList searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="customers">
            <CustomersList searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement searchTerm={searchTerm} />
          </TabsContent>
        </Tabs>

        <CreateQuotationDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </main>
    </div>
  );
};

export default AdminPanel;
