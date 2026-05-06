import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { Plus, Search, Filter, Users, Crown, Calendar, UserCheck, Settings, Shield, User, Mail } from "lucide-react";
import { apiRequest } from "@/lib/api";
import UsuarioModal, { UsuarioFormData } from "@/components/modals/UsuarioModal";
import PermisosModal, { PermisosFormData } from "@/components/modals/PermisosModal";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";

type ApiUser = {
  id: string;
  email: string;
  rol: string;
  status: "activo" | "suspendido";
  lastAccess?: string | null;
  createdAt?: string;
};
type ApiRole = { id: string; nombre: string; descripcion?: string | null; activo: boolean };

const ALL_PERMISSIONS = [
  "users.view",
  "users.create",
  "users.edit",
  "users.delete",
  "roles.view",
  "roles.create",
  "roles.edit",
  "roles.delete",
  "role_permissions.view",
  "role_permissions.create",
  "role_permissions.delete",
  "clientes.view",
  "clientes.create",
  "clientes.edit",
  "clientes.delete",
  "articulos.view",
  "articulos.create",
  "articulos.edit",
  "articulos.delete",
  "maquinas.view",
  "maquinas.create",
  "maquinas.edit",
  "maquinas.delete",
  "operadores.view",
  "operadores.create",
  "operadores.delete",
  "maquinas.read_assigned",
  "maquinas.update_assigned",
  "proveedores.view",
  "proveedores.create",
  "proveedores.edit",
  "proveedores.delete",
  "trabajadores.view",
  "trabajadores.create",
  "trabajadores.edit",
  "trabajadores.delete",
  "proyectos.view",
  "proyectos.create",
  "proyectos.edit",
  "proyectos.delete",
  "asignaciones.view",
  "asignaciones.create",
  "asignaciones.edit",
  "asignaciones.delete",
  "nomenclaturas.view",
  "nomenclaturas.create",
  "nomenclaturas.edit",
  "nomenclaturas.delete",
  "ordenes.view",
  "ordenes.create",
  "ordenes.edit",
  "ordenes.delete",
];

const prettyRole = (rol: ApiUser["rol"]) =>
  rol === "admin" ? "Admin" : rol === "maquinista" ? "Maquinista" : rol === "usuario" ? "Usuario" : rol;

const roleColor = (rol: ApiUser["rol"]) =>
  rol === "admin"
    ? "bg-primary text-primary-foreground"
    : rol === "maquinista"
      ? "bg-accent text-accent-foreground"
      : "bg-secondary text-secondary-foreground";

const statusColor = (status: ApiUser["status"]) =>
  status === "activo" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground";

