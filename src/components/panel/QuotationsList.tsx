import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface QuotationsListProps {
  searchTerm: string;
}

interface Quotation {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  company: string | null;
  quotation_type: string | null;
  status: string | null;
  message: string | null;
  created_at: string;
  customer_id: string | null;
  created_by_employee_id: string | null;
  product_ids: string[] | null;
}

interface Profile {
  id: string;
  full_name: string;
}

const QuotationsList = ({ searchTerm }: QuotationsListProps) => {
  const queryClient = useQueryClient();

  const { data: quotations, isLoading } = useQuery({
    queryKey: ["all-quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Quotation[];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");

      if (error) throw error;
      return data as Profile[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("quotations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      toast.success("Estado actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar");
    },
  });

  const filteredQuotations = quotations?.filter((q) => {
    const search = searchTerm.toLowerCase();
    return (
      q.client_name.toLowerCase().includes(search) ||
      q.client_email.toLowerCase().includes(search) ||
      (q.company && q.company.toLowerCase().includes(search))
    );
  });

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return "-";
    const employee = employees?.find((e) => e.id === employeeId);
    return employee?.full_name || "-";
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

  const statusOptions = [
    { value: "pending", label: "Pendiente" },
    { value: "contacted", label: "Contactado" },
    { value: "completed", label: "Completado" },
    { value: "cancelled", label: "Cancelado" },
  ];

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando cotizaciones...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todas las Cotizaciones</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredQuotations && filteredQuotations.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Creada por</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(quotation.created_at).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell className="font-medium">{quotation.client_name}</TableCell>
                    <TableCell>{quotation.client_email}</TableCell>
                    <TableCell>{quotation.company || "-"}</TableCell>
                    <TableCell>{getTypeBadge(quotation.quotation_type)}</TableCell>
                    <TableCell>{getEmployeeName(quotation.created_by_employee_id)}</TableCell>
                    <TableCell>
                      <Select
                        value={quotation.status || "pending"}
                        onValueChange={(value) =>
                          updateMutation.mutate({ id: quotation.id, status: value })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No hay cotizaciones que coincidan con la búsqueda.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default QuotationsList;
