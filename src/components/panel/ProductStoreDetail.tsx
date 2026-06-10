import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Package, ShoppingCart, Loader2, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string | null;
  image_url: string | null;
  images: string[] | null;
  features: string[] | null;
  price: number | null;
}

interface Props {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductStoreDetail = ({ product, open, onOpenChange }: Props) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { addItem, openCart } = useCart();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const allImages = [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.images || []),
  ].filter((v, i, a) => a.indexOf(v) === i);

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
        product_ids: [product.id],
        message: message.trim() || `Solicitud de cotización: ${product.name}`,
        status: "pending",
      });
      if (error) throw error;
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["customer-quotations"] });
      toast.success("Solicitud enviada correctamente");
    } catch {
      toast.error("Error al enviar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      setShowForm(false);
      setSubmitted(false);
      setMessage("");
      setImageIndex(0);
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{product.name}</DialogTitle>
          {product.category && (
            <DialogDescription className="text-xs text-muted-foreground">
              {product.category}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Image gallery */}
        <div className="relative w-full h-56 sm:h-64 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {allImages.length > 0 ? (
            <>
              <img src={allImages[imageIndex]} alt={product.name} className="max-w-full max-h-full object-contain" />
              {allImages.length > 1 && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1"
                    onClick={() => setImageIndex((imageIndex - 1 + allImages.length) % allImages.length)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1"
                    onClick={() => setImageIndex((imageIndex + 1) % allImages.length)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {allImages.map((_, i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full ${i === imageIndex ? "bg-white" : "bg-white/50"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <Package className="h-20 w-20 text-gray-300" />
          )}
        </div>

        {/* Info */}
        <div className="space-y-3">
          {product.category && (
            <Badge variant="outline">{product.category}</Badge>
          )}
          <p className="text-sm text-muted-foreground">{product.description}</p>

          {product.features && product.features.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold">Características:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                {product.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {product.price != null && (
            <p className="text-2xl font-bold" style={{ color: "#16a34a" }}>
              ${product.price.toLocaleString("es-AR")}
            </p>
          )}
        </div>

        {/* Quote form */}
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
              onClick={() => {
                addItem({
                  type: "product",
                  id: product.id,
                  name: product.name,
                  price: product.price ?? null,
                  image_url: product.image_url ?? null,
                });
                toast.success(`${product.name} agregado al carrito`);
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

export default ProductStoreDetail;
