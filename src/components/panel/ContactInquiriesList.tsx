import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Mail, Phone, Clock, MessageSquare, Send, Loader2, CheckCircle, AlertCircle, User, Archive, ArchiveRestore, Trash2, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string | null;
  reply: string | null;
  replied_at: string | null;
  replied_by: string | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean | null;
}

interface ContactInquiriesListProps {
  searchTerm?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  in_progress: { label: "En Proceso", variant: "default" },
  replied: { label: "Respondido", variant: "outline" },
  closed: { label: "Cerrado", variant: "destructive" },
};

const ContactInquiriesList = ({ searchTerm = "" }: ContactInquiriesListProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<string | null>(null);

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["contact-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContactInquiry[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("contact_inquiries")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      toast.success("Estado actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar el estado");
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ inquiry, reply }: { inquiry: ContactInquiry; reply: string }) => {
      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke("send-contact-reply", {
        body: {
          to_email: inquiry.email,
          to_name: inquiry.name,
          original_message: inquiry.message,
          reply_message: reply,
        },
      });

      if (emailError) {
        // Silent fail in production - don't expose internal errors
        if (import.meta.env.DEV) {
          console.error("Email error:", emailError);
        }
        // Continue even if email fails - we'll still save the reply
      }

      // Update the inquiry with the reply
      const { error } = await supabase
        .from("contact_inquiries")
        .update({
          reply,
          replied_at: new Date().toISOString(),
          replied_by: user?.id,
          status: "replied",
          updated_at: new Date().toISOString(),
        })
        .eq("id", inquiry.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      setIsReplyDialogOpen(false);
      setReplyText("");
      setSelectedInquiry(null);
      toast.success("Respuesta enviada correctamente");
    },
    onError: () => {
      toast.error("Error al enviar la respuesta");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from("contact_inquiries")
        .update({ is_archived: archived, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { archived }) => {
      queryClient.invalidateQueries({ queryKey: ["contact-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      toast.success(archived ? "Consulta archivada" : "Consulta restaurada");
    },
    onError: () => {
      toast.error("Error al archivar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_inquiries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      setDeleteDialogOpen(false);
      setInquiryToDelete(null);
      toast.success("Consulta eliminada");
    },
    onError: () => {
      toast.error("Error al eliminar");
    },
  });

  const handleReply = (inquiry: ContactInquiry) => {
    setSelectedInquiry(inquiry);
    setReplyText(inquiry.reply || "");
    setIsReplyDialogOpen(true);
  };

  const handleSendReply = () => {
    if (!selectedInquiry || !replyText.trim()) return;
    sendReplyMutation.mutate({ inquiry: selectedInquiry, reply: replyText.trim() });
  };

  const handleDelete = (id: string) => {
    setInquiryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (inquiryToDelete) {
      deleteMutation.mutate(inquiryToDelete);
    }
  };

  const filteredInquiries = inquiries?.filter((inquiry) => {
    const matchesSearch =
      inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || inquiry.status === statusFilter;
    const matchesArchived = showArchived ? inquiry.is_archived : !inquiry.is_archived;

    return matchesSearch && matchesStatus && matchesArchived;
  });

  const pendingCount = inquiries?.filter((i) => i.status === "pending").length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold">
              {showArchived ? "Consultas Archivadas" : "Consultas de Contacto"}
            </h3>
            {!showArchived && pendingCount > 0 && (
              <Badge variant="destructive" className="animate-pulse text-xs">
                {pendingCount} nuevas
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="in_progress">En Proceso</SelectItem>
                <SelectItem value="replied">Respondidos</SelectItem>
                <SelectItem value="closed">Cerrados</SelectItem>
              </SelectContent>
            </Select>
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
        </div>

      {filteredInquiries?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay consultas de contacto</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredInquiries?.map((inquiry) => (
            <Card key={inquiry.id} className={inquiry.status === "pending" ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{inquiry.name}</CardTitle>
                      <Badge variant={statusConfig[inquiry.status || "pending"]?.variant || "secondary"}>
                        {statusConfig[inquiry.status || "pending"]?.label || "Pendiente"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <a href={`mailto:${inquiry.email}`} className="flex items-center gap-1 hover:text-primary">
                        <Mail className="h-3 w-3" />
                        {inquiry.email}
                      </a>
                      {inquiry.phone && (
                        <a href={`tel:${inquiry.phone}`} className="flex items-center gap-1 hover:text-primary">
                          <Phone className="h-3 w-3" />
                          {inquiry.phone}
                        </a>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(inquiry.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Mensaje:</p>
                  <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
                </div>

                {inquiry.reply && (
                  <div className="bg-primary/10 rounded-lg p-3 border-l-4 border-primary">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-primary">Respuesta enviada</p>
                      {inquiry.replied_at && (
                        <span className="text-xs text-muted-foreground">
                          - {format(new Date(inquiry.replied_at), "dd MMM yyyy, HH:mm", { locale: es })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{inquiry.reply}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Select
                    value={inquiry.status || "pending"}
                    onValueChange={(value) => updateStatusMutation.mutate({ id: inquiry.id, status: value })}
                  >
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="in_progress">En Proceso</SelectItem>
                      <SelectItem value="replied">Respondido</SelectItem>
                      <SelectItem value="closed">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" onClick={() => handleReply(inquiry)} className="flex-1 sm:flex-none">
                    <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{inquiry.reply ? "Ver/Editar Respuesta" : "Responder"}</span>
                    <span className="sm:hidden">{inquiry.reply ? "Respuesta" : "Responder"}</span>
                  </Button>

                  <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                    <a href={`mailto:${inquiry.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email Directo
                    </a>
                  </Button>

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
                            id: inquiry.id,
                            archived: !inquiry.is_archived,
                          })
                        }
                      >
                        {inquiry.is_archived ? (
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
                        onClick={() => handleDelete(inquiry.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Consulta</DialogTitle>
            <DialogDescription>
              Responder a {selectedInquiry?.name} ({selectedInquiry?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium text-muted-foreground mb-1">Mensaje original:</p>
              <p className="text-sm whitespace-pre-wrap">{selectedInquiry?.message}</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tu respuesta:</label>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                rows={6}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {replyText.length}/5000 caracteres
              </p>
            </div>

            {selectedInquiry?.reply && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                <AlertCircle className="h-4 w-4" />
                Esta consulta ya tiene una respuesta. Editarla enviará una nueva notificación.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={!replyText.trim() || sendReplyMutation.isPending}
            >
              {sendReplyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Respuesta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar consulta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La consulta será eliminada permanentemente.
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
    </div>
    </>
  );
};

export default ContactInquiriesList;