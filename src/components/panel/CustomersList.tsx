import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface QuotationCount {
  customer_id: string;
  count: number;
}

const CustomersList = ({ searchTerm }: CustomersListProps) => {
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

  const filteredCustomers = customers?.filter((c) => {
    const search = searchTerm.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      (c.company && c.company.toLowerCase().includes(search))
    );
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando clientes...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Clientes</CardTitle>
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
  );
};

export default CustomersList;
