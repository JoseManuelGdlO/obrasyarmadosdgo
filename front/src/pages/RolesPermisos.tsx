import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ALL_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import RolModal from "@/components/modals/RolModal";
import PermisosModal from "@/components/modals/PermisosModal";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";

type RoleName = string;
type RolePermissionRow = { id: string; rol: RoleName; permission: string };
type RoleProyectoRow = { id: string; rol: RoleName; proyectoId: string };
type ApiRole = { id: string; nombre: string; descripcion?: string | null; activo: boolean };
type ProyectoOpt = { id: string; nombre: string };

const SYSTEM_ROLES = new Set(["admin"]);

export default function RolesPermisos() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [isRolModalOpen, setIsRolModalOpen] = useState(false);
  const [isPermisosModalOpen, setIsPermisosModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleName>("usuario");

  const { data } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: () => apiRequest<{ rolePermissions: RolePermissionRow[] }>("/role-permissions"),
  });
  const { data: roleProyectosData } = useQuery({
    queryKey: ["role-proyectos"],
    queryFn: () => apiRequest<{ roleProyectos: RoleProyectoRow[] }>("/role-proyectos"),
  });
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiRequest<{ roles: ApiRole[] }>("/roles"),
  });
  const { data: proyectosData } = useQuery({
    queryKey: ["proyectos"],
    queryFn: () => apiRequest<{ proyectos: ProyectoOpt[] }>("/proyectos"),
    enabled: can(PERMISSIONS.PROYECTOS_VIEW) || can(PERMISSIONS.ROLE_PERMISSIONS_VIEW),
  });

  const rows = data?.rolePermissions || [];
  const roleProyectoRows = roleProyectosData?.roleProyectos || [];
  const allRoles = rolesData?.roles || [];
  const proyectosById = useMemo(() => {
    const map = new Map<string, string>();
    (proyectosData?.proyectos || []).forEach((p) => map.set(p.id, p.nombre));
    return map;
  }, [proyectosData?.proyectos]);

  const roleNames = allRoles.filter((r) => r.activo).map((r) => r.nombre);

  const groupedByRole = useMemo(() => {
    const acc: Record<string, string[]> = {};
    allRoles.forEach((role) => {
      acc[role.nombre] = [];
    });
    rows.forEach((row) => {
      if (!acc[row.rol]) acc[row.rol] = [];
      acc[row.rol].push(row.permission);
    });
    return acc;
  }, [rows, allRoles]);

  const proyectosByRole = useMemo(() => {
    const acc: Record<string, string[]> = {};
    allRoles.forEach((role) => {
      acc[role.nombre] = [];
    });
    roleProyectoRows.forEach((row) => {
      if (!acc[row.rol]) acc[row.rol] = [];
      acc[row.rol].push(row.proyectoId);
    });
    return acc;
  }, [roleProyectoRows, allRoles]);

  const canCreateRoles = can(PERMISSIONS.ROLES_CREATE);
  const canDeleteRoles = can(PERMISSIONS.ROLES_DELETE);
  const canManageRolePerms = can(PERMISSIONS.ROLE_PERMISSIONS_CREATE) || can(PERMISSIONS.ROLE_PERMISSIONS_DELETE);
  const canDeleteRolePerms = can(PERMISSIONS.ROLE_PERMISSIONS_DELETE);

  const upsertMutation = useMutation({
    mutationFn: async ({
      rol,
      permissions,
      proyectoIds,
    }: {
      rol: RoleName;
      permissions: string[];
      proyectoIds: string[];
    }) => {
      const existing = rows.filter((row) => row.rol === rol);
      const existingSet = new Set(existing.map((row) => row.permission));
      const targetSet = new Set(permissions);
      const hasProyectosPerms = permissions.some((p) => p.startsWith("proyectos."));

      const createRequests = permissions
        .filter((perm) => !existingSet.has(perm))
        .map((permission) => apiRequest("/role-permissions", { method: "POST", body: { rol, permission } }));

      const deleteRequests = existing
        .filter((row) => !targetSet.has(row.permission))
        .map((row) => apiRequest(`/role-permissions/${row.id}`, { method: "DELETE" }));

      await Promise.all([...createRequests, ...deleteRequests]);

      await apiRequest(`/role-proyectos/${encodeURIComponent(rol)}`, {
        method: "PUT",
        body: { proyectoIds: hasProyectosPerms ? proyectoIds : [] },
      });
    },
    onSuccess: () => {
      setIsPermisosModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["role-proyectos"] });
      toast.success("Permisos actualizados.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createRoleMutation = useMutation({
    mutationFn: (payload: { nombre: string; descripcion?: string; activo?: boolean }) =>
      apiRequest("/roles", { method: "POST", body: payload }),
    onSuccess: () => {
      setIsRolModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol creado.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => apiRequest(`/roles/${roleId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["role-proyectos"] });
      toast.success("Rol eliminado.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteOneMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/role-permissions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast.success("Permiso removido.");
    },
    onError: (error: Error) => toast.error(error.message),
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
            disabled={!canCreateRoles}
            title={!canCreateRoles ? "Sin permiso para crear roles" : undefined}
            onClick={() => setIsRolModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Rol
          </Button>
          <Button
            disabled={!canManageRolePerms}
            title={!canManageRolePerms ? "Sin permiso para configurar permisos" : undefined}
            onClick={() => setIsPermisosModalOpen(true)}
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
                <TableHead>Proyectos</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRoles.map((role) => {
                const rol = role.nombre;
                const scopedIds = proyectosByRole[rol] || [];
                const hasProyectosPerm = (groupedByRole[rol] || []).some((p) =>
                  p.startsWith("proyectos.")
                );
                const isProtected = SYSTEM_ROLES.has(rol);
                const deleteDisabled =
                  !canDeleteRoles || isProtected || deleteRoleMutation.isPending;
                const deleteTitle = !canDeleteRoles
                  ? "Sin permiso para eliminar roles"
                  : isProtected
                    ? "Rol del sistema: no se puede eliminar"
                    : undefined;

                return (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{rol}</Badge>
                        {!role.activo && <Badge variant="outline">Inactivo</Badge>}
                      </div>
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
                      {!hasProyectosPerm ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : scopedIds.length === 0 ? (
                        <Badge variant="secondary">Todos</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {scopedIds.map((proyectoId) => (
                            <Badge key={`${rol}-${proyectoId}`} variant="outline">
                              {proyectosById.get(proyectoId) || proyectoId.slice(0, 8)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canManageRolePerms || !role.activo}
                          title={
                            !canManageRolePerms
                              ? "Sin permiso para editar permisos del rol"
                              : !role.activo
                                ? "El rol está inactivo"
                                : undefined
                          }
                          onClick={() => {
                            setSelectedRole(rol);
                            setIsPermisosModalOpen(true);
                          }}
                        >
                          Editar permisos
                        </Button>
                        <ConfirmDeleteButton
                          requireDoubleConfirm
                          className="h-8 px-3 text-red-600 hover:text-red-700"
                          title={`¿Eliminar el rol "${rol}"?`}
                          description={`Se eliminará el rol "${rol}" y todos sus permisos. Esta acción no se puede deshacer.`}
                          secondTitle="Confirmación final"
                          secondDescription={`Confirma otra vez que quieres eliminar el rol "${rol}". Si hay usuarios con este rol, el sistema no permitirá borrarlo.`}
                          disabled={deleteDisabled}
                          onConfirm={() => deleteRoleMutation.mutate(role.id)}
                        >
                          <span title={deleteTitle}>
                            <Trash2 className="h-4 w-4" />
                          </span>
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

      <Card>
        <CardHeader>
          <CardTitle>Glosario de acciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-3">
              <Badge variant="outline">view</Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                Permite ver listados y detalle de registros, sin modificar información.
              </p>
            </div>
            <div className="rounded-md border p-3">
              <Badge variant="outline">create</Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                Permite crear nuevos registros dentro de la funcionalidad.
              </p>
            </div>
            <div className="rounded-md border p-3">
              <Badge variant="outline">edit</Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                Permite editar o actualizar registros ya existentes.
              </p>
            </div>
            <div className="rounded-md border p-3">
              <Badge variant="outline">delete</Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                Permite eliminar registros de forma definitiva o lógica según el módulo.
              </p>
            </div>
          </div>
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
                      requireDoubleConfirm
                      className="h-8 px-3 text-red-600 hover:text-red-700"
                      title="¿Remover este permiso?"
                      description={`Se quitará el permiso "${row.permission}" del rol "${row.rol}".`}
                      secondTitle="Confirmación final"
                      secondDescription="Confirma otra vez que quieres remover este permiso. Esta acción no se puede deshacer."
                      disabled={!canDeleteRolePerms || deleteOneMutation.isPending}
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
        initialData={{
          rol: selectedRole,
          permissions: groupedByRole[selectedRole] || [],
          proyectoIds: proyectosByRole[selectedRole] || [],
        }}
        onSubmit={(form) =>
          upsertMutation.mutate({
            rol: form.rol,
            permissions: form.permissions,
            proyectoIds: form.proyectoIds,
          })
        }
        isSubmitting={upsertMutation.isPending}
        roles={roleNames.length ? roleNames : ["usuario"]}
      />
    </div>
  );
}
