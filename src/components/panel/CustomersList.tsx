import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Loader2, Download, Plus, Search, Filter } from "lucide-react";
import { CLIENT_STATUSES } from "./clientConstants";
import { getStatusInfo } from "./clientConstants";
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
import CreateClientDialog from "./CreateClientDialog";
import ClientDetailDialog, { type ClientRecord } from "./ClientDetailDialog";

interface CustomersListProps {
  searchTerm: string;
}

const CustomersList = ({ searchTerm }: CustomersListProps) => {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ClientRecord | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [localSearch, setLocalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["crm-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any[]) as ClientRecord[];
    },
  });

  const handleDelete = async () => {
    if (!clientToDelete) return;
    setDeletingId(clientToDelete.id);
    try {
      const { error } = await supabase
        .from("clients" as any)
        .delete()
        .eq("id", clientToDelete.id);
      if (error) throw error;
      toast.success("Cliente eliminado");
      queryClient.invalidateQueries({ queryKey: ["crm-clients"] });
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setDeletingId(null);
      setClientToDelete(null);
    }
  };

  const combinedSearch = (searchTerm + " " + localSearch).trim().toLowerCase();
  const filtered = clients?.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (!combinedSearch) return true;
    return (
      c.full_name.toLowerCase().includes(combinedSearch) ||
      (c.email && c.email.toLowerCase().includes(combinedSearch)) ||
      (c.document && c.document.toLowerCase().includes(combinedSearch)) ||
      (c.product_interest && c.product_interest.toLowerCase().includes(combinedSearch)) ||
      (c.city && c.city.toLowerCase().includes(combinedSearch))
    );
  });

  const handleExportCSV = () => {
    if (!filtered || filtered.length === 0) {
      toast.error("No hay clientes para exportar");
      return;
    }
    exportToCSV(
      filtered.map((c) => ({
        ...c,
        status_label: getStatusInfo(c.status).label,
        price_str: c.price != null ? String(c.price) : "",
        created_at_formatted: new Date(c.created_at).toLocaleDateString("es-AR"),
      })),
      `clientes-${new Date().toISOString().split("T")[0]}`,
      [
        { key: "full_name", label: "Nombre" },
        { key: "status_label", label: "Estado" },
        { key: "document", label: "Documento" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Teléfono" },
        { key: "product_interest", label: "Producto de Interés" },
        { key: "price_str", label: "Precio" },
        { key: "province", label: "Provincia" },
        { key: "city", label: "Localidad" },
        { key: "postal_code", label: "Código Postal" },
        { key: "address", label: "Domicilio" },
        { key: "created_at_formatted", label: "Fecha de Registro" },
      ]
    );
    toast.success("Archivo CSV descargado");
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando clientes...</p>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <CardTitle className="text-lg sm:text-xl">
            Clientes
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filtered?.length ?? 0})
            </span>
          </CardTitle>
          <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filtered && filtered.length > 0 ? (
            <>
              {/* Mobile */}
              <div className="block md:hidden space-y-4">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedClient(c)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{c.full_name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{c.email || "Sin email"}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClientToDelete(c);
                        }}
                        disabled={deletingId === c.id}
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${getStatusInfo(c.status).color}`}>
                        {getStatusInfo(c.status).label}
                      </span>
                      {c.phone && <span>{c.phone}</span>}
                      {c.product_interest && <span>• {c.product_interest}</span>}
                      {c.province && <span>• {c.province}</span>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {c.price != null && (
                        <span className="font-medium text-foreground">
                          ${Number(c.price).toLocaleString("es-AR")}
                        </span>
                      )}
                      <span>{new Date(c.created_at).toLocaleDateString("es-AR")}</span>
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
                      <TableHead>Estado</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Provincia</TableHead>
                      <TableHead>Localidad</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedClient(c)}
                      >
                        <TableCell className="font-medium">{c.full_name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${getStatusInfo(c.status).color}`}>
                            {getStatusInfo(c.status).label}
                          </span>
                        </TableCell>
                        <TableCell>{c.document || "—"}</TableCell>
                        <TableCell>{c.email || "—"}</TableCell>
                        <TableCell>{c.phone || "—"}</TableCell>
                        <TableCell>{c.product_interest || "—"}</TableCell>
                        <TableCell>
                          {c.price != null
                            ? `$${Number(c.price).toLocaleString("es-AR")}`
                            : "—"}
                        </TableCell>
                        <TableCell>{c.province || "—"}</TableCell>
                        <TableCell>{c.city || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString("es-AR")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClientToDelete(c);
                            }}
                            disabled={deletingId === c.id}
                          >
                            {deletingId === c.id ? (
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
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm
                ? "No hay clientes que coincidan con la búsqueda."
                : "Aún no hay clientes. Usá el botón \"Agregar Cliente\" para comenzar."}
            </p>
          )}
        </CardContent>
      </Card>

      <CreateClientDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      <ClientDetailDialog
        client={selectedClient}
        open={!!selectedClient}
        onOpenChange={(open) => !open && setSelectedClient(null)}
      />

      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar a <strong>{clientToDelete?.full_name}</strong>.
              <br /><br />
              Esta acción es irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