const GestionUsuarios = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [isPermisosModalOpen, setIsPermisosModalOpen] = useState(false);
  const [permissionsTargetRole, setPermissionsTargetRole] = useState<PermisosFormData["rol"]>("usuario");

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiRequest<{ users: ApiUser[] }>("/users"),
  });
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiRequest<{ roles: ApiRole[] }>("/roles"),
  });

  const { data: rolePermsData } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: () => apiRequest<{ rolePermissions: Array<{ id: string; rol: PermisosFormData["rol"]; permission: string }> }>("/role-permissions"),
  });

  const createUserMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiRequest("/users", { method: "POST", body: payload }),
    onSuccess: () => {
      setIsUserModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiRequest(`/users/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => {
      setIsUserModalOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const upsertRolePermissionsMutation = useMutation({
    mutationFn: async (form: PermisosFormData) => {
      const existing = (rolePermsData?.rolePermissions || []).filter((row) => row.rol === form.rol);
      const existingSet = new Set(existing.map((row) => row.permission));
      const desiredSet = new Set(form.permissions);

      const toCreate = form.permissions.filter((perm) => !existingSet.has(perm));
      const toDelete = existing.filter((row) => !desiredSet.has(row.permission));

      await Promise.all([
        ...toCreate.map((permission) => apiRequest("/role-permissions", { method: "POST", body: { rol: form.rol, permission } })),
        ...toDelete.map((row) => apiRequest(`/role-permissions/${row.id}`, { method: "DELETE" })),
      ]);
    },
    onSuccess: () => {
      setIsPermisosModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    },
  });

  const users = usersData?.users || [];
  const roles = (rolesData?.roles || []).filter((r) => r.activo).map((r) => r.nombre);
  const rolePermissions = rolePermsData?.rolePermissions || [];

  const filteredUsers = users.filter((u) => {
    const search = searchTerm.toLowerCase();
    return u.email.toLowerCase().includes(search) || prettyRole(u.rol).toLowerCase().includes(search);
  });

  const usuariosActivos = users.filter((u) => u.status === "activo").length;
  const adminClientes = users.filter((u) => u.rol === "admin").length;
  const usuariosRegulares = users.filter((u) => u.rol !== "admin").length;
  const usuariosNuevos = users.filter((u) => (u.createdAt ? new Date(u.createdAt) > new Date("2024-01-01") : false)).length;

  const currentRolePermissions = rolePermissions
    .filter((row) => row.rol === permissionsTargetRole)
    .map((row) => row.permission);

  const openCreateUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const openEditUser = (user: ApiUser) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = (form: UsuarioFormData) => {
    if (editingUser) {
      const payload: Record<string, unknown> = {
        email: form.email,
        rol: form.rol,
        status: form.status,
      };
      if (form.password.trim()) payload.password = form.password;
      updateUserMutation.mutate({ id: editingUser.id, payload });
      return;
    }
    createUserMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Panel Super Administrador - Control Multi-Tenant de Usuarios</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all" onClick={openCreateUser}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Usuarios Activos" value={usuariosActivos} icon={UserCheck} description="En toda la plataforma" trend={{ value: 8, isPositive: true }} />
        <StatCard title="Admins" value={adminClientes} icon={Crown} description="Administradores del sistema" trend={{ value: 1, isPositive: true }} />
        <StatCard title="Usuarios Regulares" value={usuariosRegulares} icon={Users} description="Usuarios finales" trend={{ value: 15, isPositive: true }} />
        <StatCard title="Nuevos Este Mes" value={usuariosNuevos} icon={Shield} description="Registros recientes" trend={{ value: 2, isPositive: true }} />
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por email o rol..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button variant="outline" className="flex items-center gap-2" onClick={() => setSearchTerm("")}>
              <Filter className="w-4 h-4" />
              Limpiar Filtro
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                setPermissionsTargetRole("usuario");
                setIsPermisosModalOpen(true);
              }}
            >
              <Shield className="w-4 h-4" />
              Configurar Permisos
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Usuarios de la Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Permisos Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((usuario) => {
                const permisosRol = rolePermissions.filter((row) => row.rol === usuario.rol).map((row) => row.permission);
                return (
                  <TableRow key={usuario.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <span className="font-medium">{usuario.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{usuario.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColor(usuario.rol)}>{prettyRole(usuario.rol)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {permisosRol.slice(0, 2).map((permiso) => (
                          <Badge key={permiso} variant="outline" className="text-xs">
                            {permiso}
                          </Badge>
                        ))}
                        {permisosRol.length > 2 && <Badge variant="outline" className="text-xs">+{permisosRol.length - 2} más</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor(usuario.status)}>{usuario.status === "activo" ? "Activo" : "Suspendido"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm">{usuario.lastAccess ? new Date(usuario.lastAccess).toLocaleDateString() : "Sin acceso"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPermissionsTargetRole(usuario.rol);
                            setIsPermisosModalOpen(true);
                          }}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          Permisos
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditUser(usuario)}>
                          <Settings className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <ConfirmDeleteButton
                          className="h-9 px-3 text-red-600 hover:text-red-700"
                          title="¿Suspender usuario?"
                          description="El usuario cambiará a estado suspendido."
                          onConfirm={() => suspendUserMutation.mutate(usuario.id)}
                        >
                          Suspender
                        </ConfirmDeleteButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <UsuarioModal
        open={isUserModalOpen}
        onOpenChange={(open) => {
          setIsUserModalOpen(open);
          if (!open) setEditingUser(null);
        }}
        onSubmit={handleUserSubmit}
        isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
        initialData={editingUser ? { email: editingUser.email, rol: editingUser.rol, status: editingUser.status } : null}
        roles={roles.length ? roles : ["usuario"]}
      />
      <PermisosModal
        open={isPermisosModalOpen}
        onOpenChange={setIsPermisosModalOpen}
        onSubmit={(form) => upsertRolePermissionsMutation.mutate(form)}
        isSubmitting={upsertRolePermissionsMutation.isPending}
        initialData={{ rol: permissionsTargetRole, permissions: currentRolePermissions }}
        availablePermissions={ALL_PERMISSIONS}
        roles={roles.length ? roles : ["usuario"]}
      />
    </div>
  );
};

export default GestionUsuarios;