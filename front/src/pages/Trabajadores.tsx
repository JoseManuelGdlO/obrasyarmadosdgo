import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Edit, Trash2, Phone, Mail, User, Briefcase, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, badgeVariants } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import { apiRequest, toAbsoluteAssetUrl } from "@/lib/api";
import { cn, formatDateOnlyLocale } from "@/lib/utils";

type EstadoBackend = "activo" | "inactivo" | "vacaciones" | "licencia";
type EstadoUi = "Activo" | "Inactivo" | "Vacaciones" | "Licencia";

type TrabajadorBackend = {
  id: string;
  nombre: string;
  puesto?: string | null;
  cargo?: string | null;
  departamento?: string | null;
  especialidad?: string | null;
  telefono?: string | null;
  email?: string | null;
  fechaIngreso?: string | null;
  fechaBaja?: string | null;
  experiencia?: string | null;
  avatar?: string | null;
  estado: EstadoBackend;
};

type TrabajadorVM = {
  id: string;
  nombre: string;
  cargo: string;
  departamento: string;
  especialidad: string;
  telefono: string;
  email: string;
  fechaIngreso: string;
  fechaBaja: string;
  experiencia: string;
  avatar: string;
  estado: EstadoUi;
};

const departamentos = ["Mantenimiento", "Operaciones", "Proyectos", "Administración"];
const estados: EstadoUi[] = ["Activo", "Inactivo", "Vacaciones", "Licencia"];

const estadoToBackend = (estado: EstadoUi | string): EstadoBackend => {
  switch (estado) {
    case "Inactivo":
      return "inactivo";
    case "Vacaciones":
      return "vacaciones";
    case "Licencia":
      return "licencia";
    case "Activo":
    default:
      return "activo";
  }
};

const estadoToUi = (estado: EstadoBackend | string | null | undefined): EstadoUi => {
  switch (estado) {
    case "inactivo":
      return "Inactivo";
    case "vacaciones":
      return "Vacaciones";
    case "licencia":
      return "Licencia";
    case "activo":
    default:
      return "Activo";
  }
};

const formatTrabajadorSubtitulo = (t: TrabajadorVM) => {
  if (t.estado === "Inactivo" && t.fechaBaja) {
    return `Dado de baja el ${formatDateOnlyLocale(t.fechaBaja)}`;
  }
  if (t.fechaIngreso) {
    return `Desde ${formatDateOnlyLocale(t.fechaIngreso)}`;
  }
  return "—";
};

const mapTrabajador = (t: TrabajadorBackend): TrabajadorVM => ({
  id: t.id,
  nombre: t.nombre || "",
  cargo: t.cargo || t.puesto || "",
  departamento: t.departamento || "",
  especialidad: t.especialidad || "",
  telefono: t.telefono || "",
  email: t.email || "",
  fechaIngreso: t.fechaIngreso || "",
  fechaBaja: t.fechaBaja || "",
  experiencia: t.experiencia || "",
  avatar: t.avatar || "",
  estado: estadoToUi(t.estado),
});

type TrabajadorFormData = {
  nombre: string;
  email: string;
  telefono: string;
  cargo: string;
  departamento: string;
  especialidad: string;
  fechaIngreso: string;
  experiencia: string;
  avatarPath: string;
  avatarFile: File | null;
  removeAvatar: boolean;
  estado: EstadoUi;
};

const defaultForm: TrabajadorFormData = {
  nombre: "",
  email: "",
  telefono: "",
  cargo: "",
  departamento: "",
  especialidad: "",
  fechaIngreso: "",
  experiencia: "",
  avatarPath: "",
  avatarFile: null,
  removeAvatar: false,
  estado: "Activo",
};

const appendPayloadToFormData = (
  body: FormData,
  payload: Record<string, string | number | boolean | null>
) => {
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      body.append(key, String(value));
    }
  });
};

const validateAvatarFile = (file: File | null) => {
  if (!file) return null;
  const maxSize = 2 * 1024 * 1024;
  const allowedTypes = new Set(["image/jpeg", "image/png"]);
  if (!allowedTypes.has(file.type)) {
    return "El avatar debe ser JPG o PNG.";
  }
  if (file.size > maxSize) {
    return "El avatar no puede superar 2MB.";
  }
  return null;
};

