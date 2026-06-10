import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Package, ShoppingCart, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";

interface Part {
  id: string;
  name: string;
  code: string;
  price: number | null;
  stock: number;
  image_url: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface Props {
  part: Part;
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SparePartStoreDetail = ({ part, category, open, onOpenChange }: Props) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { addItem, openCart } = useCart();
  const [showForm, setShowForm] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("quotations").insert({
        customer_id: user.id,
        client_name: profile.full_name,
        client_email: profile.email,
        client_phone: profile.phone || null,
        company: profile.company || null,
        quotation_type: "quote",
        spare_part_id: part.id,
        spare_part_quantity: quantity,
        message: message.trim() || `Solicitud de repuesto: ${part.name} (${part.code}) x${quantity}`,
        status: "pending",
      });
      if (error) throw error;
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["customer-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Solicitud enviada correctamente");
    } catch (e: any) {
      console.error("Error creating spare part quotation:", e);
      toast.error(e?.message || "Error al enviar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      setShowForm(false);
      setSubmitted(false);
      setQuantity(1);
      setMessage("");
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{part.name}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cód: {part.code}
          </DialogDescription>
        </DialogHeader>

        {/* Image */}
        <div className="w-full h-56 sm:h-64 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {part.image_url ? (
            <img src={part.image_url} alt={part.name} className="max-w-full max-h-full object-contain" />
          ) : (
            <Package className="h-20 w-20 text-gray-300" />
          )}
        </div>

        {/* Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {category && (
              <Badge
                className="border"
                style={{
                  backgroundColor: (category.color || "#6b7280") + "18",
                  color: category.color || "#6b7280",
                  borderColor: (category.color || "#6b7280") + "40",
                }}
              >
                {category.name}
              </Badge>
            )}
            {part.stock > 0 ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>
                Disponible
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
                Sin stock
              </span>
            )}
          </div>

          {part.price != null && (
            <p className="text-2xl font-bold" style={{ color: "#16a34a" }}>
              ${part.price.toLocaleString("es-AR")}
            </p>
          )}
        </div>

        {/* Quote form or button */}
        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center space-y-2">
            <CheckCircle className="h-8 w-8 mx-auto" style={{ color: "#16a34a" }} />
            <p className="font-semibold text-sm" style={{ color: "#16a34a" }}>
              ¡Solicitud enviada!
            </p>
            <p className="text-xs text-muted-foreground">
              Podés ver el estado en "Mis Solicitudes"
            </p>
          </div>
        ) : showForm ? (
          <div className="space-y-3 border-t pt-3">
            <div>
              <Label className="text-xs font-medium">Repuesto</Label>
              <Input value={`${part.name} (${part.code})`} disabled className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium">Cantidad</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Mensaje / Consulta (opcional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Dejá tu consulta o comentario..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: "#16a34a" }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enviar solicitud
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={part.stock <= 0}
              onClick={() => {
                addItem({
                  type: "spare",
                  id: part.id,
                  name: part.name,
                  code: part.code,
                  price: part.price ?? null,
                  image_url: part.image_url ?? null,
                  quantity,
                });
                toast.success(`${part.name} agregado al carrito`);
                onOpenChange(false);
                setTimeout(() => openCart(), 150);
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Agregar al carrito
            </Button>
            <Button
              className="flex-1 text-white"
              style={{ backgroundColor: "#16a34a" }}
              onClick={() => setShowForm(true)}
            >
              Solicitar sólo este
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SparePartStoreDetail;
