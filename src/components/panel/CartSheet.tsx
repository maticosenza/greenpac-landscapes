import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Package, ShoppingCart, Loader2, CheckCircle, Minus, Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const CartSheet = () => {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clear } = useCart();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const productItems = items.filter((i) => i.type === "product");
  const spareItems = items.filter((i) => i.type === "spare");

  const totalEstimated = items.reduce(
    (acc, i) => acc + (i.price ?? 0) * i.quantity,
    0
  );

  const buildSummary = () => {
    const lines: string[] = [];
    if (productItems.length > 0) {
      lines.push("Maquinaria:");
      productItems.forEach((p) => {
        lines.push(`• ${p.name}${p.quantity > 1 ? ` x${p.quantity}` : ""}`);
      });
    }
    if (spareItems.length > 0) {
      if (lines.length) lines.push("");
      lines.push("Repuestos:");
      spareItems.forEach((s) => {
        lines.push(`• ${s.name}${s.code ? ` (Cód: ${s.code})` : ""} x${s.quantity}`);
      });
    }
    if (message.trim()) {
      lines.push("");
      lines.push("Mensaje del cliente:");
      lines.push(message.trim());
    }
    return lines.join("\n");
  };

  const handleSubmit = async () => {
    if (!user || !profile || items.length === 0) return;
    setSubmitting(true);
    try {
      const productIds = productItems.map((p) => p.id);
      const firstSpare = spareItems[0];
      const totalSpareQty = spareItems.reduce((acc, s) => acc + s.quantity, 0);

      const { error } = await supabase.from("quotations").insert({
        customer_id: user.id,
        client_name: profile.full_name,
        client_email: profile.email,
        client_phone: profile.phone || null,
        company: profile.company || null,
        quotation_type: "quote",
        product_ids: productIds.length > 0 ? productIds : null,
        spare_part_id: firstSpare?.id ?? null,
        spare_part_quantity: firstSpare ? totalSpareQty : null,
        message: buildSummary(),
        status: "pending",
      });
      if (error) throw error;

      setSubmitted(true);
      clear();
      queryClient.invalidateQueries({ queryKey: ["customer-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Solicitud enviada correctamente");
    } catch (e: any) {
      console.error("Error creating cart quotation:", e);
      toast.error(e?.message || "Error al enviar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      closeCart();
      if (submitted) {
        setSubmitted(false);
        setMessage("");
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" style={{ color: "#16a34a" }} />
            Carrito de cotización
          </SheetTitle>
          <SheetDescription>
            {items.length === 0
              ? "Tu carrito está vacío"
              : `${items.length} producto${items.length !== 1 ? "s" : ""} seleccionado${items.length !== 1 ? "s" : ""}`}
          </SheetDescription>
        </SheetHeader>

        {submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <CheckCircle className="h-12 w-12" style={{ color: "#16a34a" }} />
            <p className="font-semibold" style={{ color: "#16a34a" }}>
              ¡Solicitud enviada!
            </p>
            <p className="text-sm text-muted-foreground">
              Podés ver el estado en "Mis Solicitudes"
            </p>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cerrar
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Agregá productos o repuestos al carrito para pedir una cotización conjunta.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex gap-3 border rounded-lg p-3 bg-white"
                >
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-7 w-7 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                          {item.type === "product" ? "Maquinaria" : "Repuesto"}
                        </p>
                        <p className="text-sm font-semibold leading-tight line-clamp-2">{item.name}</p>
                        {item.code && (
                          <p className="text-[11px] text-muted-foreground">Cód: {item.code}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.type, item.id)}
                        className="text-muted-foreground hover:text-red-600 transition-colors"
                        aria-label="Quitar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.type, item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.type, item.id, parseInt(e.target.value) || 1)
                          }
                          className="h-6 w-12 text-center px-1 text-xs"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.type, item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      {item.price != null ? (
                        <p className="text-sm font-semibold" style={{ color: "#16a34a" }}>
                          ${(item.price * item.quantity).toLocaleString("es-AR")}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">A consultar</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-5 space-y-3 bg-white">
              {totalEstimated > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total estimado</span>
                  <span className="font-bold" style={{ color: "#16a34a" }}>
                    ${totalEstimated.toLocaleString("es-AR")}
                  </span>
                </div>
              )}
              <div>
                <Label className="text-xs font-medium">Mensaje (opcional)</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Agregá detalles, consultas o aclaraciones..."
                  rows={3}
                  className="mt-1 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={clear}>
                  Vaciar
                </Button>
                <Button
                  className="flex-1 text-white"
                  style={{ backgroundColor: "#16a34a" }}
                  onClick={handleSubmit}
                  disabled={submitting || !user}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Pedir cotización
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;