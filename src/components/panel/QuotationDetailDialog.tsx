import { useState, useRef, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Send,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  FileText,
  X,
  Loader2,
  Download,
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

interface ChatMessage {
  id: string;
  quotation_id: string;
  user_id: string;
  message: string;
  attachments: string[] | null;
  is_from_staff: boolean;
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

const getStatusLabel = (status: string | null) =>
  statusOptions.find((o) => o.value === status)?.label || "Pendiente";

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case "pending": return <Badge variant="secondary">Pendiente</Badge>;
    case "contacted": return <Badge className="bg-blue-500 text-white">Contactado</Badge>;
    case "approved": return <Badge className="bg-green-600 text-white">Aprobada</Badge>;
    case "rejected": return <Badge variant="destructive">Rechazada</Badge>;
    case "completed": return <Badge className="bg-primary text-primary-foreground">Completado</Badge>;
    case "cancelled": return <Badge variant="destructive">Cancelado</Badge>;
    default: return <Badge variant="secondary">Pendiente</Badge>;
  }
};

const getTypeBadge = (type: string | null) => {
  switch (type) {
    case "quote": return <Badge variant="outline">Cotización</Badge>;
    case "purchase": return <Badge variant="outline">Compra</Badge>;
    case "deposit": return <Badge variant="outline">Seña</Badge>;
    default: return <Badge variant="outline">Consulta</Badge>;
  }
};

