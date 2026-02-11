import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Send,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";

interface QuotationDetailDialogProps {
  quotationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isStaff?: boolean;
}

interface HistoryEntry {
  id: string;
  quotation_id: string;
  user_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
}

const statusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "contacted", label: "Contactado" },
  { value: "approved", label: "Aprobada" },
  { value: "rejected", label: "Rechazada" },
  { value: "completed", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
];

const getStatusLabel = (status: string | null) => {
  return statusOptions.find((o) => o.value === status)?.label || "Pendiente";
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pendiente</Badge>;
    case "contacted":
      return <Badge className="bg-blue-500 text-white">Contactado</Badge>;
    case "approved":
      return <Badge className="bg-green-600 text-white">Aprobada</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rechazada</Badge>;
    case "completed":
      return <Badge className="bg-primary text-primary-foreground">Completado</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return <Badge variant="secondary">Pendiente</Badge>;
  }
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

const getActionIcon = (action: string) => {
  switch (action) {
    case "status_change":
      return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
    case "note":
      return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    case "approved":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActionLabel = (entry: HistoryEntry) => {
  switch (entry.action) {
    case "status_change":
      return `Estado cambiado de "${getStatusLabel(entry.old_status)}" a "${getStatusLabel(entry.new_status)}"`;
    case "note":
      return "Nota agregada";
    case "approved":
      return "Cotización aprobada por el cliente";
    case "rejected":
      return "Cotización rechazada por el cliente";
    default:
      return entry.action;
  }
};

const QuotationDetailDialog = ({
  quotationId,
  open,
  onOpenChange,
  isStaff = false,
}: QuotationDetailDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [newStatus, setNewStatus] = useState<string | null>(null);

  const { data: quotation } = useQuery({
    queryKey: ["quotation-detail", quotationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", quotationId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!quotationId && open,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["quotation-history", quotationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_history")
        .select("*")
        .eq("quotation_id", quotationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as HistoryEntry[];
    },
    enabled: !!quotationId && open,
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const getUserName = (userId: string) => {
    return profiles?.find((p) => p.id === userId)?.full_name || "Usuario";
  };

  const addHistoryMutation = useMutation({
    mutationFn: async (entry: {
      action: string;
      note?: string;
      old_status?: string;
      new_status?: string;
    }) => {
      // Insert history entry
      const { error: histError } = await supabase.from("quotation_history").insert({
        quotation_id: quotationId!,
        user_id: user!.id,
        action: entry.action,
        note: entry.note || null,
        old_status: entry.old_status || null,
        new_status: entry.new_status || null,
      });
      if (histError) throw histError;

      // Update quotation status if applicable
      if (entry.new_status) {
        const { error: qError } = await supabase
          .from("quotations")
          .update({ status: entry.new_status })
          .eq("id", quotationId!);
        if (qError) throw qError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation-history", quotationId] });
      queryClient.invalidateQueries({ queryKey: ["quotation-detail", quotationId] });
      queryClient.invalidateQueries({ queryKey: ["all-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["customer-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      setNewNote("");
      setNewStatus(null);
      toast.success("Historial actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar el historial");
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addHistoryMutation.mutate({ action: "note", note: newNote.trim() });
  };

  const handleStatusChange = (status: string) => {
    if (!quotation) return;
    addHistoryMutation.mutate({
      action: "status_change",
      old_status: quotation.status,
      new_status: status,
    });
  };

  const handleApprove = () => {
    addHistoryMutation.mutate({
      action: "approved",
      old_status: quotation?.status,
      new_status: "approved",
      note: "El cliente aprobó la cotización",
    });
  };

  const handleReject = () => {
    addHistoryMutation.mutate({
      action: "rejected",
      old_status: quotation?.status,
      new_status: "rejected",
      note: "El cliente rechazó la cotización",
    });
  };

  if (!quotation) return null;

  const canApproveReject =
    !isStaff &&
    quotation.customer_id === user?.id &&
    quotation.status !== "approved" &&
    quotation.status !== "rejected" &&
    quotation.status !== "completed" &&
    quotation.status !== "cancelled";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            Detalle de Cotización
            {getTypeBadge(quotation.quotation_type)}
            {getStatusBadge(quotation.status)}
          </DialogTitle>
        </DialogHeader>

        {/* Quotation Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Cliente</p>
            <p className="font-medium">{quotation.client_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{quotation.client_email}</p>
          </div>
          {quotation.client_phone && (
            <div>
              <p className="text-muted-foreground">Teléfono</p>
              <p className="font-medium">{quotation.client_phone}</p>
            </div>
          )}
          {quotation.company && (
            <div>
              <p className="text-muted-foreground">Empresa</p>
              <p className="font-medium">{quotation.company}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Fecha</p>
            <p className="font-medium">
              {new Date(quotation.created_at).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {quotation.message && (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1">Mensaje</p>
            <p className="bg-muted p-3 rounded-lg">{quotation.message}</p>
          </div>
        )}

        <Separator />

        {/* Customer approve/reject buttons */}
        {canApproveReject && (
          <div className="flex gap-3">
            <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700">
              <ThumbsUp className="h-4 w-4 mr-2" />
              Aprobar Cotización
            </Button>
            <Button onClick={handleReject} variant="destructive" className="flex-1">
              <ThumbsDown className="h-4 w-4 mr-2" />
              Rechazar Cotización
            </Button>
          </div>
        )}

        {/* Staff status change */}
        {isStaff && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Cambiar estado</p>
              <Select
                value={newStatus || quotation.status || "pending"}
                onValueChange={(v) => setNewStatus(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              disabled={!newStatus || newStatus === quotation.status}
              onClick={() => newStatus && handleStatusChange(newStatus)}
            >
              Actualizar
            </Button>
          </div>
        )}

        <Separator />

        {/* Add note */}
        <div>
          <p className="text-sm font-medium mb-2">Agregar nota</p>
          <div className="flex gap-2">
            <Textarea
              placeholder="Escribí una nota de seguimiento..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[60px]"
            />
            <Button
              size="icon"
              onClick={handleAddNote}
              disabled={!newNote.trim() || addHistoryMutation.isPending}
              className="shrink-0 self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* History Timeline */}
        <div>
          <p className="text-sm font-medium mb-3">Historial de seguimiento</p>
          {historyLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : history && history.length > 0 ? (
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="flex gap-3 text-sm">
                  <div className="mt-0.5 shrink-0">{getActionIcon(entry.action)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{getUserName(entry.user_id)}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString("es-AR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{getActionLabel(entry)}</p>
                    {entry.note && (
                      <p className="bg-muted p-2 rounded mt-1">{entry.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin historial de seguimiento aún
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationDetailDialog;
