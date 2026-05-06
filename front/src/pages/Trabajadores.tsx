import { useState } from "react";
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

// Datos de ejemplo
const trabajadores = [
  {
    id: 1,
    nombre: "Juan Carlos Méndez",
    email: "juan.mendez@mantpro.com",
    telefono: "+52 555 0123",
    cargo: "Técnico Mecánico Senior",
    departamento: "Mantenimiento",
    especialidad: "Motores Diesel",
    estado: "Activo",
    fechaIngreso: "2022-03-15",
    experiencia: "8 años",
    avatar: null
  },
  {
    id: 2,
    nombre: "María Elena Rodríguez",
    email: "maria.rodriguez@mantpro.com",
    telefono: "+52 555 0124",
    cargo: "Supervisora de Mantenimiento",
    departamento: "Mantenimiento",
    especialidad: "Sistemas Hidráulicos",
    estado: "Activo",
    fechaIngreso: "2020-01-10",
    experiencia: "12 años",
    avatar: null
  },
  {
    id: 3,
    nombre: "Carlos Alberto Fernández",
    email: "carlos.fernandez@mantpro.com",
    telefono: "+52 555 0125",
    cargo: "Operador de Maquinaria",
    departamento: "Operaciones",
    especialidad: "Excavadoras",
    estado: "Activo",
    fechaIngreso: "2023-06-01",
    experiencia: "5 años",
    avatar: null
  },
  {
    id: 4,
    nombre: "Ana Patricia Ruiz",
    email: "ana.ruiz@mantpro.com",
    telefono: "+52 555 0126",
    cargo: "Técnico Eléctrico",
    departamento: "Mantenimiento",
    especialidad: "Sistemas Eléctricos",
    estado: "Activo",
    fechaIngreso: "2021-11-20",
    experiencia: "6 años",
    avatar: null
  },
  {
    id: 5,
    nombre: "Roberto Sánchez García",
    email: "roberto.sanchez@mantpro.com",
    telefono: "+52 555 0127",
    cargo: "Jefe de Mantenimiento",
    departamento: "Mantenimiento",
    especialidad: "Gestión de Mantenimiento",
    estado: "Activo",
    fechaIngreso: "2019-08-12",
    experiencia: "15 años",
    avatar: null
  },
  {
    id: 6,
    nombre: "Laura Beatriz López",
    email: "laura.lopez@mantpro.com",
    telefono: "+52 555 0128",
    cargo: "Técnico de Soldadura",
    departamento: "Mantenimiento",
    especialidad: "Soldadura Industrial",
    estado: "Vacaciones",
    fechaIngreso: "2022-09-05",
    experiencia: "4 años",
    avatar: null
  },
  {
    id: 7,
    nombre: "Miguel Ángel Torres",
    email: "miguel.torres@mantpro.com",
    telefono: "+52 555 0129",
    cargo: "Operador de Grúa",
    departamento: "Operaciones",
    especialidad: "Grúas Torre",
    estado: "Inactivo",
    fechaIngreso: "2018-04-22",
    experiencia: "10 años",
    avatar: null
  },
  {
    id: 8,
    nombre: "Carmen Dolores Jiménez",
    email: "carmen.jimenez@mantpro.com",
    telefono: "+52 555 0130",
    cargo: "Coordinadora de Proyectos",
    departamento: "Proyectos",
    especialidad: "Gestión de Proyectos",
    estado: "Activo",
    fechaIngreso: "2020-12-03",
    experiencia: "9 años",
    avatar: null
  }
];

const departamentos = ["Mantenimiento", "Operaciones", "Proyectos", "Administración"];
const estados = ["Activo", "Inactivo", "Vacaciones", "Licencia"];

export default function Trabajadores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartamento, setSelectedDepartamento] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    cargo: "",
    departamento: "",
    especialidad: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Crear trabajador:", formData);
    setIsDialogOpen(false);
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      cargo: "",
      departamento: "",
      especialidad: "",
    });
  };

  const filteredTrabajadores = trabajadores.filter((trabajador) => {
    const matchesSearch = 
      trabajador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trabajador.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trabajador.especialidad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartamento = !selectedDepartamento || trabajador.departamento === selectedDepartamento;
    const matchesEstado = !selectedEstado || trabajador.estado === selectedEstado;
    return matchesSearch && matchesDepartamento && matchesEstado;
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
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Estadísticas
  const trabajadoresActivos = trabajadores.filter(t => t.estado === "Activo").length;
  const totalTrabajadores = trabajadores.length;
  const departamentosUnicos = [...new Set(trabajadores.map(t => t.departamento))].length;
  const enVacaciones = trabajadores.filter(t => t.estado === "Vacaciones").length;

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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Trabajador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Trabajador</DialogTitle>
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  placeholder="+52 555 0000"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  placeholder="Ej: Técnico Mecánico"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  required
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
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Crear Trabajador
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
                          Desde {new Date(trabajador.fechaIngreso).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {trabajador.cargo}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {trabajador.departamento}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {trabajador.especialidad}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{trabajador.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{trabajador.telefono}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(trabajador.estado)}>
                      {trabajador.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {trabajador.experiencia}
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
                      <ConfirmDeleteButton
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="¿Eliminar trabajador?"
                        description="Confirma que deseas eliminar este trabajador."
                        onConfirm={() => toast.info("Eliminación de trabajador pendiente de integrar con backend.")}
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