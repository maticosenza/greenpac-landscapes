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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Archive, ArchiveRestore, Trash2, Download, Eye, MessageSquare, List, BarChart3, X } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/exportCsv";
import QuotationDetailDialog from "./QuotationDetailDialog";

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

const STATUS_CONFIG = [
  { value: "contacted", label: "Contactado", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "pending", label: "Pendiente", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "approved", label: "Aprobada", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "rejected", label: "Rechazada", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "completed", label: "Completado", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "cancelled", label: "Cancelado", color: "bg-gray-100 text-gray-800 border-gray-200" },
] as const;

const QuotationsList = ({ searchTerm }: QuotationsListProps) => {
  const queryClient = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null);
  const [detailQuotationId, setDetailQuotationId] = useState<string | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);

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

  // Fetch latest messages per quotation to show unread indicator
  const { data: latestMessages } = useQuery({
    queryKey: ["quotation-unread-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_messages")
        .select("quotation_id, is_from_staff, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getUnreadCount = (quotationId: string) => {
    if (!latestMessages) return 0;
    const qMessages = latestMessages.filter((m) => m.quotation_id === quotationId);
    // Count messages from clients (not staff) that are the latest unresponded
    let count = 0;
    for (const msg of qMessages) {
      if (!msg.is_from_staff) {
        count++;
      } else {
        break; // Stop at first staff message
      }
    }
    return count;
  };

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
    const matchesStatus = activeStatusFilter ? (q.status || "pending") === activeStatusFilter : true;
    return matchesSearch && matchesArchived && matchesStatus;
  });

  const statusCounts = quotations?.reduce((acc, q) => {
    if (showArchived ? q.is_archived : !q.is_archived) {
      const s = q.status || "pending";
      acc[s] = (acc[s] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

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
    { value: "approved", label: "Aprobada" },
    { value: "rejected", label: "Rechazada" },
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

  const renderQuotationList = () => (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <CardTitle className="text-lg sm:text-xl">
          {activeStatusFilter
            ? `${STATUS_CONFIG.find(s => s.value === activeStatusFilter)?.label || ""} (${filteredQuotations?.length || 0})`
            : showArchived ? "Cotizaciones Archivadas" : "Todas las Cotizaciones"}
        </CardTitle>
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
                <div key={quotation.id} className="relative border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setDetailQuotationId(quotation.id)}>
                  {getUnreadCount(quotation.id) > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center gap-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                      <MessageSquare className="h-3 w-3" />
                      {getUnreadCount(quotation.id)}
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-2" onClick={(e) => e.stopPropagation()}>
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
                         <DropdownMenuItem onClick={() => setDetailQuotationId(quotation.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalle
                          </DropdownMenuItem>
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
                    <TableRow key={quotation.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailQuotationId(quotation.id)}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(quotation.created_at).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          {quotation.client_name}
                          {getUnreadCount(quotation.id) > 0 && (
                            <span className="flex items-center gap-0.5 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                              <MessageSquare className="h-3 w-3" />
                              {getUnreadCount(quotation.id)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{quotation.client_email}</TableCell>
                      <TableCell>{quotation.company || "-"}</TableCell>
                      <TableCell>{getTypeBadge(quotation.quotation_type)}</TableCell>
                      <TableCell>{getEmployeeName(quotation.created_by_employee_id)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
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
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailQuotationId(quotation.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
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
            {activeStatusFilter
              ? `No hay cotizaciones con estado "${STATUS_CONFIG.find(s => s.value === activeStatusFilter)?.label}".`
              : showArchived
              ? "No hay cotizaciones archivadas."
              : "No hay cotizaciones que coincidan con la búsqueda."}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Tabs defaultValue="all" className="w-full" onValueChange={() => setActiveStatusFilter(null)}>
        {/* Segmented control tabs - mobile: full-width 2-col, desktop: inline */}
        <TabsList className="w-full h-auto p-1 bg-muted/60 rounded-xl grid grid-cols-2 gap-1 mb-4">
          <TabsTrigger
            value="all"
            className="text-xs sm:text-sm px-2 sm:px-4 py-2.5 min-h-[44px] sm:min-h-[40px] rounded-lg gap-2 font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
          >
            <List className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Todas las cotizaciones</span>
            <span className="sm:hidden leading-tight text-center">Todas</span>
          </TabsTrigger>
          <TabsTrigger
            value="status"
            className="text-xs sm:text-sm px-2 sm:px-4 py-2.5 min-h-[44px] sm:min-h-[40px] rounded-lg gap-2 font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Estado de las cotizaciones</span>
            <span className="sm:hidden leading-tight text-center">Por estado</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderQuotationList()}
        </TabsContent>

        <TabsContent value="status">
          {/* Status chips - mobile: 2-col grid, desktop: flex row */}
          <div className="mb-4">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
              {STATUS_CONFIG.map((s) => {
                const count = statusCounts[s.value] || 0;
                const isActive = activeStatusFilter === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => setActiveStatusFilter(isActive ? null : s.value)}
                    className={`inline-flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all min-h-[44px] ${
                      isActive
                        ? `${s.color} ring-2 ring-primary/30 shadow-sm`
                        : "bg-card border-border text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="truncate">{s.label}</span>
                    <Badge variant={isActive ? "default" : "secondary"} className="text-[11px] px-1.5 py-0 min-w-[20px] text-center shrink-0">
                      {count}
                    </Badge>
                  </button>
                );
              })}
              {activeStatusFilter && (
                <button
                  onClick={() => setActiveStatusFilter(null)}
                  className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-dashed border-muted-foreground/30 text-sm text-muted-foreground hover:bg-muted/50 transition-all min-h-[44px]"
                >
                  <X className="h-3.5 w-3.5" />
                  Ver todas
                </button>
              )}
            </div>
          </div>
          {renderQuotationList()}
        </TabsContent>
      </Tabs>

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

      <QuotationDetailDialog
        quotationId={detailQuotationId}
        open={!!detailQuotationId}
        onOpenChange={(open) => !open && setDetailQuotationId(null)}
        isStaff
      />
    </>
  );
};

export default QuotationsList;
