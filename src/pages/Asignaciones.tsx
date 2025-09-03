import { useState } from "react";
import { Plus, Search, Filter, Settings, Truck, Building, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";

// Datos de ejemplo
const proyectos = [
  {
    id: 1,
    nombre: "Construcción Edificio Central",
    cliente: "Constructora ABC",
    estado: "Activo",
    fechaInicio: "2024-01-15",
    fechaFin: "2024-06-30",
    maquinasAsignadas: [
      { id: 1, nombre: "Excavadora CAT 320", tipo: "Excavadora", estado: "Operativa" },
      { id: 2, nombre: "Grúa Tower Crane 50", tipo: "Grúa", estado: "Operativa" },
      { id: 3, nombre: "Bulldozer D6", tipo: "Bulldozer", estado: "Mantenimiento" },
    ]
  },
  {
    id: 2,
    nombre: "Reparación Carretera Norte",
    cliente: "Municipalidad",
    estado: "Activo",
    fechaInicio: "2024-02-01",
    fechaFin: "2024-04-15",
    maquinasAsignadas: [
      { id: 4, nombre: "Pavimentadora P385", tipo: "Pavimentadora", estado: "Operativa" },
      { id: 5, nombre: "Compactadora CS-533", tipo: "Compactadora", estado: "Operativa" },
    ]
  },
  {
    id: 3,
    nombre: "Desarrollo Residencial Sur",
    cliente: "Inmobiliaria XYZ",
    estado: "Planificado",
    fechaInicio: "2024-03-01",
    fechaFin: "2024-08-30",
    maquinasAsignadas: []
  },
  {
    id: 4,
    nombre: "Mantenimiento Planta Industrial",
    cliente: "Industrias DEF",
    estado: "Completado",
    fechaInicio: "2023-12-01",
    fechaFin: "2024-01-15",
    maquinasAsignadas: [
      { id: 6, nombre: "Montacargas FL-200", tipo: "Montacargas", estado: "Disponible" },
    ]
  }
];

const maquinasDisponibles = [
  { id: 7, nombre: "Excavadora JCB 8080", tipo: "Excavadora", estado: "Disponible" },
  { id: 8, nombre: "Camión Volvo FH16", tipo: "Camión", estado: "Disponible" },
  { id: 9, nombre: "Retroexcavadora 420F", tipo: "Retroexcavadora", estado: "Disponible" },
  { id: 10, nombre: "Soldadora Miller 350", tipo: "Soldadora", estado: "Disponible" },
];

export default function Asignaciones() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    proyectoId: "",
    maquinaId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Asignar máquina:", formData);
    setIsDialogOpen(false);
    setFormData({ proyectoId: "", maquinaId: "" });
  };

  const filteredProyectos = proyectos.filter((proyecto) => {
    const matchesSearch = 
      proyecto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proyecto.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = !selectedEstado || proyecto.estado === selectedEstado;
    return matchesSearch && matchesEstado;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Activo": return "bg-green-100 text-green-800";
      case "Planificado": return "bg-blue-100 text-blue-800";
      case "Completado": return "bg-gray-100 text-gray-800";
      case "Pausado": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMachineStatusColor = (status: string) => {
    switch (status) {
      case "Operativa": return "bg-green-100 text-green-800";
      case "Disponible": return "bg-blue-100 text-blue-800";
      case "Mantenimiento": return "bg-yellow-100 text-yellow-800";
      case "Fuera de Servicio": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Estadísticas
  const proyectosActivos = proyectos.filter(p => p.estado === "Activo").length;
  const totalMaquinasAsignadas = proyectos.reduce((sum, p) => sum + p.maquinasAsignadas.length, 0);
  const maquinasEnUso = proyectos.flatMap(p => p.maquinasAsignadas.filter(m => m.estado === "Operativa")).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asignaciones</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las asignaciones de máquinas a proyectos
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
                <Label htmlFor="proyecto">Proyecto</Label>
                <Select value={formData.proyectoId} onValueChange={(value) => setFormData({ ...formData, proyectoId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {proyectos.filter(p => p.estado === "Activo" || p.estado === "Planificado").map((proyecto) => (
                      <SelectItem key={proyecto.id} value={proyecto.id.toString()}>
                        {proyecto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maquina">Máquina Disponible</Label>
                <Select value={formData.maquinaId} onValueChange={(value) => setFormData({ ...formData, maquinaId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar máquina" />
                  </SelectTrigger>
                  <SelectContent>
                    {maquinasDisponibles.map((maquina) => (
                      <SelectItem key={maquina.id} value={maquina.id.toString()}>
                        {maquina.nombre} - {maquina.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Asignar Máquina
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
          title="Proyectos Activos"
          value={proyectosActivos}
          icon={Building}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Máquinas Asignadas"
          value={totalMaquinasAsignadas}
          icon={Truck}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Máquinas en Uso"
          value={maquinasEnUso}
          icon={Settings}
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard
          title="Disponibles"
          value={maquinasDisponibles.length}
          icon={Users}
          trend={{ value: 3, isPositive: true }}
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
                  placeholder="Buscar por proyecto o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Planificado">Planificado</SelectItem>
                  <SelectItem value="Completado">Completado</SelectItem>
                  <SelectItem value="Pausado">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Proyectos y Asignaciones */}
      <div className="space-y-4">
        {filteredProyectos.map((proyecto) => (
          <Card key={proyecto.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{proyecto.nombre}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {proyecto.cliente}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(proyecto.fechaInicio).toLocaleDateString()} - {new Date(proyecto.fechaFin).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge className={getStatusColor(proyecto.estado)}>
                  {proyecto.estado}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    Máquinas Asignadas ({proyecto.maquinasAsignadas.length})
                  </h4>
                  {proyecto.estado === "Activo" || proyecto.estado === "Planificado" ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedProject(proyecto.id);
                        setFormData({ ...formData, proyectoId: proyecto.id.toString() });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Asignar
                    </Button>
                  ) : null}
                </div>
                
                {proyecto.maquinasAsignadas.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {proyecto.maquinasAsignadas.map((maquina) => (
                      <div key={maquina.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-gray-600" />
                              <span className="font-medium text-sm">{maquina.nombre}</span>
                            </div>
                            <p className="text-xs text-gray-600">{maquina.tipo}</p>
                          </div>
                          <Badge className={`${getMachineStatusColor(maquina.estado)} text-xs`}>
                            {maquina.estado}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    <Truck className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No hay máquinas asignadas a este proyecto</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProyectos.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500">
              No se encontraron proyectos que coincidan con los filtros
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}