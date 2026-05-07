import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Settings, Truck, Building, Users, X } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

type MaquinaBackend = {
  id: string;
  nombre: string;
  tipo: string;
  modelo: string;
  placas: string;
  estado: string;
};

type ProyectoBackend = {
  id: string;
  nombre: string;
  clienteId?: string;
  cliente?: { id: string; nombre: string } | null;
};

type ClienteLite = { id: string; nombre: string };

type AsignacionBackend = {
  id: string;
  maquinaId: string;
  proyectoId: string;
  trabajadorId: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  estado: "activa" | "cerrada";
  proyecto?: ProyectoBackend & { cliente?: ClienteLite | null };
};

type ProyectoAsignadoVM = {
  asignacionId: string;
  proyectoId: string;
  proyectoNombre: string;
  clienteNombre: string;
  fechaAsignacion: string;
  tiempoAsignada: string;
};

const tiposMaquina = [
  "Excavadora",
  "Grúa",
  "Bulldozer",
  "Pavimentadora",
  "Compactadora",
  "Montacargas",
  "Camión",
  "Retroexcavadora",
  "Soldadora",
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const getMachineStatusColor = (status: string) => {
  switch (status) {
    case "Operativa":
      return "bg-green-100 text-green-800";
    case "Disponible":
      return "bg-blue-100 text-blue-800";
    case "Mantenimiento":
      return "bg-yellow-100 text-yellow-800";
    case "Fuera de Servicio":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/** Máquinas que pueden recibir una nueva asignación de proyecto (sin bloquear por estado Operativa/Disponible). */
const puedeRecibirAsignacionProyecto = (
  maquina: MaquinaBackend,
  tieneAsignacionActiva: boolean
) =>
  !tieneAsignacionActiva && maquina.estado !== "Fuera de Servicio";

const formatTiempoAsignada = (fechaInicio: string | null): string => {
  if (!fechaInicio) return "—";
  const inicio = new Date(fechaInicio);
  if (Number.isNaN(inicio.getTime())) return "—";
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  inicio.setHours(0, 0, 0, 0);
  const diffMs = hoy.getTime() - inicio.getTime();
  const totalDias = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (totalDias === 0) return "Hoy";
  const meses = Math.floor(totalDias / 30);
  const dias = totalDias % 30;
  if (meses === 0) return `${totalDias} día${totalDias === 1 ? "" : "s"}`;
  if (dias === 0) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  return `${meses} ${meses === 1 ? "mes" : "meses"}, ${dias} día${dias === 1 ? "" : "s"}`;
};

export default function Asignaciones() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    maquinaId: "",
    proyectoId: "",
  });

  const { data: maquinasData } = useQuery({
    queryKey: ["asign-maquinas"],
    queryFn: () => apiRequest<{ maquinas: MaquinaBackend[] }>("/maquinas"),
  });

  const { data: proyectosData } = useQuery({
    queryKey: ["asign-proyectos"],
    queryFn: () => apiRequest<{ proyectos: ProyectoBackend[] }>("/proyectos"),
  });

  const { data: asignacionesData } = useQuery({
    queryKey: ["asignaciones-activas"],
    queryFn: () =>
      apiRequest<{ asignaciones: AsignacionBackend[] }>(
        "/asignaciones?estado=activa&include=proyecto"
      ),
  });

  const maquinas = useMemo(
    () => maquinasData?.maquinas || [],
    [maquinasData?.maquinas]
  );
  const proyectos = useMemo(
    () => proyectosData?.proyectos || [],
    [proyectosData?.proyectos]
  );
  const asignaciones = useMemo(
    () => asignacionesData?.asignaciones || [],
    [asignacionesData?.asignaciones]
  );

  const activasMap = useMemo(() => {
    const map = new Map<string, ProyectoAsignadoVM>();
    asignaciones.forEach((a) => {
      const proyectoNombre = a.proyecto?.nombre || "Proyecto";
      const clienteNombre = a.proyecto?.cliente?.nombre || "—";
      map.set(a.maquinaId, {
        asignacionId: a.id,
        proyectoId: a.proyectoId,
        proyectoNombre,
        clienteNombre,
        fechaAsignacion: a.fechaInicio || "",
        tiempoAsignada: formatTiempoAsignada(a.fechaInicio),
      });
    });
    return map;
  }, [asignaciones]);

  const createAsignacionMutation = useMutation({
    mutationFn: (payload: { maquinaId: string; proyectoId: string }) =>
      apiRequest("/asignaciones", { method: "POST", body: payload }),
    onSuccess: () => {
      toast.success("Asignación creada");
      setIsDialogOpen(false);
      setFormData({ maquinaId: "", proyectoId: "" });
      queryClient.invalidateQueries({ queryKey: ["asignaciones-activas"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error creando asignación"),
  });

  const closeAsignacionMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/asignaciones/${id}`, {
        method: "PATCH",
        body: { estado: "cerrada", fechaFin: todayISO() },
      }),
    onSuccess: () => {
      toast.success("Asignación cerrada");
      queryClient.invalidateQueries({ queryKey: ["asignaciones-activas"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error al desasignar"),
  });

  const filteredMaquinas = maquinas.filter((maquina) => {
    const term = searchTerm.toLowerCase();
    const proyectoAsignado = activasMap.get(maquina.id);
    const matchesSearch =
      (maquina.nombre || "").toLowerCase().includes(term) ||
      (maquina.tipo || "").toLowerCase().includes(term) ||
      (maquina.placas || "").toLowerCase().includes(term) ||
      (proyectoAsignado?.proyectoNombre.toLowerCase().includes(term) || false);
    const matchesTipo = selectedTipos.length === 0 || selectedTipos.includes(maquina.tipo);
    const matchesEstado = selectedEstados.length === 0 || selectedEstados.includes(maquina.estado);
    return matchesSearch && matchesTipo && matchesEstado;
  });

  const toggleTipo = (tipo: string) => {
    setSelectedTipos((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const toggleEstado = (estado: string) => {
    setSelectedEstados((prev) =>
      prev.includes(estado) ? prev.filter((e) => e !== estado) : [...prev, estado]
    );
  };

  const clearTipos = () => setSelectedTipos([]);
  const clearEstados = () => setSelectedEstados([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.maquinaId || !formData.proyectoId) {
      toast.error("Selecciona máquina y proyecto");
      return;
    }
    createAsignacionMutation.mutate({
      maquinaId: formData.maquinaId,
      proyectoId: formData.proyectoId,
    });
  };

  const maquinasAsignables = maquinas.filter((m) =>
    puedeRecibirAsignacionProyecto(m, activasMap.has(m.id))
  );

  const maquinasAsignadas = activasMap.size;
  const maquinasDisponibles = maquinas.filter(
    (m) => m.estado === "Disponible" && !activasMap.has(m.id)
  ).length;
  const maquinasOperativas = maquinas.filter((m) => m.estado === "Operativa").length;
  const maquinasMantenimiento = maquinas.filter((m) => m.estado === "Mantenimiento").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asignaciones</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las asignaciones de máquinas y proyectos
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Asignación
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Asignar Máquina a Proyecto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maquina">Máquina</Label>
                <Select
                  value={formData.maquinaId}
                  onValueChange={(value) => setFormData({ ...formData, maquinaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar máquina" />
                  </SelectTrigger>
                  <SelectContent>
                    {maquinasAsignables.map((maquina) => (
                      <SelectItem key={maquina.id} value={maquina.id}>
                        {maquina.nombre} - {maquina.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proyecto">Proyecto</Label>
                <Select
                  value={formData.proyectoId}
                  onValueChange={(value) => setFormData({ ...formData, proyectoId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {proyectos.map((proyecto) => (
                      <SelectItem key={proyecto.id} value={proyecto.id}>
                        {proyecto.nombre}
                        {proyecto.cliente?.nombre ? ` - ${proyecto.cliente.nombre}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createAsignacionMutation.isPending}
                >
                  {createAsignacionMutation.isPending ? "Asignando..." : "Asignar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
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
          title="Máquinas Asignadas"
          value={maquinasAsignadas}
          icon={Truck}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Disponibles"
          value={maquinasDisponibles}
          icon={Users}
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard
          title="Operativas"
          value={maquinasOperativas}
          icon={Settings}
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard
          title="En Mantenimiento"
          value={maquinasMantenimiento}
          icon={Building}
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
                  placeholder="Buscar por máquina, tipo, placas o proyecto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>
                        Tipo {selectedTipos.length > 0 && `(${selectedTipos.length})`}
                      </span>
                    </div>
                    {selectedTipos.length > 0 && (
                      <X
                        className="h-4 w-4 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearTipos();
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-2">
                    <div className="font-medium text-sm mb-2">Seleccionar tipos</div>
                    {tiposMaquina.map((tipo) => (
                      <div key={tipo} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tipo-${tipo}`}
                          checked={selectedTipos.includes(tipo)}
                          onCheckedChange={() => toggleTipo(tipo)}
                        />
                        <Label
                          htmlFor={`tipo-${tipo}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {tipo}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-full sm:w-48">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>
                        Estado {selectedEstados.length > 0 && `(${selectedEstados.length})`}
                      </span>
                    </div>
                    {selectedEstados.length > 0 && (
                      <X
                        className="h-4 w-4 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearEstados();
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-2">
                    <div className="font-medium text-sm mb-2">Seleccionar estados</div>
                    {["Operativa", "Disponible", "Mantenimiento", "Fuera de Servicio"].map(
                      (estado) => (
                        <div key={estado} className="flex items-center space-x-2">
                          <Checkbox
                            id={`estado-${estado}`}
                            checked={selectedEstados.includes(estado)}
                            onCheckedChange={() => toggleEstado(estado)}
                          />
                          <Label
                            htmlFor={`estado-${estado}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {estado}
                          </Label>
                        </div>
                      )
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Máquinas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Lista de Máquinas ({filteredMaquinas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Máquina</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Placas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Proyecto Asignado</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tiempo Asignada</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaquinas.map((maquina) => {
                const proyectoAsignado = activasMap.get(maquina.id) || null;
                return (
                  <TableRow key={maquina.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{maquina.nombre}</div>
                        <div className="text-sm text-gray-600">{maquina.modelo}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{maquina.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {maquina.placas}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMachineStatusColor(maquina.estado)}>
                        {maquina.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {proyectoAsignado ? (
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {proyectoAsignado.proyectoNombre}
                          </div>
                          {proyectoAsignado.fechaAsignacion && (
                            <div className="text-xs text-gray-600">
                              Desde:{" "}
                              {new Date(proyectoAsignado.fechaAsignacion).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {proyectoAsignado ? (
                        <span className="text-gray-600">
                          {proyectoAsignado.clienteNombre}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {proyectoAsignado ? (
                        <span className="text-gray-600 font-medium">
                          {proyectoAsignado.tiempoAsignada}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        {proyectoAsignado ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={closeAsignacionMutation.isPending}
                            onClick={() =>
                              closeAsignacionMutation.mutate(proyectoAsignado.asignacionId)
                            }
                          >
                            Desasignar
                          </Button>
                        ) : (
                          puedeRecibirAsignacionProyecto(
                            maquina,
                            activasMap.has(maquina.id)
                          ) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFormData({
                                  maquinaId: maquina.id,
                                  proyectoId: "",
                                });
                                setIsDialogOpen(true);
                              }}
                            >
                              Asignar
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredMaquinas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron máquinas que coincidan con los filtros
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
