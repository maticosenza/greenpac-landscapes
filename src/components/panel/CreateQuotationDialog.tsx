import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

interface CreateQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quotationSchema = z.object({
  client_name: z.string().min(2, "El nombre es requerido"),
  client_email: z.string().email("Email inválido"),
  client_phone: z.string().optional(),
  company: z.string().optional(),
  product_ids: z.array(z.string()).min(1, "Seleccioná al menos un producto"),
  quotation_type: z.enum(["quote", "purchase", "deposit"]),
  message: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

const CreateQuotationDialog = ({ open, onOpenChange }: CreateQuotationDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
      product_ids: [],
      quotation_type: "quote",
      message: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      // Check if customer exists
      const existingCustomer = customers?.find((c) => c.email === data.client_email);

      const { error } = await supabase.from("quotations").insert({
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone || null,
        company: data.company || null,
        product_ids: data.product_ids,
        quotation_type: data.quotation_type,
        message: data.message || null,
        customer_id: existingCustomer?.id || null,
        created_by_employee_id: user?.id,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      toast.success("Cotización creada exitosamente");
      form.reset();
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
