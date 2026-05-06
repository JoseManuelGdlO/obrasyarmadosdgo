import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Edit, Trash2, Building, Phone, Mail, MapPin, Star } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import { apiRequest } from "@/lib/api";

type EstadoBackend = "activo" | "inactivo" | "en_evaluacion";

type ProveedorBackend = {
  id: string;
  nombre: string;
  categoria: string;
  contacto?: string | null;
  contactoPrincipal?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  especialidades?: string[] | null;
  certificaciones?: string[] | null;
  tiempoRespuesta?: string | null;
  calificacion: number | string;
  ordenesCompletadas: number;
  costoPromedio: number | string;
  estado: EstadoBackend;
};

type ProveedorVM = {
  id: string;
  nombre: string;
  categoria: string;
  contactoPrincipal: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  especialidades: string[];
  certificaciones: string[];
  tiempoRespuesta: string;
  calificacion: number;
  ordenesCompletadas: number;
  costoPromedio: number;
  estado: "Activo" | "Inactivo" | "En Evaluación";
};

const categorias = [
  "Mantenimiento Mecánico",
  "Mantenimiento Eléctrico",
  "Hidráulicos",
  "Soldadura y Fabricación",
  "Neumáticos",
  "Diagnóstico",
  "Pintura y Acabados",
];
const estados = ["Activo", "Inactivo", "En Evaluación"];

const estadoToBackend = (estado: string): EstadoBackend => {
  switch (estado) {
    case "Activo":
      return "activo";
    case "Inactivo":
      return "inactivo";
    case "En Evaluación":
      return "en_evaluacion";
    default:
      return "activo";
  }
};

const estadoToUi = (estado: EstadoBackend | string | null | undefined): "Activo" | "Inactivo" | "En Evaluación" => {
  switch (estado) {
    case "inactivo":
      return "Inactivo";
    case "en_evaluacion":
      return "En Evaluación";
    case "activo":
    default:
      return "Activo";
  }
};

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);

const csvToList = (value: string): string[] =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const mapProveedor = (p: ProveedorBackend): ProveedorVM => ({
  id: p.id,
  nombre: p.nombre || "",
  categoria: p.categoria || "general",
  contactoPrincipal: p.contactoPrincipal || p.contacto || "",
  telefono: p.telefono || "",
  email: p.email || "",
  direccion: p.direccion || "",
  ciudad: p.ciudad || "",
  especialidades: Array.isArray(p.especialidades) ? p.especialidades : [],
  certificaciones: Array.isArray(p.certificaciones) ? p.certificaciones : [],
  tiempoRespuesta: p.tiempoRespuesta || "",
  calificacion: toNumber(p.calificacion, 0),
  ordenesCompletadas: toNumber(p.ordenesCompletadas, 0),
  costoPromedio: toNumber(p.costoPromedio, 0),
  estado: estadoToUi(p.estado),
});

const defaultForm = {
  nombre: "",
  categoria: "",
  contactoPrincipal: "",
  telefono: "",
  email: "",
  direccion: "",
  ciudad: "",
  especialidades: "",
  certificaciones: "",
  tiempoRespuesta: "",
  calificacion: "0",
  ordenesCompletadas: "0",
  costoPromedio: "0",
  estado: "Activo" as "Activo" | "Inactivo" | "En Evaluación",
};

