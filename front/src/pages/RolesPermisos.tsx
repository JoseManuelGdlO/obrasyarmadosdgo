import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import RolModal from "@/components/modals/RolModal";
import PermisosModal from "@/components/modals/PermisosModal";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";

type RoleName = string;
type RolePermissionRow = { id: string; rol: RoleName; permission: string };
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

export default function RolesPermisos() {
  const queryClient = useQueryClient();
  const [isRolModalOpen, setIsRolModalOpen] = useState(false);
  const [isPermisosModalOpen, setIsPermisosModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleName>("usuario");

  const { data } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: () => apiRequest<{ rolePermissions: RolePermissionRow[] }>("/role-permissions"),
  });
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiRequest<{ roles: ApiRole[] }>("/roles"),
  });

  const rows = data?.rolePermissions || [];

  const roleNames = (rolesData?.roles || []).filter((r) => r.activo).map((r) => r.nombre);

  const groupedByRole = useMemo(() => {
    const acc: Record<string, string[]> = {};
    roleNames.forEach((name) => {
      acc[name] = [];
    });
    rows.forEach((row) => {
      if (!acc[row.rol]) acc[row.rol] = [];
      acc[row.rol].push(row.permission);
    });
    return acc;
  }, [rows, roleNames]);

  const upsertMutation = useMutation({
    mutationFn: async ({ rol, permissions }: { rol: RoleName; permissions: string[] }) => {
      const existing = rows.filter((row) => row.rol === rol);
      const existingSet = new Set(existing.map((row) => row.permission));
      const targetSet = new Set(permissions);

      const createRequests = permissions
        .filter((perm) => !existingSet.has(perm))
        .map((permission) => apiRequest("/role-permissions", { method: "POST", body: { rol, permission } }));

      const deleteRequests = existing
        .filter((row) => !targetSet.has(row.permission))
        .map((row) => apiRequest(`/role-permissions/${row.id}`, { method: "DELETE" }));

      await Promise.all([...createRequests, ...deleteRequests]);
    },
    onSuccess: () => {
      setIsPermisosModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    },
  });
  const createRoleMutation = useMutation({
    mutationFn: (payload: { nombre: string; descripcion?: string; activo?: boolean }) =>
      apiRequest("/roles", { method: "POST", body: payload }),
    onSuccess: () => {
      setIsRolModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/role-permissions/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["role-permissions"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Roles y Permisos</h1>
          <p className="text-muted-foreground">Configura accesos por rol para toda la plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => {
              setIsRolModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Rol
          </Button>
          <Button
            onClick={() => {
              setIsPermisosModalOpen(true);
            }}
          >
            <Shield className="h-4 w-4 mr-2" />
            Configurar Permisos
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permisos por Rol</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rol</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roleNames.map((rol) => (
                <TableRow key={rol}>
                  <TableCell>
                    <Badge variant="secondary">{rol}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {(groupedByRole[rol] || []).map((permission) => (
                        <Badge key={`${rol}-${permission}`} variant="outline">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRole(rol);
                        setIsPermisosModalOpen(true);
                      }}
                    >
                      Editar permisos
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asignaciones individuales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rol</TableHead>
                <TableHead>Permiso</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.rol}</TableCell>
                  <TableCell>{row.permission}</TableCell>
                  <TableCell>
                    <ConfirmDeleteButton
                      className="h-8 px-3 text-red-600 hover:text-red-700"
                      title="¿Remover permiso?"
                      description="Esta acción removerá el permiso del rol."
                      onConfirm={() => deleteOneMutation.mutate(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </ConfirmDeleteButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RolModal
        open={isRolModalOpen}
        onOpenChange={setIsRolModalOpen}
        onSubmit={(form) => createRoleMutation.mutate(form)}
        isSubmitting={createRoleMutation.isPending}
      />
      <PermisosModal
        open={isPermisosModalOpen}
        onOpenChange={setIsPermisosModalOpen}
        availablePermissions={ALL_PERMISSIONS}
        initialData={{ rol: selectedRole, permissions: groupedByRole[selectedRole] || [] }}
        onSubmit={(form) => upsertMutation.mutate({ rol: form.rol, permissions: form.permissions })}
        isSubmitting={upsertMutation.isPending}
        roles={roleNames.length ? roleNames : ["usuario"]}
      />
    </div>
  );
}
