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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Archive, ArchiveRestore, Trash2, Eye, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import QuotationDetailDialog from "./QuotationDetailDialog";

interface Props {
  searchTerm: string;
  vendedorId: string;
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
  is_archived: boolean | null;
  created_by_employee_id: string | null;
  hidden_from_vendedores: boolean;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "contacted", label: "Contactado" },
  { value: "approved", label: "Aprobada" },
  { value: "rejected", label: "Rechazada" },
  { value: "completed", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
];

const VendedorQuotationsList = ({ searchTerm, vendedorId }: Props) => {
  const queryClient = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null);
  const [detailQuotationId, setDetailQuotationId] = useState<string | null>(null);

  const { data: quotations, isLoading } = useQuery({
    queryKey: ["vendedor-quotations", vendedorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quotation[];
    },
    enabled: !!vendedorId,
  });

  const { data: latestMessages } = useQuery({
    queryKey: ["vendedor-unread-messages", vendedorId],
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
    let count = 0;
    for (const msg of qMessages) {
      if (!msg.is_from_staff) count++;
      else break;
    }
    return count;
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("quotations").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedor-quotations", vendedorId] });
      queryClient.invalidateQueries({ queryKey: ["vendedor-stats", vendedorId] });
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase.from("quotations").update({ is_archived: archived }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { archived }) => {
      queryClient.invalidateQueries({ queryKey: ["vendedor-quotations", vendedorId] });
      queryClient.invalidateQueries({ queryKey: ["vendedor-stats", vendedorId] });
      toast.success(archived ? "Cotización archivada" : "Cotización restaurada");
    },
    onError: () => toast.error("Error al archivar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedor-quotations", vendedorId] });
      queryClient.invalidateQueries({ queryKey: ["vendedor-stats", vendedorId] });
      setDeleteDialogOpen(false);
      setQuotationToDelete(null);
      toast.success("Cotización eliminada");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const filteredQuotations = quotations?.filter((q) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      q.client_name.toLowerCase().includes(s) ||
      q.client_email.toLowerCase().includes(s) ||
      (q.company && q.company.toLowerCase().includes(s));
    const matchesArchived = showArchived ? q.is_archived : !q.is_archived;
    return matchesSearch && matchesArchived;
  });

  const getTypeBadge = (type: string | null) => {
    const labels: Record<string, string> = {
      quote: "Cotización",
      purchase: "Compra",
      deposit: "Seña",
    };
    return <Badge variant="outline">{labels[type ?? ""] ?? "Consulta"}</Badge>;
  };

  if (isLoading) return <p className="text-muted-foreground">Cargando cotizaciones...</p>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg sm:text-xl">
            {showArchived ? "Cotizaciones Archivadas" : "Todas las Cotizaciones"}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredQuotations?.length ?? 0})
            </span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? (
              <><ArchiveRestore className="h-4 w-4 mr-2" />Ver Activas</>
            ) : (
              <><Archive className="h-4 w-4 mr-2" />Ver Archivadas</>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {filteredQuotations && filteredQuotations.length > 0 ? (
            <>
              {/* Mobile */}
              <div className="block md:hidden space-y-4">
                {filteredQuotations.map((q) => (
                  <div
                    key={q.id}
                    className="relative border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setDetailQuotationId(q.id)}
                  >
                    {getUnreadCount(q.id) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex items-center gap-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                        <MessageSquare className="h-3 w-3" />
                        {getUnreadCount(q.id)}
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{q.client_name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{q.client_email}</p>
                        {q.company && <p className="text-xs text-muted-foreground">{q.company}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        {getTypeBadge(q.quotation_type)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailQuotationId(q.id)}>
                              <Eye className="h-4 w-4 mr-2" />Ver / Chat
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => archiveMutation.mutate({ id: q.id, archived: !q.is_archived })}>
                              {q.is_archived ? <><ArchiveRestore className="h-4 w-4 mr-2" />Restaurar</> : <><Archive className="h-4 w-4 mr-2" />Archivar</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => { setQuotationToDelete(q.id); setDeleteDialogOpen(true); }}>
                              <Trash2 className="h-4 w-4 mr-2" />Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString("es-AR")}</p>
                    <Select value={q.status || "pending"} onValueChange={(value) => updateMutation.mutate({ id: q.id, status: value })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuotations.map((q) => (
                      <TableRow
                        key={q.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setDetailQuotationId(q.id)}
                      >
                        <TableCell className="whitespace-nowrap">{new Date(q.created_at).toLocaleDateString("es-AR")}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1.5">
                            {q.client_name}
                            {getUnreadCount(q.id) > 0 && (
                              <span className="flex items-center gap-0.5 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                <MessageSquare className="h-3 w-3" />
                                {getUnreadCount(q.id)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{q.client_email}</TableCell>
                        <TableCell>{q.company || "-"}</TableCell>
                        <TableCell>{getTypeBadge(q.quotation_type)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select value={q.status || "pending"} onValueChange={(value) => updateMutation.mutate({ id: q.id, status: value })}>
                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailQuotationId(q.id)}>
                                <Eye className="h-4 w-4 mr-2" />Ver / Chat
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => archiveMutation.mutate({ id: q.id, archived: !q.is_archived })}>
                                {q.is_archived ? <><ArchiveRestore className="h-4 w-4 mr-2" />Restaurar</> : <><Archive className="h-4 w-4 mr-2" />Archivar</>}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => { setQuotationToDelete(q.id); setDeleteDialogOpen(true); }}>
                                <Trash2 className="h-4 w-4 mr-2" />Eliminar
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
              {showArchived ? "No hay cotizaciones archivadas." : "Todavía no creaste ninguna cotización."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => quotationToDelete && deleteMutation.mutate(quotationToDelete)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail / Chat dialog */}
      {detailQuotationId && (
        <QuotationDetailDialog
          quotationId={detailQuotationId}
          open={!!detailQuotationId}
          onOpenChange={(open) => { if (!open) setDetailQuotationId(null); }}
        />
      )}
    </>
  );
};

export default VendedorQuotationsList;
