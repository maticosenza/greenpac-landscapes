import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const createPasswordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type CreatePasswordFormData = z.infer<typeof createPasswordSchema>;

interface CreatePasswordDialogProps {
  open: boolean;
  onSuccess: () => void;
}

const CreatePasswordDialog = ({ open, onSuccess }: CreatePasswordDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreatePasswordFormData>({
    resolver: zodResolver(createPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleSubmit = async (data: CreatePasswordFormData) => {
    setIsSubmitting(true);

    // Step 1: Update password only (no metadata in same call to avoid auth restrictions)
    const { error: pwError } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (pwError) {
      console.error("Password update error:", pwError.message, pwError);
      setIsSubmitting(false);
      toast.error(`Error al crear la contraseña: ${pwError.message}`);
      return;
    }

    // Step 2: Clear the invited_role metadata so dialog won't re-appear on next login
    await supabase.auth.updateUser({
      data: { invited_role: null },
    });

    setIsSubmitting(false);
    toast.success("¡Contraseña creada correctamente!");
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Crear contraseña</DialogTitle>
          <DialogDescription>
            ¡Bienvenido! Creá tu contraseña para acceder a tu cuenta.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Crear contraseña
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePasswordDialog;
