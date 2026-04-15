import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, KeyRound, Mail, User } from "lucide-react";
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
import { useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  phone: z.string().trim().max(30, "Teléfono demasiado largo").optional().or(z.literal("")),
  company: z.string().trim().max(100, "Empresa demasiado larga").optional().or(z.literal("")),
});

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

type ProfileFormData = z.infer<typeof profileSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountSettingsDialog = ({ open, onOpenChange }: AccountSettingsDialogProps) => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      company: profile?.company || "",
    },
  });

  // Sync form when profile loads/changes
  useEffect(() => {
    if (profile && open) {
      profileForm.reset({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        company: profile.company || "",
      });
    }
  }, [profile, open]);

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const emailForm = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: "", confirmEmail: "" },
  });

  const handleProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setIsSubmittingProfile(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        company: data.company || null,
      })
      .eq("id", user.id);

    setIsSubmittingProfile(false);

    if (error) {
      toast.error("Error al actualizar el perfil. Intentá de nuevo.");
    } else {
      toast.success("¡Perfil actualizado correctamente!");
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    }
  };

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
            Editá tu perfil, contraseña o email.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
              <span className="sm:hidden">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-1.5 text-xs sm:text-sm">
              <KeyRound className="h-4 w-4" />
              <span className="hidden sm:inline">Contraseña</span>
              <span className="sm:hidden">Clave</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1.5 text-xs sm:text-sm">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-4">
            <div className="mb-4 p-3 rounded-lg bg-muted text-sm">
              <p className="text-muted-foreground">
                Email: <strong className="text-foreground">{profile?.email}</strong>
              </p>
            </div>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="+54 9 ..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de tu empresa (opcional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmittingProfile}>
                    {isSubmittingProfile ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <User className="mr-2 h-4 w-4" />
                    )}
                    Guardar
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* Password Tab */}
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

          {/* Email Tab */}
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
