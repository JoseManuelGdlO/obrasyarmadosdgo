import { useState } from "react";
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Datos de ejemplo para nomenclaturas
const nomenclaturas = [
  {
    id: 1,
    codigo: "MCU",
    descripcion: "MANTENIMIENTO CORRECTIVO URGENTE",
    categoria: "Mantenimiento",
    activo: true,
    fechaCreacion: "2024-01-15",
  },
  {
    id: 2,
    codigo: "MCP",
    descripcion: "MANTENIMIENTO CORRECTIVO PROGRAMADO",
    categoria: "Mantenimiento",
    activo: true,
    fechaCreacion: "2024-01-15",
  },
  {
    id: 3,
    codigo: "MPR",
    descripcion: "MANTENIMIENTO PREVENTIVO RUTINARIO",
    categoria: "Mantenimiento",
    activo: true,
    fechaCreacion: "2024-01-16",
  },
  {
    id: 4,
    codigo: "INS",
    descripcion: "INSPECCIÓN DE SEGURIDAD",
    categoria: "Inspección",
    activo: true,
    fechaCreacion: "2024-01-17",
  },
  {
    id: 5,
    codigo: "REP",
    descripcion: "REPARACIÓN GENERAL",
    categoria: "Reparación",
    activo: false,
    fechaCreacion: "2024-01-18",
  },
];

const categorias = ["Mantenimiento", "Inspección", "Reparación", "Instalación", "Calibración"];

export default function Nomenclaturas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Formulario para nueva nomenclatura
  const [formData, setFormData] = useState({
    codigo: "",
    descripcion: "",
    categoria: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Crear nomenclatura:", formData);
    setIsDialogOpen(false);
    setFormData({ codigo: "", descripcion: "", categoria: "" });
  };

  const filteredNomenclaturas = nomenclaturas.filter((nomenclatura) => {
    const matchesSearch = 
      nomenclatura.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nomenclatura.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || nomenclatura.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nomenclaturas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las nomenclaturas para órdenes de trabajo
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Nomenclatura
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Nomenclatura</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  placeholder="Ej: MCU"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Ej: MANTENIMIENTO CORRECTIVO URGENTE"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
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
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Crear Nomenclatura
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

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por código o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todas las categorías" />
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
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Nomenclaturas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Lista de Nomenclaturas ({filteredNomenclaturas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNomenclaturas.map((nomenclatura) => (
                <TableRow key={nomenclatura.id} className="hover:bg-gray-50">
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {nomenclatura.codigo}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">
                    {nomenclatura.descripcion}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {nomenclatura.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={nomenclatura.activo ? "default" : "destructive"}
                    >
                      {nomenclatura.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(nomenclatura.fechaCreacion).toLocaleDateString()}
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
          
          {filteredNomenclaturas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron nomenclaturas que coincidan con los filtros
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}