export default function Proveedores() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm);

  const { data: proveedoresData } = useQuery({
    queryKey: ["proveedores", searchTerm],
    queryFn: () =>
      apiRequest<{ proveedores: ProveedorBackend[] }>(
        `/proveedores?q=${encodeURIComponent(searchTerm)}`
      ),
  });

  const proveedores: ProveedorVM[] = useMemo(
    () => (proveedoresData?.proveedores || []).map(mapProveedor),
    [proveedoresData?.proveedores]
  );

  const buildPayload = () => ({
    nombre: formData.nombre.trim(),
    categoria: formData.categoria.trim() || "general",
    contactoPrincipal: formData.contactoPrincipal.trim() || null,
    contacto: formData.contactoPrincipal.trim() || null,
    telefono: formData.telefono.trim() || null,
    email: formData.email.trim() || null,
    direccion: formData.direccion.trim() || null,
    ciudad: formData.ciudad.trim() || null,
    tiempoRespuesta: formData.tiempoRespuesta.trim() || null,
    especialidades: csvToList(formData.especialidades),
    certificaciones: csvToList(formData.certificaciones),
    calificacion: toNumber(formData.calificacion, 0),
    ordenesCompletadas: Math.max(0, Math.floor(toNumber(formData.ordenesCompletadas, 0))),
    costoPromedio: toNumber(formData.costoPromedio, 0),
    estado: estadoToBackend(formData.estado),
  });

  const createProveedorMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("/proveedores", { method: "POST", body: payload }),
    onSuccess: () => {
      toast.success("Proveedor creado");
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error creando proveedor"),
  });

  const updateProveedorMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiRequest(`/proveedores/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => {
      toast.success("Proveedor actualizado");
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error actualizando proveedor"),
  });

  const deleteProveedorMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/proveedores/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Proveedor eliminado");
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error eliminando proveedor"),
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

  const openEditDialog = (p: ProveedorVM) => {
    setEditingId(p.id);
    setFormData({
      nombre: p.nombre,
      categoria: p.categoria,
      contactoPrincipal: p.contactoPrincipal,
      telefono: p.telefono,
      email: p.email,
      direccion: p.direccion,
      ciudad: p.ciudad,
      especialidades: p.especialidades.join(", "),
      certificaciones: p.certificaciones.join(", "),
      tiempoRespuesta: p.tiempoRespuesta,
      calificacion: String(p.calificacion ?? 0),
      ordenesCompletadas: String(p.ordenesCompletadas ?? 0),
      costoPromedio: String(p.costoPromedio ?? 0),
      estado: p.estado,
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
      updateProveedorMutation.mutate({ id: editingId, payload });
    } else {
      createProveedorMutation.mutate(payload);
    }
  };

  const filteredProveedores = proveedores.filter((proveedor) => {
    const matchesCategoria = !selectedCategoria || proveedor.categoria === selectedCategoria;
    const matchesEstado = !selectedEstado || proveedor.estado === selectedEstado;
    return matchesCategoria && matchesEstado;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Activo": return "bg-green-100 text-green-800";
      case "Inactivo": return "bg-red-100 text-red-800";
      case "En Evaluación": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCalificacionStars = (calificacion: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(calificacion) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const totalProveedores = proveedores.length;
  const proveedoresActivos = proveedores.filter(p => p.estado === "Activo").length;
  const calificacionPromedio = totalProveedores > 0
    ? (proveedores.reduce((sum, p) => sum + p.calificacion, 0) / totalProveedores).toFixed(1)
    : "0.0";
  const ordenesTotales = proveedores.reduce((sum, p) => sum + p.ordenesCompletadas, 0);

  const isSubmitting = createProveedorMutation.isPending || updateProveedorMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600 mt-1">
            Gestiona empresas externas para órdenes de trabajo
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={openCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Proveedor" : "Agregar Nuevo Proveedor"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Empresa</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: TecniService Industrial"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactoPrincipal">Contacto Principal</Label>
                  <Input
                    id="contactoPrincipal"
                    placeholder="Ej: Ing. Carlos Martínez"
                    value={formData.contactoPrincipal}
                    onChange={(e) => setFormData({ ...formData, contactoPrincipal: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    placeholder="+52 555 1234"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    placeholder="Ej: Ciudad de México"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiempoRespuesta">Tiempo de Respuesta</Label>
                  <Input
                    id="tiempoRespuesta"
                    placeholder="Ej: 2-4 hrs"
                    value={formData.tiempoRespuesta}
                    onChange={(e) => setFormData({ ...formData, tiempoRespuesta: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) =>
                      setFormData({ ...formData, estado: value as typeof formData.estado })
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
                  <Label htmlFor="calificacion">Calificación (0-5)</Label>
                  <Input
                    id="calificacion"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.calificacion}
                    onChange={(e) => setFormData({ ...formData, calificacion: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ordenesCompletadas">Órdenes Completadas</Label>
                  <Input
                    id="ordenesCompletadas"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.ordenesCompletadas}
                    onChange={(e) => setFormData({ ...formData, ordenesCompletadas: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costoPromedio">Costo Promedio</Label>
                  <Input
                    id="costoPromedio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costoPromedio}
                    onChange={(e) => setFormData({ ...formData, costoPromedio: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  placeholder="Av. Industrial 123, Col. Industrial"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="especialidades">Especialidades</Label>
                <Textarea
                  id="especialidades"
                  placeholder="Ej: Motores Diesel, Sistemas Hidráulicos, Transmisiones (separar con comas)"
                  value={formData.especialidades}
                  onChange={(e) => setFormData({ ...formData, especialidades: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificaciones">Certificaciones</Label>
                <Textarea
                  id="certificaciones"
                  placeholder="Ej: ISO 9001, Caterpillar Certified (separar con comas)"
                  value={formData.certificaciones}
                  onChange={(e) => setFormData({ ...formData, certificaciones: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {editingId ? "Guardar Cambios" : "Crear Proveedor"}
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
          title="Total Proveedores"
          value={totalProveedores}
          icon={Building}
          trend={{ value: 2, isPositive: true }}
        />
        <StatCard
          title="Activos"
          value={proveedoresActivos}
          icon={Phone}
          trend={{ value: 1, isPositive: true }}
        />
        <StatCard
          title="Calificación Promedio"
          value={calificacionPromedio}
          icon={Star}
          trend={{ value: 0.2, isPositive: true }}
        />
        <StatCard
          title="Órdenes Completadas"
          value={ordenesTotales}
          icon={Mail}
          trend={{ value: 12, isPositive: true }}
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
                  placeholder="Buscar por nombre, especialidad o contacto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
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

      {/* Tabla de Proveedores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Lista de Proveedores ({filteredProveedores.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Rendimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProveedores.map((proveedor) => (
                <TableRow key={proveedor.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{proveedor.nombre}</div>
                      <div className="text-sm text-gray-600">{proveedor.categoria}</div>
                      <div className="flex items-center gap-1">
                        {getCalificacionStars(proveedor.calificacion)}
                        <span className="text-xs text-gray-600 ml-1">
                          {proveedor.calificacion.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {proveedor.especialidades.slice(0, 2).map((esp, index) => (
                        <Badge key={index} variant="secondary" className="text-xs mr-1">
                          {esp}
                        </Badge>
                      ))}
                      {proveedor.especialidades.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{proveedor.especialidades.length - 2} más
                        </div>
                      )}
                      {proveedor.especialidades.length === 0 && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{proveedor.contactoPrincipal || "—"}</div>
                      {proveedor.telefono && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {proveedor.telefono}
                        </div>
                      )}
                      {proveedor.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          {proveedor.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {proveedor.ciudad || "—"}
                      </div>
                      {proveedor.tiempoRespuesta && (
                        <div className="text-xs text-gray-500">
                          Respuesta: {proveedor.tiempoRespuesta}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {proveedor.ordenesCompletadas} órdenes
                      </div>
                      <div className="text-xs text-gray-600">
                        Promedio: {formatCurrency(proveedor.costoPromedio)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(proveedor.estado)}>
                      {proveedor.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openEditDialog(proveedor)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <ConfirmDeleteButton
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="¿Eliminar proveedor?"
                        description={`Esta acción eliminará a "${proveedor.nombre}" permanentemente.`}
                        onConfirm={() => deleteProveedorMutation.mutate(proveedor.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </ConfirmDeleteButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredProveedores.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron proveedores que coincidan con los filtros
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
