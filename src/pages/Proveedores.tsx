import { useState } from "react";
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

// Datos de ejemplo - Proveedores de mantenimiento
const proveedores = [
  {
    id: 1,
    nombre: "TecniService Industrial",
    especialidades: ["Motores Diesel", "Sistemas Hidráulicos", "Transmisiones"],
    categoria: "Mantenimiento Mecánico",
    contactoPrincipal: "Ing. Carlos Martínez",
    telefono: "+52 555 1234",
    email: "contacto@tecniservice.com",
    direccion: "Av. Industrial 123, Col. Industrial",
    ciudad: "Ciudad de México",
    calificacion: 4.8,
    estado: "Activo",
    tiempoRespuesta: "2-4 hrs",
    certificaciones: ["ISO 9001", "Caterpillar Certified"],
    fechaRegistro: "2023-01-15",
    ordenesCompletadas: 45,
    costoPromedio: "$2,500"
  },
  {
    id: 2,
    nombre: "ElectroMaq Solutions",
    especialidades: ["Sistemas Eléctricos", "Controles Electrónicos", "Cableado"],
    categoria: "Mantenimiento Eléctrico",
    contactoPrincipal: "Ing. Ana Rodríguez",
    telefono: "+52 555 5678",
    email: "servicios@electromaq.com",
    direccion: "Calle Electricistas 456, Col. Progreso",
    ciudad: "Guadalajara",
    calificacion: 4.6,
    estado: "Activo",
    tiempoRespuesta: "1-3 hrs",
    certificaciones: ["IEEE Certified", "Siemens Partner"],
    fechaRegistro: "2023-03-20",
    ordenesCompletadas: 32,
    costoPromedio: "$1,800"
  },
  {
    id: 3,
    nombre: "HidrauliCorp",
    especialidades: ["Sistemas Hidráulicos", "Bombas", "Cilindros"],
    categoria: "Hidráulicos",
    contactoPrincipal: "Ing. Roberto Silva",
    telefono: "+52 555 9012",
    email: "info@hidraulicorp.com",
    direccion: "Blvd. Industrial 789, Zona Industrial",
    ciudad: "Monterrey",
    calificacion: 4.9,
    estado: "Activo",
    tiempoRespuesta: "3-6 hrs",
    certificaciones: ["Parker Certified", "Bosch Rexroth"],
    fechaRegistro: "2022-11-08",
    ordenesCompletadas: 67,
    costoPromedio: "$3,200"
  },
  {
    id: 4,
    nombre: "SoldaMax Industrial",
    especialidades: ["Soldadura Industrial", "Reparación Estructural", "Fabricación"],
    categoria: "Soldadura y Fabricación",
    contactoPrincipal: "Téc. Miguel López",
    telefono: "+52 555 3456",
    email: "ventas@soldamax.com",
    direccion: "Av. Metalúrgica 321, Parque Industrial",
    ciudad: "Puebla",
    calificacion: 4.4,
    estado: "Activo",
    tiempoRespuesta: "4-8 hrs",
    certificaciones: ["AWS Certified", "Lincoln Electric"],
    fechaRegistro: "2023-06-12",
    ordenesCompletadas: 28,
    costoPromedio: "$2,100"
  },
  {
    id: 5,
    nombre: "Neumáticos y Más",
    especialidades: ["Neumáticos", "Llantas Industriales", "Balanceado"],
    categoria: "Neumáticos",
    contactoPrincipal: "Sr. Juan Pérez",
    telefono: "+52 555 7890",
    email: "contacto@neumaticosymas.com",
    direccion: "Carretera Nacional Km 15",
    ciudad: "Tijuana",
    calificacion: 4.2,
    estado: "Inactivo",
    tiempoRespuesta: "24 hrs",
    certificaciones: ["Michelin Dealer", "Goodyear Partner"],
    fechaRegistro: "2023-02-28",
    ordenesCompletadas: 19,
    costoPromedio: "$1,500"
  }
];

const categorias = ["Mantenimiento Mecánico", "Mantenimiento Eléctrico", "Hidráulicos", "Soldadura y Fabricación", "Neumáticos", "Diagnóstico", "Pintura y Acabados"];
const estados = ["Activo", "Inactivo", "En Evaluación"];

export default function Proveedores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Crear proveedor:", formData);
    setIsDialogOpen(false);
    setFormData({
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
    });
  };

  const filteredProveedores = proveedores.filter((proveedor) => {
    const matchesSearch = 
      proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.especialidades.some(esp => esp.toLowerCase().includes(searchTerm.toLowerCase())) ||
      proveedor.contactoPrincipal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = !selectedCategoria || proveedor.categoria === selectedCategoria;
    const matchesEstado = !selectedEstado || proveedor.estado === selectedEstado;
    return matchesSearch && matchesCategoria && matchesEstado;
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

  // Estadísticas
  const totalProveedores = proveedores.length;
  const proveedoresActivos = proveedores.filter(p => p.estado === "Activo").length;
  const calificacionPromedio = (proveedores.reduce((sum, p) => sum + p.calificacion, 0) / totalProveedores).toFixed(1);
  const ordenesTotales = proveedores.reduce((sum, p) => sum + p.ordenesCompletadas, 0);

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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Proveedor</DialogTitle>
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
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    placeholder="+52 555 1234"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    required
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
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    placeholder="Ej: Ciudad de México"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiempoRespuesta">Tiempo de Respuesta</Label>
                  <Input
                    id="tiempoRespuesta"
                    placeholder="Ej: 2-4 hrs"
                    value={formData.tiempoRespuesta}
                    onChange={(e) => setFormData({ ...formData, tiempoRespuesta: e.target.value })}
                    required
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="especialidades">Especialidades</Label>
                <Textarea
                  id="especialidades"
                  placeholder="Ej: Motores Diesel, Sistemas Hidráulicos, Transmisiones (separar con comas)"
                  value={formData.especialidades}
                  onChange={(e) => setFormData({ ...formData, especialidades: e.target.value })}
                  required
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
                <Button type="submit" className="flex-1">
                  Crear Proveedor
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
                          {proveedor.calificacion}
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
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{proveedor.contactoPrincipal}</div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        {proveedor.telefono}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        {proveedor.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {proveedor.ciudad}
                      </div>
                      <div className="text-xs text-gray-500">
                        Respuesta: {proveedor.tiempoRespuesta}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {proveedor.ordenesCompletadas} órdenes
                      </div>
                      <div className="text-xs text-gray-600">
                        Promedio: {proveedor.costoPromedio}
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