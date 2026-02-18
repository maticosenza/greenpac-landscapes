import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, KeyRound, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const changeEmailSchema = z.object({
  newEmail: z.string().trim().email("Ingresá un email válido").max(255, "Email demasiado largo"),
  confirmEmail: z.string().trim().email("Ingresá un email válido"),
}).refine((data) => data.newEmail === data.confirmEmail, {
  message: "Los emails no coinciden",
  path: ["confirmEmail"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountSettingsDialog = ({ open, onOpenChange }: AccountSettingsDialogProps) => {
  const { profile } = useAuth();
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const emailForm = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: "", confirmEmail: "" },
  });

  const handlePasswordSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmittingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    setIsSubmittingPassword(false);

    if (error) {
      if (error.message.includes("should be different")) {
        toast.error("La nueva contraseña debe ser diferente a la actual.");
      } else {
        toast.error("Error al cambiar la contraseña. Intentá de nuevo.");
      }
    } else {
      toast.success("¡Contraseña actualizada correctamente!");
      handleClose();
    }
  };

  const handleEmailSubmit = async (data: ChangeEmailFormData) => {
    if (data.newEmail === profile?.email) {
      toast.error("El nuevo email es igual al actual.");
      return;
    }

    setIsSubmittingEmail(true);

    const { error } = await supabase.auth.updateUser({
      email: data.newEmail,
    });

    setIsSubmittingEmail(false);

    if (error) {
      toast.error(error.message || "Error al cambiar el email. Intentá de nuevo.");
    } else {
      toast.success(
        "Se envió un email de confirmación al nuevo correo. Revisá tu bandeja de entrada y spam para confirmar el cambio.",
        { duration: 8000 }
      );
      handleClose();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      passwordForm.reset();
      emailForm.reset();
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración de cuenta</DialogTitle>
          <DialogDescription>
            Cambiá tu contraseña o tu dirección de email.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password" className="gap-2">
              <KeyRound className="h-4 w-4" />
              Contraseña
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="mt-4">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
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
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmittingPassword}>
                    {isSubmittingPassword ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="mr-2 h-4 w-4" />
                    )}
                    Cambiar contraseña
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="email" className="mt-4">
            <div className="mb-4 p-3 rounded-lg bg-muted text-sm">
              <p className="text-muted-foreground">
                Email actual: <strong className="text-foreground">{profile?.email}</strong>
              </p>
            </div>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="newEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuevo email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="nuevo@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailForm.control}
                  name="confirmEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="nuevo@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Se enviará un email de confirmación al nuevo correo para verificar la propiedad.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmittingEmail}>
                    {isSubmittingEmail ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    Cambiar email
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AccountSettingsDialog;
