import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle2, Loader2, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { useAuth } from "@/hooks/useAuth";

interface Product {
  id: string;
  name: string;
}

const quotationSchema = z.object({
  client_name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre es demasiado largo"),
  client_email: z.string().trim().email("Ingresá un email válido").max(255, "El email es demasiado largo"),
  client_phone: z.string().trim().max(50, "El teléfono es demasiado largo").optional(),
  company: z.string().trim().max(100, "El nombre de la empresa es demasiado largo").optional(),
  product_ids: z.array(z.string()).min(1, "Seleccioná al menos un producto"),
  quotation_type: z.enum(["quote", "purchase", "deposit"]),
  message: z.string().trim().max(1000, "El mensaje es demasiado largo").optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

const QuotationForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: products } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("sort_order");

      if (error) throw error;
      return data as Product[];
    },
  });

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      client_name: profile?.full_name || "",
      client_email: profile?.email || "",
      client_phone: profile?.phone || "",
      company: profile?.company || "",
      product_ids: [],
      quotation_type: "quote",
      message: "",
    },
  });

  // Update form values when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        client_name: profile.full_name || "",
        client_email: profile.email || "",
        client_phone: profile.phone || "",
        company: profile.company || "",
        product_ids: form.getValues("product_ids"),
        quotation_type: form.getValues("quotation_type"),
        message: form.getValues("message"),
      });
    }
  }, [profile, form]);

  const mutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      if (!user) {
        throw new Error("Debés iniciar sesión para enviar una cotización");
      }

      // Insert quotation with authenticated user's ID
      const { error } = await supabase.from("quotations").insert({
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone || null,
        company: data.company || null,
        product_ids: data.product_ids,
        quotation_type: data.quotation_type,
        message: data.message || null,
        customer_id: user.id, // Always use authenticated user's ID
      });

      if (error) throw error;

      // Get product names for email notification
      const selectedProducts = products?.filter(p => data.product_ids.includes(p.id)).map(p => p.name) || [];

      // Send email notification (fire and forget - don't block on errors)
      try {
        await supabase.functions.invoke("send-quotation-notification", {
          body: {
            client_name: data.client_name,
            client_email: data.client_email,
            client_phone: data.client_phone,
            company: data.company,
            quotation_type: data.quotation_type,
            products: selectedProducts,
            message: data.message,
          },
        });
      } catch (emailError) {
        // Silent fail in production - don't expose internal errors
        if (import.meta.env.DEV) {
          console.error("Error sending email notification:", emailError);
        }
        // Don't throw - email failure shouldn't block quotation submission
      }
    },
    onSuccess: () => {
      setSubmitted(true);
      form.reset();
    },
    onError: () => {
      toast.error("Error al enviar la cotización. Intentá nuevamente.");
    },
  });

  const onSubmit = (data: QuotationFormData) => {
    mutation.mutate(data);
  };

  const quotationTypes = [
    { value: "quote", label: "Solo cotización" },
    { value: "purchase", label: "Compra directa" },
    { value: "deposit", label: "Seña / Reserva" },
  ];

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="bg-card rounded-xl p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="bg-card rounded-xl p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        <LogIn className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="font-display text-2xl font-bold text-foreground mb-2">
          Iniciá sesión para cotizar
        </h3>
        <p className="text-muted-foreground mb-6">
          Para solicitar una cotización, primero debés registrarte o iniciar sesión en tu cuenta.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate("/auth")} size="lg">
            <LogIn className="mr-2 h-5 w-5" />
            Iniciar Sesión
          </Button>
          <Button variant="outline" onClick={() => navigate("/auth")} size="lg">
            Crear Cuenta
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-card rounded-xl p-8 text-center animate-scale-in" style={{ boxShadow: "var(--shadow-card)" }}>
        <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="font-display text-2xl font-bold text-foreground mb-2">
          ¡Solicitud Enviada!
        </h3>
        <p className="text-muted-foreground mb-6">
          Recibimos tu solicitud. Nos pondremos en contacto a la brevedad.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Enviar otra consulta
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-8" style={{ boxShadow: "var(--shadow-card)" }}>
      <h3 className="font-display text-2xl font-bold text-foreground mb-6">
        Solicitar Cotización
      </h3>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo *</FormLabel>
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
                    <Input type="email" placeholder="juan@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
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
                    <Input placeholder="Nombre de tu empresa" {...field} />
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
                      <SelectValue placeholder="Seleccioná una opción" />
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
                <FormLabel>Productos de interés *</FormLabel>
                <div className="flex flex-col gap-3 mt-2">
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
                          <FormLabel className="text-sm font-normal cursor-pointer">
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
                <FormLabel>Mensaje adicional</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Contanos más sobre lo que necesitás..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Enviar Solicitud
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default QuotationForm;
