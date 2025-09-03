import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Truck, Building, Calendar, Gauge } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";

// Datos de ejemplo - Máquinas por cliente
const maquinas = [
  {
    id: 1,
    nombre: "Excavadora CAT 320",
    tipo: "Excavadora",
    marca: "Caterpillar",
    modelo: "320 GC",
    placas: "MX-123-ABC",
    numeroSerie: "CAT123456789",
    cliente: "Constructora ABC",
    estado: "Operativa",
    horometroInicial: 1500,
    horometroActual: 2340,
    horometroFinal: 8000,
    disponibilidad: 92,
    fechaAdquisicion: "2022-03-15",
    ubicacion: "Obra Centro",
    ultimoMantenimiento: "2024-02-15"
  },
  {
    id: 2,
    nombre: "Grúa Tower Crane 50",
    tipo: "Grúa",
    marca: "Liebherr",
    modelo: "150 EC-B",
    placas: "MX-456-DEF",
    numeroSerie: "LIE987654321",
    cliente: "Constructora ABC",
    estado: "Operativa",
    horometroInicial: 800,
    horometroActual: 1650,
    horometroFinal: 6000,
    disponibilidad: 88,
    fechaAdquisicion: "2023-01-20",
    ubicacion: "Obra Centro",
    ultimoMantenimiento: "2024-01-30"
  },
  {
    id: 3,
    nombre: "Bulldozer D6",
    tipo: "Bulldozer",
    marca: "Caterpillar", 
    modelo: "D6T",
    placas: "MX-789-GHI",
    numeroSerie: "CAT456789123",
    cliente: "Constructora ABC",
    estado: "Mantenimiento",
    horometroInicial: 2200,
    horometroActual: 3890,
    horometroFinal: 10000,
    disponibilidad: 75,
    fechaAdquisicion: "2021-11-10",
    ubicacion: "Taller Principal",
    ultimoMantenimiento: "2024-03-01"
  },
  {
    id: 4,
    nombre: "Pavimentadora P385",
    tipo: "Pavimentadora",
    marca: "Volvo",
    modelo: "P6820D",
    placas: "MX-101-JKL",
    numeroSerie: "VOL789123456",
    cliente: "Municipalidad",
    estado: "Operativa",
    horometroInicial: 900,
    horometroActual: 1456,
    horometroFinal: 7000,
    disponibilidad: 95,
    fechaAdquisicion: "2023-06-05",
    ubicacion: "Carretera Norte",
    ultimoMantenimiento: "2024-02-20"
  },
  {
    id: 5,
    nombre: "Compactadora CS-533",
    tipo: "Compactadora",
    marca: "Caterpillar",
    modelo: "CS-533E",
    placas: "MX-202-MNO",
    numeroSerie: "CAT654321987",
    cliente: "Municipalidad",
    estado: "Operativa",
    horometroInicial: 600,
    horometroActual: 1234,
    horometroFinal: 5500,
    disponibilidad: 90,
    fechaAdquisicion: "2023-08-12",
    ubicacion: "Carretera Norte",
    ultimoMantenimiento: "2024-02-10"
  },
  {
    id: 6,
    nombre: "Montacargas FL-200",
    tipo: "Montacargas",
    marca: "Toyota",
    modelo: "8FD25",
    placas: "MX-303-PQR",
    numeroSerie: "TOY321654987",
    cliente: "Industrias DEF",
    estado: "Disponible",
    horometroInicial: 300,
    horometroActual: 890,
    horometroFinal: 4000,
    disponibilidad: 98,
    fechaAdquisicion: "2023-12-01",
    ubicacion: "Almacén Central",
    ultimoMantenimiento: "2024-01-15"
  }
];

const clientes = ["Constructora ABC", "Municipalidad", "Industrias DEF", "Inmobiliaria XYZ"];
const clienteActual = "Constructora ABC"; // En producción esto vendría del contexto de autenticación
const tiposMaquina = ["Excavadora", "Grúa", "Bulldozer", "Pavimentadora", "Compactadora", "Montacargas", "Camión", "Retroexcavadora"];
const marcas = ["Caterpillar", "Liebherr", "Volvo", "Toyota", "JCB", "Komatsu", "John Deere"];
const estados = ["Operativa", "Disponible", "Mantenimiento", "Fuera de Servicio"];

