import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Edit, Trash2, Phone, Mail, User, Briefcase } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import { apiRequest } from "@/lib/api";

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

const mapTrabajador = (t: TrabajadorBackend): TrabajadorVM => ({
  id: t.id,
  nombre: t.nombre || "",
  cargo: t.cargo || t.puesto || "",
  departamento: t.departamento || "",
  especialidad: t.especialidad || "",
  telefono: t.telefono || "",
  email: t.email || "",
  fechaIngreso: t.fechaIngreso || "",
  experiencia: t.experiencia || "",
  avatar: t.avatar || "",
  estado: estadoToUi(t.estado),
});

const defaultForm = {
  nombre: "",
  email: "",
  telefono: "",
  cargo: "",
  departamento: "",
  especialidad: "",
  fechaIngreso: "",
  experiencia: "",
  avatar: "",
  estado: "Activo" as EstadoUi,
};

export default function Trabajadores() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartamento, setSelectedDepartamento] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm);

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
    avatar: formData.avatar.trim() || null,
    estado: estadoToBackend(formData.estado),
  });

  const createTrabajadorMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("/trabajadores", { method: "POST", body: payload }),
    onSuccess: () => {
      toast.success("Trabajador creado");
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["trabajadores"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error creando trabajador"),
  });

  const updateTrabajadorMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiRequest(`/trabajadores/${id}`, { method: "PATCH", body: payload }),
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
      toast.success("Trabajador eliminado");
      queryClient.invalidateQueries({ queryKey: ["trabajadores"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error eliminando trabajador"),
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(defaultForm);
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
      avatar: t.avatar,
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
    const payload = buildPayload();
    if (editingId) {
      updateTrabajadorMutation.mutate({ id: editingId, payload });
    } else {
      createTrabajadorMutation.mutate(payload);
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
              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar (URL)</Label>
                <Input
                  id="avatar"
                  placeholder="https://…"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                />
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
                        <AvatarImage src={trabajador.avatar || undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {getInitials(trabajador.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{trabajador.nombre}</div>
                        <div className="text-sm text-gray-600">
                          {trabajador.fechaIngreso
                            ? `Desde ${new Date(trabajador.fechaIngreso).toLocaleDateString()}`
                            : "—"}
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
                    <Badge className={getStatusColor(trabajador.estado)}>
                      {trabajador.estado}
                    </Badge>
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
                        title="¿Eliminar trabajador?"
                        description={`Esta acción eliminará a "${trabajador.nombre}" permanentemente.`}
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
