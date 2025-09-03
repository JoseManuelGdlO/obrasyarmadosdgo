import { useState } from "react";
import { Plus, Search, Filter, Settings, Truck, Building, Calendar, Users } from "lucide-react";
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

// Datos de ejemplo - Máquinas con sus asignaciones
const maquinas = [
  {
    id: 1,
    nombre: "Excavadora CAT 320",
    tipo: "Excavadora",
    modelo: "CAT 320 GC",
    placas: "MX-123-ABC",
    estado: "Operativa",
    proyectoAsignado: {
      id: 1,
      nombre: "Construcción Edificio Central",
      cliente: "Constructora ABC",
      fechaAsignacion: "2024-01-15",
      tiempoAsignada: "2 meses, 18 días"
    }
  },
  {
    id: 2,
    nombre: "Grúa Tower Crane 50",
    tipo: "Grúa",
    modelo: "Liebherr 150 EC-B",
    placas: "MX-456-DEF", 
    estado: "Operativa",
    proyectoAsignado: {
      id: 1,
      nombre: "Construcción Edificio Central",
      cliente: "Constructora ABC",
      fechaAsignacion: "2024-01-20",
      tiempoAsignada: "2 meses, 13 días"
    }
  },
  {
    id: 3,
    nombre: "Bulldozer D6",
    tipo: "Bulldozer",
    modelo: "CAT D6T",
    placas: "MX-789-GHI",
    estado: "Mantenimiento",
    proyectoAsignado: {
      id: 1,
      nombre: "Construcción Edificio Central",
      cliente: "Constructora ABC",
      fechaAsignacion: "2024-01-10",
      tiempoAsignada: "2 meses, 23 días"
    }
  },
  {
    id: 4,
    nombre: "Pavimentadora P385",
    tipo: "Pavimentadora",
    modelo: "Volvo P6820D",
    placas: "MX-101-JKL",
    estado: "Operativa",
    proyectoAsignado: {
      id: 2,
      nombre: "Reparación Carretera Norte",
      cliente: "Municipalidad",
      fechaAsignacion: "2024-02-01",
      tiempoAsignada: "1 mes, 2 días"
    }
  },
  {
    id: 5,
    nombre: "Compactadora CS-533",
    tipo: "Compactadora",
    modelo: "CAT CS-533E",
    placas: "MX-202-MNO",
    estado: "Operativa",
    proyectoAsignado: {
      id: 2,
      nombre: "Reparación Carretera Norte",
      cliente: "Municipalidad",
      fechaAsignacion: "2024-02-05",
      tiempoAsignada: "29 días"
    }
  },
  {
    id: 6,
    nombre: "Montacargas FL-200",
    tipo: "Montacargas",
    modelo: "Toyota 8FD25",
    placas: "MX-303-PQR",
    estado: "Disponible",
    proyectoAsignado: null
  },
  {
    id: 7,
    nombre: "Excavadora JCB 8080",
    tipo: "Excavadora", 
    modelo: "JCB 8080 Midi",
    placas: "MX-404-STU",
    estado: "Disponible",
    proyectoAsignado: null
  },
  {
    id: 8,
    nombre: "Camión Volvo FH16",
    tipo: "Camión",
    modelo: "Volvo FH16 750",
    placas: "MX-505-VWX",
    estado: "Disponible",
    proyectoAsignado: null
  },
  {
    id: 9,
    nombre: "Retroexcavadora 420F",
    tipo: "Retroexcavadora",
    modelo: "CAT 420F2",
    placas: "MX-606-YZA",
    estado: "Fuera de Servicio",
    proyectoAsignado: null
  },
  {
    id: 10,
    nombre: "Soldadora Miller 350",
    tipo: "Soldadora",
    modelo: "Miller Trailblazer 325",
    placas: "MX-707-BCD",
    estado: "Disponible",
    proyectoAsignado: null
  }
];

const proyectosDisponibles = [
  { id: 1, nombre: "Construcción Edificio Central", cliente: "Constructora ABC" },
  { id: 2, nombre: "Reparación Carretera Norte", cliente: "Municipalidad" },
  { id: 3, nombre: "Desarrollo Residencial Sur", cliente: "Inmobiliaria XYZ" },
  { id: 4, nombre: "Mantenimiento Planta Industrial", cliente: "Industrias DEF" }
];

const tiposMaquina = ["Excavadora", "Grúa", "Bulldozer", "Pavimentadora", "Compactadora", "Montacargas", "Camión", "Retroexcavadora", "Soldadora"];

export default function Asignaciones() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    maquinaId: "",
    proyectoId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Asignar máquina a proyecto:", formData);
    setIsDialogOpen(false);
    setFormData({ maquinaId: "", proyectoId: "" });
  };

  const filteredMaquinas = maquinas.filter((maquina) => {
    const matchesSearch = 
      maquina.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.placas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (maquina.proyectoAsignado?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesTipo = !selectedTipo || maquina.tipo === selectedTipo;
    const matchesEstado = !selectedEstado || maquina.estado === selectedEstado;
    return matchesSearch && matchesTipo && matchesEstado;
  });

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
  const maquinasAsignadas = maquinas.filter(m => m.proyectoAsignado !== null).length;
  const maquinasDisponibles = maquinas.filter(m => m.proyectoAsignado === null && m.estado === "Disponible").length;
  const maquinasOperativas = maquinas.filter(m => m.estado === "Operativa").length;
  const maquinasMantenimiento = maquinas.filter(m => m.estado === "Mantenimiento").length;

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
                <Select value={formData.maquinaId} onValueChange={(value) => setFormData({ ...formData, maquinaId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar máquina" />
                  </SelectTrigger>
                  <SelectContent>
                    {maquinas.filter(m => m.proyectoAsignado === null && m.estado === "Disponible").map((maquina) => (
                      <SelectItem key={maquina.id} value={maquina.id.toString()}>
                        {maquina.nombre} - {maquina.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proyecto">Proyecto</Label>
                <Select value={formData.proyectoId} onValueChange={(value) => setFormData({ ...formData, proyectoId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {proyectosDisponibles.map((proyecto) => (
                      <SelectItem key={proyecto.id} value={proyecto.id.toString()}>
                        {proyecto.nombre} - {proyecto.cliente}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Asignar
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
            <div className="w-full sm:w-40">
              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposMaquina.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operativa">Operativa</SelectItem>
                  <SelectItem value="Disponible">Disponible</SelectItem>
                  <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="Fuera de Servicio">Fuera de Servicio</SelectItem>
                </SelectContent>
              </Select>
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
              {filteredMaquinas.map((maquina) => (
                <TableRow key={maquina.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{maquina.nombre}</div>
                      <div className="text-sm text-gray-600">{maquina.modelo}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {maquina.tipo}
                    </Badge>
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
                    {maquina.proyectoAsignado ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {maquina.proyectoAsignado.nombre}
                        </div>
                        <div className="text-xs text-gray-600">
                          Desde: {new Date(maquina.proyectoAsignado.fechaAsignacion).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {maquina.proyectoAsignado ? (
                      <span className="text-gray-600">
                        {maquina.proyectoAsignado.cliente}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {maquina.proyectoAsignado ? (
                      <span className="text-gray-600 font-medium">
                        {maquina.proyectoAsignado.tiempoAsignada}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-center">
                      {maquina.proyectoAsignado ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          Desasignar
                        </Button>
                      ) : (
                        maquina.estado === "Disponible" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMachine(maquina.id);
                              setFormData({ ...formData, maquinaId: maquina.id.toString() });
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
              ))}
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