const getActionIcon = (action: string) => {
  switch (action) {
    case "status_change": return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
    case "note": return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    case "approved": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "rejected": return <XCircle className="h-4 w-4 text-destructive" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActionLabel = (entry: HistoryEntry) => {
  switch (entry.action) {
    case "status_change": return `Estado cambiado de "${getStatusLabel(entry.old_status)}" a "${getStatusLabel(entry.new_status)}"`;
    case "note": return "Nota agregada";
    case "approved": return "Cotización aprobada por el cliente";
    case "rejected": return "Cotización rechazada por el cliente";
    default: return entry.action;
  }
};

const QuotationDetailDialog = ({
  quotationId,
  open,
  onOpenChange,
  isStaff = false,
}: QuotationDetailDialogProps) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatAttachments, setChatAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const { data: messages } = useQuery({
    queryKey: ["quotation-messages", quotationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_messages")
        .select("*")
        .eq("quotation_id", quotationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!quotationId && open,
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Realtime subscription for messages
  useEffect(() => {
    if (!quotationId || !open) return;
    const channel = supabase
      .channel(`quotation-chat-${quotationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "quotation_messages",
        filter: `quotation_id=eq.${quotationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["quotation-messages", quotationId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [quotationId, open, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getUserName = (userId: string) =>
    profiles?.find((p) => p.id === userId)?.full_name || "Usuario";

  const addHistoryMutation = useMutation({
    mutationFn: async (entry: { action: string; note?: string; old_status?: string; new_status?: string }) => {
      const { error: histError } = await supabase.from("quotation_history").insert({
        quotation_id: quotationId!,
        user_id: user!.id,
        action: entry.action,
        note: entry.note || null,
        old_status: entry.old_status || null,
        new_status: entry.new_status || null,
      });
      if (histError) throw histError;

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
    onError: () => toast.error("Error al actualizar el historial"),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, attachments }: { message: string; attachments: string[] }) => {
      const { error } = await supabase.from("quotation_messages").insert({
        quotation_id: quotationId!,
        user_id: user!.id,
        message,
        attachments,
        is_from_staff: isStaff,
      });
      if (error) throw error;

      // Send email notification (fire and forget)
      try {
        if (isStaff && quotation) {
          // Notify client
          await supabase.functions.invoke("send-chat-notification", {
            body: {
              recipient_email: quotation.client_email,
              recipient_name: quotation.client_name,
              sender_name: profile?.full_name || "Staff",
              message,
              quotation_client_name: quotation.client_name,
              is_to_client: true,
            },
          });
        } else if (quotation) {
          // Notify admin
          await supabase.functions.invoke("send-chat-notification", {
            body: {
              recipient_email: "cosenzamati@gmail.com",
              recipient_name: "Administrador",
              sender_name: quotation.client_name,
              message,
              quotation_client_name: quotation.client_name,
              is_to_client: false,
            },
          });
        }
      } catch (e) {
        console.error("Email notification error:", e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation-messages", quotationId] });
      setChatMessage("");
      setChatAttachments([]);
    },
    onError: () => toast.error("Error al enviar mensaje"),
  });

  const handleSendMessage = () => {
    if (!chatMessage.trim() && chatAttachments.length === 0) return;
    sendMessageMutation.mutate({ message: chatMessage.trim(), attachments: chatAttachments });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploaded: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} excede 10MB`);
          continue;
        }
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `chat/${fileName}`;

        const { error } = await supabase.storage.from("quotation-attachments").upload(filePath, file);
        if (error) {
          toast.error(`Error al subir ${file.name}`);
          continue;
        }
        uploaded.push(filePath);
      }

      if (uploaded.length > 0) {
        setChatAttachments((prev) => [...prev, ...uploaded]);
        toast.success(`${uploaded.length} archivo(s) adjuntado(s)`);
      }
    } catch {
      toast.error("Error al subir archivos");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = async (filePath: string) => {
    await supabase.storage.from("quotation-attachments").remove([filePath]);
    setChatAttachments((prev) => prev.filter((f) => f !== filePath));
  };

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage.from("quotation-attachments").getPublicUrl(path);
    return data.publicUrl;
  };

  const getFileName = (path: string) => {
    const parts = path.split("/");
    const name = parts[parts.length - 1];
    return name.replace(/^\d+-[a-z0-9]+\./, "archivo.");
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addHistoryMutation.mutate({ action: "note", note: newNote.trim() });
  };

  const handleStatusChange = (status: string) => {
    if (!quotation) return;
    addHistoryMutation.mutate({ action: "status_change", old_status: quotation.status, new_status: status });
  };

  const handleApprove = () => {
    addHistoryMutation.mutate({ action: "approved", old_status: quotation?.status, new_status: "approved", note: "El cliente aprobó la cotización" });
  };

  const handleReject = () => {
    addHistoryMutation.mutate({ action: "rejected", old_status: quotation?.status, new_status: "rejected", note: "El cliente rechazó la cotización" });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap text-base sm:text-lg">
            Detalle de Cotización
            {getTypeBadge(quotation.quotation_type)}
            {getStatusBadge(quotation.status)}
          </DialogTitle>
        </DialogHeader>

        {/* Quotation Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Cliente</p>
            <p className="font-medium">{quotation.client_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="font-medium break-all">{quotation.client_email}</p>
          </div>
          {quotation.client_phone && (
            <div>
              <p className="text-muted-foreground text-xs">Teléfono</p>
              <p className="font-medium">{quotation.client_phone}</p>
            </div>
          )}
          {quotation.company && (
            <div>
              <p className="text-muted-foreground text-xs">Empresa</p>
              <p className="font-medium">{quotation.company}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-xs">Fecha</p>
            <p className="font-medium">
              {new Date(quotation.created_at).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {quotation.message && (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1 text-xs">Mensaje</p>
            <p className="bg-muted p-3 rounded-lg text-sm">{quotation.message}</p>
          </div>
        )}

        {/* Existing attachments */}
        {quotation.attachments && quotation.attachments.length > 0 && (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1 text-xs">Archivos adjuntos</p>
            <div className="flex flex-wrap gap-2">
              {quotation.attachments.map((att, i) => (
                <a key={i} href={getFileUrl(att)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-md text-xs hover:bg-muted/80 transition-colors">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate">{getFileName(att)}</span>
                  <Download className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Customer approve/reject */}
        {canApproveReject && (
          <div className="flex gap-2">
            <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
              <ThumbsUp className="h-4 w-4 mr-1.5" />
              Aprobar
            </Button>
            <Button onClick={handleReject} variant="destructive" className="flex-1" size="sm">
              <ThumbsDown className="h-4 w-4 mr-1.5" />
              Rechazar
            </Button>
          </div>
        )}

        {/* Staff status change */}
        {isStaff && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Cambiar estado</p>
              <Select value={newStatus || quotation.status || "pending"} onValueChange={setNewStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" disabled={!newStatus || newStatus === quotation.status} onClick={() => newStatus && handleStatusChange(newStatus)}>
              Actualizar
            </Button>
          </div>
        )}

        <Separator />

        {/* Tabs: Chat and History */}
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="text-xs sm:text-sm">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-3">
            <div className="border rounded-lg flex flex-col" style={{ height: "300px" }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages && messages.length > 0 ? (
                  messages.map((msg) => {
                    const isOwn = msg.user_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[85%] rounded-lg p-2.5 text-sm ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <p className="font-medium text-xs opacity-75 mb-0.5">{getUserName(msg.user_id)}</p>
                          {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {msg.attachments.map((att, i) => (
                                <a key={i} href={getFileUrl(att)} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-xs underline opacity-90 hover:opacity-100">
                                  <FileText className="h-3 w-3" />
                                  {getFileName(att)}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                          {new Date(msg.created_at).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay mensajes aún. ¡Iniciá la conversación!</p>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Attachment preview */}
              {chatAttachments.length > 0 && (
                <div className="px-3 pt-1 flex flex-wrap gap-1.5 border-t">
                  {chatAttachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                      <FileText className="h-3 w-3" />
                      <span className="max-w-[100px] truncate">{getFileName(att)}</span>
                      <button type="button" onClick={() => removeAttachment(att)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input area */}
              <div className="border-t p-2 flex gap-1.5 items-end">
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" multiple onChange={handleFileUpload} className="hidden" />
                <Button type="button" variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                </Button>
                <Textarea
                  placeholder="Escribí un mensaje..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="min-h-[36px] max-h-[80px] text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button size="icon" className="shrink-0 h-8 w-8" onClick={handleSendMessage}
                  disabled={(!chatMessage.trim() && chatAttachments.length === 0) || sendMessageMutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-3">
            {/* Add note */}
            {(isStaff || quotation.customer_id === user?.id) && (
              <div className="mb-4">
                <p className="text-xs font-medium mb-1.5">Agregar nota</p>
                <div className="flex gap-2">
                  <Textarea placeholder="Nota de seguimiento..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="min-h-[50px] text-sm" />
                  <Button size="icon" onClick={handleAddNote} disabled={!newNote.trim() || addHistoryMutation.isPending} className="shrink-0 self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {historyLoading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : history && history.length > 0 ? (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div key={entry.id} className="flex gap-2.5 text-sm">
                    <div className="mt-0.5 shrink-0">{getActionIcon(entry.action)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-xs">{getUserName(entry.user_id)}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{getActionLabel(entry)}</p>
                      {entry.note && <p className="bg-muted p-2 rounded mt-1 text-xs">{entry.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin historial de seguimiento aún</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationDetailDialog;