export default function Maquinas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "",
    marca: "",
    modelo: "",
    placas: "",
    numeroSerie: "",
    cliente: clienteActual, // Se asigna automáticamente al cliente actual
    horometroInicial: "",
    horometroFinal: "",
    disponibilidad: "",
    fechaAdquisicion: "",
    ubicacion: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Crear máquina:", formData);
    setIsDialogOpen(false);
    setFormData({
      nombre: "",
      tipo: "",
      marca: "",
      modelo: "",
      placas: "",
      numeroSerie: "",
      cliente: clienteActual, // Se mantiene el cliente actual
      horometroInicial: "",
      horometroFinal: "",
      disponibilidad: "",
      fechaAdquisicion: "",
      ubicacion: "",
    });
  };

  // Filtrar solo las máquinas del cliente actual
  const maquinasDelCliente = maquinas.filter(m => m.cliente === clienteActual);
  
  const filteredMaquinas = maquinasDelCliente.filter((maquina) => {
    const matchesSearch = 
      maquina.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.placas.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = !selectedTipo || maquina.tipo === selectedTipo;
    const matchesEstado = !selectedEstado || maquina.estado === selectedEstado;
    return matchesSearch && matchesTipo && matchesEstado;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Operativa": return "bg-green-100 text-green-800";
      case "Disponible": return "bg-blue-100 text-blue-800";
      case "Mantenimiento": return "bg-yellow-100 text-yellow-800";
      case "Fuera de Servicio": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDisponibilidadColor = (disponibilidad: number) => {
    if (disponibilidad >= 90) return "text-green-600";
    if (disponibilidad >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const calcularVidaUtil = (inicial: number, actual: number, final: number) => {
    const progreso = ((actual - inicial) / (final - inicial)) * 100;
    return Math.min(Math.max(progreso, 0), 100);
  };

  // Estadísticas basadas en las máquinas del cliente actual
  const totalMaquinas = maquinasDelCliente.length;
  const maquinasOperativas = maquinasDelCliente.filter(m => m.estado === "Operativa").length;
  const maquinasDisponibles = maquinasDelCliente.filter(m => m.estado === "Disponible").length;
  const promedioDisponibilidad = maquinasDelCliente.length > 0 
    ? Math.round(maquinasDelCliente.reduce((sum, m) => sum + m.disponibilidad, 0) / maquinasDelCliente.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Máquinas</h1>
          <p className="text-gray-600 mt-1">
            Inventario de máquinas de {clienteActual}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Máquina
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Máquina</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Máquina</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Excavadora CAT 320"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
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
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    placeholder="Ej: Caterpillar"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    placeholder="Ej: 320 GC"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placas">Placas</Label>
                  <Input
                    id="placas"
                    placeholder="Ej: MX-123-ABC"
                    value={formData.placas}
                    onChange={(e) => setFormData({ ...formData, placas: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroSerie">Número de Serie</Label>
                  <Input
                    id="numeroSerie"
                    placeholder="Ej: CAT123456789"
                    value={formData.numeroSerie}
                    onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    placeholder="Ej: Obra Centro"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horometroInicial">Horómetro Inicial (hrs)</Label>
                  <Input
                    id="horometroInicial"
                    type="number"
                    placeholder="Ej: 1500"
                    value={formData.horometroInicial}
                    onChange={(e) => setFormData({ ...formData, horometroInicial: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horometroFinal">Horómetro Final (hrs)</Label>
                  <Input
                    id="horometroFinal"
                    type="number"
                    placeholder="Ej: 8000"
                    value={formData.horometroFinal}
                    onChange={(e) => setFormData({ ...formData, horometroFinal: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disponibilidad">Disponibilidad (%)</Label>
                  <Input
                    id="disponibilidad"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ej: 92"
                    value={formData.disponibilidad}
                    onChange={(e) => setFormData({ ...formData, disponibilidad: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaAdquisicion">Fecha de Adquisición</Label>
                  <Input
                    id="fechaAdquisicion"
                    type="date"
                    value={formData.fechaAdquisicion}
                    onChange={(e) => setFormData({ ...formData, fechaAdquisicion: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Crear Máquina
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
          title="Total Máquinas"
          value={totalMaquinas}
          icon={Truck}
          trend={{ value: 2, isPositive: true }}
        />
        <StatCard
          title="Operativas"
          value={maquinasOperativas}
          icon={Gauge}
          trend={{ value: 1, isPositive: true }}
        />
        <StatCard
          title="Disponibles"
          value={maquinasDisponibles}
          icon={Calendar}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Disponibilidad Promedio"
          value={`${promedioDisponibilidad}%`}
          icon={Building}
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
                  placeholder="Buscar por nombre, tipo o placas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-36">
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

      {/* Tabla de Máquinas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Inventario de Máquinas ({filteredMaquinas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Máquina</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Horómetro</TableHead>
                <TableHead>Vida Útil</TableHead>
                <TableHead>Disponibilidad</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaquinas.map((maquina) => {
                const vidaUtil = calcularVidaUtil(maquina.horometroInicial, maquina.horometroActual, maquina.horometroFinal);
                
                return (
                  <TableRow key={maquina.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{maquina.nombre}</div>
                        <div className="text-sm text-gray-600">
                          {maquina.marca} {maquina.modelo}
                        </div>
                        <div className="text-xs text-gray-500">
                          Placas: {maquina.placas}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(maquina.estado)}>
                        {maquina.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {maquina.horometroActual.toLocaleString()} hrs
                        </div>
                        <div className="text-xs text-gray-600">
                          Inicial: {maquina.horometroInicial.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">
                          Final: {maquina.horometroFinal.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Progress value={vidaUtil} className="flex-1 h-2" />
                          <span className="text-xs text-gray-600 min-w-[35px]">
                            {Math.round(vidaUtil)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {(maquina.horometroFinal - maquina.horometroActual).toLocaleString()} hrs restantes
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getDisponibilidadColor(maquina.disponibilidad)}`}>
                          {maquina.disponibilidad}%
                        </div>
                        <div className="text-xs text-gray-500">
                          disponible
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">
                          {maquina.ubicacion}
                        </div>
                        <div className="text-xs text-gray-500">
                          Últ. mant: {new Date(maquina.ultimoMantenimiento).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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