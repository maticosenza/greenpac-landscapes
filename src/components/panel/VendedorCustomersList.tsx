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

interface Props {
  searchTerm: string;
  vendedorId: string;
}

interface CustomerRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  created_at: string;
  quotation_count: number;
}

const VendedorCustomersList = ({ searchTerm, vendedorId }: Props) => {
  const { data: customers, isLoading } = useQuery({
    queryKey: ["vendedor-customers", vendedorId],
    queryFn: async () => {
      // Get quotations from this vendor that have a linked customer
      const { data: quotations, error: qError } = await supabase
        .from("quotations")
        .select("customer_id, client_name, client_email, client_phone, company")
        .eq("created_by_employee_id", vendedorId)
        .not("customer_id", "is", null);

      if (qError) throw qError;

      // Build unique customer ids and count quotations per customer
      const countMap: Record<string, number> = {};
      const customerIds: string[] = [];
      for (const q of quotations ?? []) {
        if (q.customer_id) {
          countMap[q.customer_id] = (countMap[q.customer_id] || 0) + 1;
          if (!customerIds.includes(q.customer_id)) customerIds.push(q.customer_id);
        }
      }

      if (customerIds.length === 0) return [];

      // Fetch profiles for those customers
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, company, created_at")
        .in("id", customerIds)
        .order("full_name");

      if (pError) throw pError;

      return (profiles ?? []).map((p) => ({
        ...p,
        quotation_count: countMap[p.id] || 0,
      })) as CustomerRow[];
    },
    enabled: !!vendedorId,
  });

  const filtered = customers?.filter((c) => {
    const s = searchTerm.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      (c.company && c.company.toLowerCase().includes(s))
    );
  });

  if (isLoading) return <p className="text-muted-foreground">Cargando clientes...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">
          Mis Clientes
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({filtered?.length ?? 0})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filtered && filtered.length > 0 ? (
          <>
            {/* Mobile */}
            <div className="block md:hidden space-y-4">
              {filtered.map((c) => (
                <div key={c.id} className="border rounded-lg p-4 space-y-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">{c.full_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {c.phone && <span>{c.phone}</span>}
                    {c.company && <span>• {c.company}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {c.quotation_count} {c.quotation_count === 1 ? "cotización" : "cotizaciones"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
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
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.full_name}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.phone || "-"}</TableCell>
                      <TableCell>{c.company || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{c.quotation_count}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString("es-AR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {searchTerm
              ? "No hay clientes que coincidan con la búsqueda."
              : "Aún no tenés clientes registrados. Creá cotizaciones con clientes para verlos aquí."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default VendedorCustomersList;
