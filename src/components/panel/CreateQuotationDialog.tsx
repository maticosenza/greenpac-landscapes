import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateQuotationPDFBase64 } from "@/lib/generateQuotationPDF";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import FileUploadField from "./FileUploadField";
import { ARGENTINA_PROVINCES } from "@/lib/argentinaProvinces";

interface CreateQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quotationSchema = z.object({
  client_name: z.string().min(2, "El nombre es requerido"),
  client_email: z.string().email("Email inválido"),
  client_phone: z.string().optional(),
  company: z.string().optional(),
  province: z.string().min(1, "La provincia es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  address_formatted: z.string().optional(),
  product_ids: z.array(z.string()).min(1, "Seleccioná al menos un producto"),
  quotation_type: z.enum(["quote", "purchase", "deposit"]),
  message: z.string().optional(),
  price: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

const CreateQuotationDialog = ({ open, onOpenChange }: CreateQuotationDialogProps) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [attachments, setAttachments] = useState<string[]>([]);
  const { data: products } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("sort_order");

      if (error) throw error;
      return data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers-for-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      client_name: "",
      client_email: "",
      client_phone: "",
      company: "",
      province: "",
      city: "",
      address_formatted: "",
      product_ids: [],
      quotation_type: "quote",
      message: "",
      price: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      const existingCustomer = customers?.find((c) => c.email === data.client_email);
      const priceVal = data.price ? parseFloat(data.price) : null;

      const addressFull = [data.address_formatted, data.city, data.province].filter(Boolean).join(", ");

      const { data: inserted, error } = await supabase.from("quotations").insert({
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone || null,
        company: data.company || null,
        province: data.province || null,
        city: data.city || null,
        address_formatted: addressFull || null,
        product_ids: data.product_ids,
        quotation_type: data.quotation_type,
        message: data.message || null,
        customer_id: existingCustomer?.id || null,
        created_by_employee_id: user?.id,
        status: "pending",
        attachments: attachments,
        price: priceVal,
      }).select("id, created_at").single();

      if (error) throw error;

      // Get selected product details for PDF and email
      const selectedProductsFull = products?.filter(p => data.product_ids.includes(p.id)) || [];
      const selectedProductNames = selectedProductsFull.map(p => p.name);

      // Generate PDF as base64
      let pdfBase64: string | null = null;
      try {
        const { data: productDetails } = await supabase
          .from("products")
          .select("id, name, description, price")
          .in("id", data.product_ids);

        pdfBase64 = await generateQuotationPDFBase64(
          {
            id: inserted.id,
            client_name: data.client_name,
            client_email: data.client_email,
            client_phone: data.client_phone || null,
            company: data.company || null,
            quotation_type: data.quotation_type,
            status: "pending",
            message: data.message || null,
            price: priceVal,
            created_at: inserted.created_at,
            province: data.province || null,
            city: data.city || null,
            address_formatted: addressFull || null,
          },
          (productDetails || []).map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
          }))
        );
      } catch (pdfError) {
        console.error("Error generating PDF:", pdfError);
      }

      // Send email notification with PDF
      try {
        await supabase.functions.invoke("send-quotation-notification", {
          body: {
            client_name: data.client_name,
            client_email: data.client_email,
            client_phone: data.client_phone,
            company: data.company,
            quotation_type: data.quotation_type,
            products: selectedProductNames,
            message: data.message,
            created_by_employee: profile?.full_name,
            price: priceVal,
            site_url: window.location.origin,
            pdf_base64: pdfBase64,
            quotation_id: inserted.id,
          },
        });
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      toast.success("Cotización creada exitosamente");
      form.reset();
      setAttachments([]);
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Error al crear la cotización");
    },
  });

  const onSubmit = (data: QuotationFormData) => {
    createMutation.mutate(data);
  };

  const quotationTypes = [
    { value: "quote", label: "Cotización" },
    { value: "purchase", label: "Compra directa" },
    { value: "deposit", label: "Seña / Reserva" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Cotización</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del cliente *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="juan@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+54 9 11 1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ARGENTINA_PROVINCES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad / Localidad *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Rosario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address_formatted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección (calle y número)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Av. San Martín 1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quotation_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de solicitud *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {quotationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="product_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Productos *</FormLabel>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {products?.map((product) => (
                      <FormField
                        key={product.id}
                        control={form.control}
                        name="product_ids"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(product.id)}
                                onCheckedChange={(checked) => {
                                  const updated = checked
                                    ? [...field.value, product.id]
                                    : field.value.filter((id) => id !== product.id);
                                  field.onChange(updated);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {product.name}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio (ARS)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles de la cotización..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="mb-2 block">Archivos adjuntos</FormLabel>
              <FileUploadField
                files={attachments}
                onFilesChange={setAttachments}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Cotización
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuotationDialog;