export default function Trabajadores() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartamento, setSelectedDepartamento] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TrabajadorFormData>(defaultForm);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState("");

  const { data: trabajadoresData } = useQuery({
    queryKey: ["trabajadores", searchTerm],
    queryFn: () =>
      apiRequest<{ trabajadores: TrabajadorBackend[] }>(
        `/trabajadores?q=${encodeURIComponent(searchTerm)}`
      ),
  });

  const trabajadores: TrabajadorVM[] = useMemo(
    () => (trabajadoresData?.trabajadores || []).map(mapTrabajador),
    [trabajadoresData?.trabajadores]
  );

  const buildPayload = () => ({
    nombre: formData.nombre.trim(),
    email: formData.email.trim() || null,
    telefono: formData.telefono.trim() || null,
    cargo: formData.cargo.trim() || null,
    puesto: formData.cargo.trim() || null,
    departamento: formData.departamento.trim() || null,
    especialidad: formData.especialidad.trim() || null,
    fechaIngreso: formData.fechaIngreso || null,
    experiencia: formData.experiencia.trim() || null,
    estado: estadoToBackend(formData.estado),
  });

  const buildSubmitFormData = () => {
    const body = new FormData();
    appendPayloadToFormData(body, buildPayload());
    if (formData.avatarFile) {
      body.append("avatar", formData.avatarFile);
    }
    if (editingId && formData.removeAvatar) {
      body.append("removeAvatar", "true");
    }
    return body;
  };

  useEffect(() => {
    if (!isDialogOpen) return;
    if (formData.avatarFile) {
      const tempUrl = URL.createObjectURL(formData.avatarFile);
      setPreviewAvatarUrl(tempUrl);
      return () => URL.revokeObjectURL(tempUrl);
    }
    if (formData.removeAvatar) {
      setPreviewAvatarUrl("");
      return;
    }
    setPreviewAvatarUrl(formData.avatarPath || "");
  }, [isDialogOpen, formData.avatarFile, formData.avatarPath, formData.removeAvatar]);

  const createTrabajadorMutation = useMutation({
    mutationFn: (body: FormData) =>
      apiRequest("/trabajadores", { method: "POST", body }),
    onSuccess: () => {
      toast.success("Trabajador creado");
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["trabajadores"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error creando trabajador"),
  });

  const updateTrabajadorMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: FormData }) =>
      apiRequest(`/trabajadores/${id}`, { method: "PATCH", body }),
    onSuccess: () => {
      toast.success("Trabajador actualizado");
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["trabajadores"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error actualizando trabajador"),
  });

  const deleteTrabajadorMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/trabajadores/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Trabajador dado de baja");
      queryClient.invalidateQueries({ queryKey: ["trabajadores"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error al dar de baja al trabajador"),
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoUi }) =>
      apiRequest(`/trabajadores/${id}`, {
        method: "PATCH",
        body: { estado: estadoToBackend(estado) },
      }),
    onSuccess: () => {
      toast.success("Estado actualizado");
      queryClient.invalidateQueries({ queryKey: ["trabajadores"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error al actualizar el estado"),
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(defaultForm);
    setPreviewAvatarUrl("");
  };

  const openCreateDialog = (open: boolean) => {
    if (open) {
      setEditingId(null);
      setFormData(defaultForm);
      setIsDialogOpen(true);
    } else {
      closeDialog();
    }
  };

  const openEditDialog = (t: TrabajadorVM) => {
    setEditingId(t.id);
    setFormData({
      nombre: t.nombre,
      email: t.email,
      telefono: t.telefono,
      cargo: t.cargo,
      departamento: t.departamento,
      especialidad: t.especialidad,
      fechaIngreso: t.fechaIngreso,
      experiencia: t.experiencia,
      avatarPath: toAbsoluteAssetUrl(t.avatar) || "",
      avatarFile: null,
      removeAvatar: false,
      estado: t.estado,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const avatarError = validateAvatarFile(formData.avatarFile);
    if (avatarError) {
      toast.error(avatarError);
      return;
    }
    const body = buildSubmitFormData();
    if (editingId) {
      updateTrabajadorMutation.mutate({ id: editingId, body });
    } else {
      createTrabajadorMutation.mutate(body);
    }
  };

  const filteredTrabajadores = trabajadores.filter((trabajador) => {
    const matchesDepartamento = !selectedDepartamento || trabajador.departamento === selectedDepartamento;
    const matchesEstado = !selectedEstado || trabajador.estado === selectedEstado;
    return matchesDepartamento && matchesEstado;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Activo": return "bg-green-100 text-green-800";
      case "Inactivo": return "bg-red-100 text-red-800";
      case "Vacaciones": return "bg-blue-100 text-blue-800";
      case "Licencia": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "Activo": return "bg-green-600";
      case "Inactivo": return "bg-red-600";
      case "Vacaciones": return "bg-blue-600";
      case "Licencia": return "bg-yellow-600";
      default: return "bg-gray-400";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const trabajadoresActivos = trabajadores.filter(t => t.estado === "Activo").length;
  const totalTrabajadores = trabajadores.length;
  const departamentosUnicos = new Set(
    trabajadores.map(t => t.departamento).filter((d) => d.length > 0)
  ).size;
  const enVacaciones = trabajadores.filter(t => t.estado === "Vacaciones").length;

  const isSubmitting = createTrabajadorMutation.isPending || updateTrabajadorMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trabajadores</h1>
          <p className="text-gray-600 mt-1">
            Gestiona el personal y sus especialidades
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={openCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Trabajador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Trabajador" : "Agregar Nuevo Trabajador"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Juan Pérez García"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan.perez@mantpro.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  placeholder="+52 555 0000"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  placeholder="Ej: Técnico Mecánico"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Select value={formData.departamento} onValueChange={(value) => setFormData({ ...formData, departamento: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map((depto) => (
                      <SelectItem key={depto} value={depto}>
                        {depto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="especialidad">Especialidad</Label>
                <Input
                  id="especialidad"
                  placeholder="Ej: Motores Diesel"
                  value={formData.especialidad}
                  onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaIngreso">Fecha de Ingreso</Label>
                <Input
                  id="fechaIngreso"
                  type="date"
                  value={formData.fechaIngreso}
                  onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experiencia">Experiencia</Label>
                <Input
                  id="experiencia"
                  placeholder="Ej: 8 años"
                  value={formData.experiencia}
                  onChange={(e) => setFormData({ ...formData, experiencia: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) =>
                    setFormData({ ...formData, estado: value as EstadoUi })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estados.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 rounded-lg border p-3">
                <Label htmlFor="avatar">Avatar (JPG/PNG, máx 2MB)</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData((prev) => ({
                      ...prev,
                      avatarFile: file,
                      removeAvatar: false,
                    }));
                    e.target.value = "";
                  }}
                />
                {previewAvatarUrl && (
                  <img
                    src={previewAvatarUrl}
                    alt="Avatar del trabajador"
                    className="h-28 w-full rounded-md border object-cover"
                  />
                )}
                {(formData.avatarPath || formData.avatarFile) && !formData.removeAvatar && (
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Quitar avatar</Label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          removeAvatar: true,
                          avatarFile: null,
                        }))
                      }
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                      aria-label="Quitar avatar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {editingId ? "Guardar Cambios" : "Crear Trabajador"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeDialog}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Trabajadores"
          value={totalTrabajadores}
          icon={User}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Activos"
          value={trabajadoresActivos}
          icon={Briefcase}
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard
          title="Departamentos"
          value={departamentosUnicos}
          icon={Briefcase}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="En Vacaciones"
          value={enVacaciones}
          icon={User}
          trend={{ value: 2, isPositive: false }}
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, cargo o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedDepartamento} onValueChange={setSelectedDepartamento}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((depto) => (
                    <SelectItem key={depto} value={depto}>
                      {depto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-32">
              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Trabajadores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Lista de Trabajadores ({filteredTrabajadores.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trabajador</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Experiencia</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrabajadores.map((trabajador) => (
                <TableRow key={trabajador.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={toAbsoluteAssetUrl(trabajador.avatar) || undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {getInitials(trabajador.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{trabajador.nombre}</div>
                        <div className="text-sm text-gray-600">
                          {formatTrabajadorSubtitulo(trabajador)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {trabajador.cargo || "—"}
                  </TableCell>
                  <TableCell>
                    {trabajador.departamento ? (
                      <Badge variant="secondary">
                        {trabajador.departamento}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {trabajador.especialidad || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {trabajador.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{trabajador.email}</span>
                        </div>
                      )}
                      {trabajador.telefono && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{trabajador.telefono}</span>
                        </div>
                      )}
                      {!trabajador.email && !trabajador.telefono && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          disabled={
                            updateEstadoMutation.isPending &&
                            updateEstadoMutation.variables?.id === trabajador.id
                          }
                          className={cn(
                            badgeVariants(),
                            getStatusColor(trabajador.estado),
                            "cursor-pointer border-transparent hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                          )}
                        >
                          {trabajador.estado}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {estados.map((estado) => (
                          <DropdownMenuItem
                            key={estado}
                            onClick={() => {
                              if (estado !== trabajador.estado) {
                                updateEstadoMutation.mutate({ id: trabajador.id, estado });
                              }
                            }}
                          >
                            <span
                              className={cn(
                                "mr-2 h-2 w-2 shrink-0 rounded-full",
                                getStatusDotColor(estado)
                              )}
                            />
                            {estado}
                            {trabajador.estado === estado && (
                              <Check className="ml-auto h-4 w-4 text-primary" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {trabajador.experiencia || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openEditDialog(trabajador)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <ConfirmDeleteButton
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="¿Dar de baja al trabajador?"
                        description={`Esta acción dará de baja a "${trabajador.nombre}" y dejará de aparecer en listados y estadísticas.`}
                        onConfirm={() => deleteTrabajadorMutation.mutate(trabajador.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </ConfirmDeleteButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredTrabajadores.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron trabajadores que coincidan con los filtros
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
