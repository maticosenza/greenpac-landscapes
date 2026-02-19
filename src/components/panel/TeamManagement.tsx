import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { UserPlus, Shield, Trash2, Loader2, Search, Mail, ShieldPlus, Key, UserX, Pencil } from "lucide-react";
import { supabase as supabaseClient } from "@/integrations/supabase/client";

interface TeamManagementProps {
  searchTerm: string;
}

interface ProfileWithRoles {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  created_at: string;
  roles: string[];
}

type AppRole = "customer" | "employee" | "admin" | "vendedor";
type BadgeVariant = "destructive" | "default" | "secondary" | "outline";

const TOOL_LABELS: Record<string, string> = {
  products: "Productos",
  quotations: "Cotizaciones",
  clients: "Clientes",
  contact_inquiries: "Consultas de contacto",
  zonas: "Zonas",
};

const TeamManagement = ({ searchTerm }: TeamManagementProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("employee");
  const [confirmRemoveDialog, setConfirmRemoveDialog] = useState<{
    open: boolean;
    userId: string;
    role: string;
    userName: string;
  }>({ open: false, userId: "", role: "", userName: "" });

  // Invite dialogs
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("employee");
  const [isInviting, setIsInviting] = useState(false);

  // Permissions dialog
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [permissionsRole, setPermissionsRole] = useState<AppRole>("employee");
  const [editingPermissions, setEditingPermissions] = useState<Record<string, boolean>>({});
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Delete user dialog
  const [deleteUserDialog, setDeleteUserDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    userEmail: string;
  }>({ open: false, userId: "", userName: "", userEmail: "" });
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Edit user dialog
  const [editUserDialog, setEditUserDialog] = useState<{
    open: boolean;
    userId: string;
    full_name: string;
    phone: string;
    company: string;
  }>({ open: false, userId: "", full_name: "", phone: "", company: "" });
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Combine global search with local search
  const effectiveSearchTerm = localSearchTerm || searchTerm;

  const { data: usersWithRoles, isLoading } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles: ProfileWithRoles[] = profiles.map((profile) => ({
        ...profile,
        roles: roles
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role),
      }));

      return usersWithRoles;
    },
  });

  const { data: rolePermissions } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Rol asignado correctamente");
      setIsAddRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("El usuario ya tiene este rol");
      } else {
        toast.error("Error al asignar el rol");
      }
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Rol removido correctamente");
      setConfirmRemoveDialog({ open: false, userId: "", role: "", userName: "" });
    },
    onError: () => {
      toast.error("Error al remover el rol");
    },
  });

  const filteredUsers = usersWithRoles?.filter((u) => {
    const search = effectiveSearchTerm.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      (u.company && u.company.toLowerCase().includes(search))
    );
  });

  const teamMembers = filteredUsers?.filter(
    (u) => u.roles.includes("employee") || u.roles.includes("admin") || u.roles.includes("vendedor")
  );

  const getRoleBadgeVariant = (role: string): BadgeVariant => {
    switch (role) {
      case "admin":
        return "destructive";
      case "employee":
        return "default";
      case "vendedor":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "employee":
        return "Empleado";
      case "vendedor":
        return "Vendedor";
      case "customer":
        return "Cliente";
      default:
        return role;
    }
  };

  const handleAddRole = (userToAdd: ProfileWithRoles) => {
    setSelectedUser(userToAdd);
    setSelectedRole("employee");
    setIsAddRoleDialogOpen(true);
  };

  const handleConfirmAddRole = () => {
    if (selectedUser) {
      addRoleMutation.mutate({ userId: selectedUser.id, role: selectedRole });
    }
  };

  const handleRemoveRole = (userId: string, role: string, userName: string) => {
    if (userId === user?.id && role === "admin") {
      toast.error("No podés remover tu propio rol de admin");
      return;
    }
    setConfirmRemoveDialog({ open: true, userId, role, userName });
  };

  const handleInvite = async (type: "member" | "user") => {
    if (!inviteEmail) {
      toast.error("Ingresá un email");
      return;
    }
    setIsInviting(true);
    try {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            email: inviteEmail,
            role: type === "member" ? inviteRole : undefined,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Error al enviar invitación");
      } else {
        toast.success(result.message || "Invitación enviada");
        setInviteEmail("");
        setIsInviteMemberOpen(false);
        setIsInviteUserOpen(false);
        queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      }
    } catch {
      toast.error("Error al enviar invitación");
    } finally {
      setIsInviting(false);
    }
  };

  const openPermissionsDialog = (role: AppRole) => {
    setPermissionsRole(role);
    const perms: Record<string, boolean> = {};
    Object.keys(TOOL_LABELS).forEach((tool) => {
      const perm = rolePermissions?.find((p) => p.role === role && p.tool_key === tool);
      perms[tool] = perm?.is_enabled ?? false;
    });
    setEditingPermissions(perms);
    setIsPermissionsOpen(true);
  };

  const handleSavePermissions = async () => {
    setIsSavingPermissions(true);
    try {
      for (const [tool, enabled] of Object.entries(editingPermissions)) {
        const existing = rolePermissions?.find((p) => p.role === permissionsRole && p.tool_key === tool);
        if (existing) {
          await supabase
            .from("role_permissions")
            .update({ is_enabled: enabled })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("role_permissions")
            .insert({ role: permissionsRole as any, tool_key: tool, is_enabled: enabled });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast.success(`Permisos de ${getRoleLabel(permissionsRole)} actualizados`);
      setIsPermissionsOpen(false);
    } catch {
      toast.error("Error al guardar permisos");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsDeletingUser(true);
    try {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ userId: deleteUserDialog.userId }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Error al eliminar usuario");
      } else {
        toast.success("Usuario eliminado correctamente");
        queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
        queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      }
    } catch {
      toast.error("Error al eliminar usuario");
    } finally {
      setIsDeletingUser(false);
      setDeleteUserDialog({ open: false, userId: "", userName: "", userEmail: "" });
    }
  };

  const handleEditUser = (userItem: ProfileWithRoles) => {
    setEditUserDialog({
      open: true,
      userId: userItem.id,
      full_name: userItem.full_name,
      phone: userItem.phone || "",
      company: userItem.company || "",
    });
  };

  const handleSaveUser = async () => {
    setIsSavingUser(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editUserDialog.full_name.trim(),
          phone: editUserDialog.phone.trim() || null,
          company: editUserDialog.company.trim() || null,
        })
        .eq("id", editUserDialog.userId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast.success("Datos actualizados correctamente");
      setEditUserDialog({ open: false, userId: "", full_name: "", phone: "", company: "" });
    } catch {
      toast.error("Error al guardar los datos");
    } finally {
      setIsSavingUser(false);
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando equipo...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o empresa..."
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Team Members Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Shield className="h-5 w-5" />
              Miembros del Equipo
            </CardTitle>
            <CardDescription>
              Empleados, vendedores y administradores con acceso al panel interno
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                setInviteEmail("");
                setInviteRole("employee");
                setIsInviteMemberOpen(true);
              }}
            >
              <Mail className="h-4 w-4 mr-1.5" />
              Invitar miembro
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                setSelectedUser(null);
                setSelectedRole("employee");
                setIsAddRoleDialogOpen(true);
              }}
            >
              <ShieldPlus className="h-4 w-4 mr-1.5" />
              Dar rol
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openPermissionsDialog("employee")}
            >
              <Key className="h-4 w-4 mr-1.5" />
              Permisos por rol
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers && teamMembers.length > 0 ? (
            <>
              {/* Mobile card layout */}
              <div className="block md:hidden space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate">{member.full_name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        {member.phone && (
                          <p className="text-xs text-muted-foreground">{member.phone}</p>
                        )}
                        {member.company && (
                          <p className="text-xs text-muted-foreground">{member.company}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(member)}
                        className="shrink-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {member.roles.map((role) => (
                        <Badge
                          key={role}
                          variant={getRoleBadgeVariant(role)}
                          className="text-xs"
                        >
                          {getRoleLabel(role)}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!member.roles.includes("admin") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddRole(member)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Agregar Rol
                        </Button>
                      )}
                      {member.roles
                        .filter((role) => role !== "customer")
                        .map((role) => (
                          <Button
                            key={role}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveRole(member.id, role, member.full_name)}
                            disabled={member.id === user?.id && role === "admin"}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {getRoleLabel(role)}
                          </Button>
                        ))}
                      {member.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteUserDialog({ open: true, userId: member.id, userName: member.full_name, userEmail: member.email })}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.full_name}</TableCell>
                         <TableCell>{member.email}</TableCell>
                         <TableCell>{member.phone || "-"}</TableCell>
                         <TableCell>
                           <div className="flex gap-1 flex-wrap">
                             {member.roles.map((role) => (
                               <Badge
                                 key={role}
                                 variant={getRoleBadgeVariant(role)}
                                 className="text-xs"
                               >
                                 {getRoleLabel(role)}
                               </Badge>
                             ))}
                           </div>
                         </TableCell>
                         <TableCell>
                           <div className="flex gap-2 flex-wrap">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleEditUser(member)}
                               title="Editar datos"
                             >
                               <Pencil className="h-4 w-4" />
                             </Button>
                             {!member.roles.includes("admin") && (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleAddRole(member)}
                               >
                                 <UserPlus className="h-4 w-4" />
                               </Button>
                             )}
                             {member.roles
                               .filter((role) => role !== "customer")
                               .map((role) => (
                                 <Button
                                   key={role}
                                   variant="ghost"
                                   size="sm"
                                   className="text-destructive hover:text-destructive"
                                   onClick={() => handleRemoveRole(member.id, role, member.full_name)}
                                   disabled={member.id === user?.id && role === "admin"}
                                 >
                                   <Trash2 className="h-4 w-4" />
                                   <span className="ml-1 text-xs">{getRoleLabel(role)}</span>
                                 </Button>
                               ))}
                             {member.id !== user?.id && (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="text-destructive hover:text-destructive"
                                 onClick={() => setDeleteUserDialog({ open: true, userId: member.id, userName: member.full_name, userEmail: member.email })}
                               >
                                 <UserX className="h-4 w-4" />
                               </Button>
                             )}
                           </div>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay miembros del equipo configurados.
            </p>
          )}
        </CardContent>
      </Card>

      {/* All Users Card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl">Todos los Usuarios</CardTitle>
            <CardDescription>
              Lista completa de usuarios registrados. Podés asignar roles de empleado, vendedor o admin.
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
            onClick={() => {
              setInviteEmail("");
              setIsInviteUserOpen(true);
            }}
          >
            <Mail className="h-4 w-4 mr-1.5" />
            Invitar usuario
          </Button>
        </CardHeader>
        <CardContent>
          {filteredUsers && filteredUsers.length > 0 ? (
            <>
              {/* Mobile card layout */}
              <div className="block md:hidden space-y-4">
                {filteredUsers.map((userItem) => (
                   <div key={userItem.id} className="border rounded-lg p-4 space-y-3">
                     <div className="flex items-start justify-between gap-2">
                       <div className="min-w-0 flex-1">
                         <h3 className="font-medium text-sm truncate">{userItem.full_name}</h3>
                         <p className="text-xs text-muted-foreground truncate">{userItem.email}</p>
                         {userItem.phone && (
                           <p className="text-xs text-muted-foreground">{userItem.phone}</p>
                         )}
                         {userItem.company && (
                           <p className="text-xs text-muted-foreground">{userItem.company}</p>
                         )}
                       </div>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleEditUser(userItem)}
                         className="shrink-0"
                       >
                         <Pencil className="h-3.5 w-3.5" />
                       </Button>
                     </div>
                     <div className="flex flex-wrap gap-1">
                       {userItem.roles.length > 0 ? (
                         userItem.roles.map((role) => (
                           <Badge
                             key={role}
                             variant={getRoleBadgeVariant(role)}
                             className="text-xs"
                           >
                             {getRoleLabel(role)}
                           </Badge>
                         ))
                       ) : (
                         <Badge variant="outline" className="text-xs">
                           Sin roles
                         </Badge>
                       )}
                     </div>
                     <div className="flex flex-wrap gap-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleAddRole(userItem)}
                         className="flex-1"
                       >
                         <UserPlus className="h-4 w-4 mr-2" />
                         Agregar Rol
                       </Button>
                       {userItem.id !== user?.id && (
                         <Button
                           variant="ghost"
                           size="sm"
                           className="text-destructive hover:text-destructive"
                           onClick={() => setDeleteUserDialog({ open: true, userId: userItem.id, userName: userItem.full_name, userEmail: userItem.email })}
                         >
                           <UserX className="h-4 w-4" />
                         </Button>
                       )}
                     </div>
                   </div>
                ))}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles Actuales</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell className="font-medium">{userItem.full_name}</TableCell>
                        <TableCell>{userItem.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {userItem.roles.length > 0 ? (
                              userItem.roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant={getRoleBadgeVariant(role)}
                                  className="text-xs"
                                >
                                  {getRoleLabel(role)}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Sin roles
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                         <TableCell>
                           <div className="flex gap-2 flex-wrap">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleEditUser(userItem)}
                               title="Editar datos"
                             >
                               <Pencil className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleAddRole(userItem)}
                             >
                               <UserPlus className="h-4 w-4 mr-2" />
                               Agregar Rol
                             </Button>
                             {userItem.id !== user?.id && (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="text-destructive hover:text-destructive"
                                 onClick={() => setDeleteUserDialog({ open: true, userId: userItem.id, userName: userItem.full_name, userEmail: userItem.email })}
                               >
                                 <UserX className="h-4 w-4" />
                               </Button>
                             )}
                           </div>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay usuarios que coincidan con la búsqueda.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Rol</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? `Asignar un nuevo rol a ${selectedUser.full_name}`
                : "Seleccioná un usuario y asigná un rol"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Empleado</SelectItem>
                <SelectItem value="vendedor">Vendedor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAddRole} disabled={addRoleMutation.isPending}>
              {addRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Asignar Rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <Dialog
        open={confirmRemoveDialog.open}
        onOpenChange={(open) => setConfirmRemoveDialog({ ...confirmRemoveDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación de rol</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés remover el rol de{" "}
              <strong>{getRoleLabel(confirmRemoveDialog.role)}</strong> de{" "}
              <strong>{confirmRemoveDialog.userName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRemoveDialog({ open: false, userId: "", role: "", userName: "" })}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                removeRoleMutation.mutate({
                  userId: confirmRemoveDialog.userId,
                  role: confirmRemoveDialog.role as AppRole,
                })
              }
              disabled={removeRoleMutation.isPending}
            >
              {removeRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover Rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteMemberOpen} onOpenChange={setIsInviteMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Miembro al Equipo</DialogTitle>
            <DialogDescription>
              Se enviará un email con un enlace para que el usuario cree su contraseña.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol a asignar</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteMemberOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleInvite("member")} disabled={isInviting}>
              {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Invitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Usuario</DialogTitle>
            <DialogDescription>
              Se enviará un email con un enlace para que el usuario cree su contraseña.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteUserOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleInvite("user")} disabled={isInviting}>
              {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Invitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permisos por Rol</DialogTitle>
            <DialogDescription>
              Configurá qué herramientas puede usar cada rol.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={permissionsRole}
                onValueChange={(v) => {
                  const role = v as AppRole;
                  setPermissionsRole(role);
                  const perms: Record<string, boolean> = {};
                  Object.keys(TOOL_LABELS).forEach((tool) => {
                    const perm = rolePermissions?.find((p) => p.role === role && p.tool_key === tool);
                    perms[tool] = perm?.is_enabled ?? false;
                  });
                  setEditingPermissions(perms);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 border rounded-lg p-4">
              <Label className="text-sm font-semibold">Herramientas habilitadas</Label>
              {Object.entries(TOOL_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    id={`perm-${key}`}
                    checked={editingPermissions[key] ?? false}
                    onCheckedChange={(checked) =>
                      setEditingPermissions((prev) => ({ ...prev, [key]: !!checked }))
                    }
                    disabled={permissionsRole === "admin"}
                  />
                  <Label htmlFor={`perm-${key}`} className="text-sm cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
              {permissionsRole === "admin" && (
                <p className="text-xs text-muted-foreground">
                  Los administradores tienen acceso a todas las herramientas.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions} disabled={isSavingPermissions || permissionsRole === "admin"}>
              {isSavingPermissions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Permisos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteUserDialog.open} onOpenChange={(open) => setDeleteUserDialog({ ...deleteUserDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que querés eliminar a <strong>{deleteUserDialog.userName}</strong> ({deleteUserDialog.userEmail})? Esta acción no se puede deshacer y eliminará toda la información del usuario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingUser}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeletingUser}
            >
              {isDeletingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar Usuario
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog.open} onOpenChange={(open) => setEditUserDialog({ ...editUserDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar datos del usuario</DialogTitle>
            <DialogDescription>
              Modificá el nombre, teléfono o empresa del usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre completo</Label>
              <Input
                id="edit-name"
                value={editUserDialog.full_name}
                onChange={(e) => setEditUserDialog({ ...editUserDialog, full_name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={editUserDialog.phone}
                onChange={(e) => setEditUserDialog({ ...editUserDialog, phone: e.target.value })}
                placeholder="+54 11 1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Empresa</Label>
              <Input
                id="edit-company"
                value={editUserDialog.company}
                onChange={(e) => setEditUserDialog({ ...editUserDialog, company: e.target.value })}
                placeholder="Nombre de la empresa"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setEditUserDialog({ open: false, userId: "", full_name: "", phone: "", company: "" })}
              disabled={isSavingUser}
            >
              Cancelar
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={handleSaveUser}
              disabled={isSavingUser || !editUserDialog.full_name.trim()}
            >
              {isSavingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;
