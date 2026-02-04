import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/exportCsv";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";

interface CustomersListProps {
  searchTerm: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  created_at: string;
}

const CustomersList = ({ searchTerm }: CustomersListProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Profile | null>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["all-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: quotationCounts } = useQuery({
    queryKey: ["customer-quotation-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("customer_id");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((q) => {
        if (q.customer_id) {
          counts[q.customer_id] = (counts[q.customer_id] || 0) + 1;
        }
      });

      return counts;
    },
  });

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    setDeletingId(customerToDelete.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({ userId: customerToDelete.id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al eliminar el cliente");
      }

      toast.success("Cliente eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ["all-customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-quotation-counts"] });
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el cliente");
    } finally {
      setDeletingId(null);
      setCustomerToDelete(null);
    }
  };

  const filteredCustomers = customers?.filter((c) => {
    const search = searchTerm.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      (c.company && c.company.toLowerCase().includes(search))
    );
  });

  const handleExportCSV = () => {
    if (!filteredCustomers || filteredCustomers.length === 0) {
      toast.error("No hay clientes para exportar");
      return;
    }

    const dataToExport = filteredCustomers.map((c) => ({
      ...c,
      quotation_count: quotationCounts?.[c.id] || 0,
      created_at_formatted: new Date(c.created_at).toLocaleDateString("es-AR"),
    }));

    exportToCSV(dataToExport, `clientes-${new Date().toISOString().split("T")[0]}`, [
      { key: "full_name", label: "Nombre" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Teléfono" },
      { key: "company", label: "Empresa" },
      { key: "quotation_count", label: "Cotizaciones" },
      { key: "created_at_formatted", label: "Fecha de Registro" },
    ]);

    toast.success("Archivo CSV descargado");
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando clientes...</p>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historial de Clientes</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          {filteredCustomers && filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Cotizaciones</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="w-[80px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.full_name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone || "-"}</TableCell>
                      <TableCell>{customer.company || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {quotationCounts?.[customer.id] || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(customer.created_at).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setCustomerToDelete(customer)}
                          disabled={deletingId === customer.id || customer.id === user?.id}
                          title={customer.id === user?.id ? "No podés eliminar tu propia cuenta" : "Eliminar cliente"}
                        >
                          {deletingId === customer.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay clientes que coincidan con la búsqueda.
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar a <strong>{customerToDelete?.full_name}</strong> ({customerToDelete?.email}).
              <br /><br />
              Esta acción es irreversible y eliminará:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>La cuenta del usuario</li>
                <li>Su perfil y datos asociados</li>
                <li>Sus roles asignados</li>
              </ul>
              <br />
              <strong className="text-destructive">Las cotizaciones asociadas se mantendrán en el sistema.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CustomersList;
