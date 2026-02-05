import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Archive, ArchiveRestore, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/exportCsv";

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
  is_archived: boolean | null;
}

interface Profile {
  id: string;
  full_name: string;
}

const QuotationsList = ({ searchTerm }: QuotationsListProps) => {
  const queryClient = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null);

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

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from("quotations")
        .update({ is_archived: archived })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { archived }) => {
      queryClient.invalidateQueries({ queryKey: ["all-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      toast.success(archived ? "Cotización archivada" : "Cotización restaurada");
    },
    onError: () => {
      toast.error("Error al archivar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quotations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      setDeleteDialogOpen(false);
      setQuotationToDelete(null);
      toast.success("Cotización eliminada");
    },
    onError: () => {
      toast.error("Error al eliminar");
    },
  });

  const handleDelete = (id: string) => {
    setQuotationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (quotationToDelete) {
      deleteMutation.mutate(quotationToDelete);
    }
  };

  const filteredQuotations = quotations?.filter((q) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      q.client_name.toLowerCase().includes(search) ||
      q.client_email.toLowerCase().includes(search) ||
      (q.company && q.company.toLowerCase().includes(search));
    const matchesArchived = showArchived ? q.is_archived : !q.is_archived;
    return matchesSearch && matchesArchived;
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

  const getStatusLabel = (status: string | null) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option?.label || "Pendiente";
  };

  const getTypeLabel = (type: string | null) => {
    switch (type) {
      case "quote":
        return "Cotización";
      case "purchase":
        return "Compra";
      case "deposit":
        return "Seña";
      default:
        return "Consulta";
    }
  };

  const handleExportCSV = () => {
    if (!filteredQuotations || filteredQuotations.length === 0) {
      toast.error("No hay cotizaciones para exportar");
      return;
    }

    const dataToExport = filteredQuotations.map((q) => ({
      ...q,
      created_at_formatted: new Date(q.created_at).toLocaleDateString("es-AR"),
      type_label: getTypeLabel(q.quotation_type),
      status_label: getStatusLabel(q.status),
      created_by: getEmployeeName(q.created_by_employee_id),
    }));

    exportToCSV(
      dataToExport,
      `cotizaciones-${showArchived ? "archivadas-" : ""}${new Date().toISOString().split("T")[0]}`,
      [
        { key: "created_at_formatted", label: "Fecha" },
        { key: "client_name", label: "Cliente" },
        { key: "client_email", label: "Email" },
        { key: "client_phone", label: "Teléfono" },
        { key: "company", label: "Empresa" },
        { key: "type_label", label: "Tipo" },
        { key: "status_label", label: "Estado" },
        { key: "created_by", label: "Creada por" },
        { key: "message", label: "Mensaje" },
      ]
    );

    toast.success("Archivo CSV descargado");
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando cotizaciones...</p>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg sm:text-xl">{showArchived ? "Cotizaciones Archivadas" : "Todas las Cotizaciones"}</CardTitle>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="flex-1 sm:flex-none"
            >
              {showArchived ? (
                <>
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ver Activas</span>
                  <span className="sm:hidden">Activas</span>
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ver Archivadas</span>
                  <span className="sm:hidden">Archivadas</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredQuotations && filteredQuotations.length > 0 ? (
            <>
              {/* Mobile card layout */}
              <div className="block md:hidden space-y-4">
                {filteredQuotations.map((quotation) => (
                  <div key={quotation.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{quotation.client_name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{quotation.client_email}</p>
                        {quotation.company && (
                          <p className="text-xs text-muted-foreground">{quotation.company}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {getTypeBadge(quotation.quotation_type)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                archiveMutation.mutate({
                                  id: quotation.id,
                                  archived: !quotation.is_archived,
                                })
                              }
                            >
                              {quotation.is_archived ? (
                                <>
                                  <ArchiveRestore className="h-4 w-4 mr-2" />
                                  Restaurar
                                </>
                              ) : (
                                <>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archivar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(quotation.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(quotation.created_at).toLocaleDateString("es-AR")}
                      </span>
                      {quotation.created_by_employee_id && (
                        <span className="text-xs text-muted-foreground">
                          • {getEmployeeName(quotation.created_by_employee_id)}
                        </span>
                      )}
                    </div>
                    <Select
                      value={quotation.status || "pending"}
                      onValueChange={(value) =>
                        updateMutation.mutate({ id: quotation.id, status: value })
                      }
                    >
                      <SelectTrigger className="w-full">
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
                  </div>
                ))}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto">
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
                      <TableHead className="w-10"></TableHead>
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
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  archiveMutation.mutate({
                                    id: quotation.id,
                                    archived: !quotation.is_archived,
                                  })
                                }
                              >
                                {quotation.is_archived ? (
                                  <>
                                    <ArchiveRestore className="h-4 w-4 mr-2" />
                                    Restaurar
                                  </>
                                ) : (
                                  <>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archivar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(quotation.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {showArchived
                ? "No hay cotizaciones archivadas."
                : "No hay cotizaciones que coincidan con la búsqueda."}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cotización será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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

export default QuotationsList;
