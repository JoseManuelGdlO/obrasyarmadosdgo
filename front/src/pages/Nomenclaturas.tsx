import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/api";
import NomenclaturaModal, { NomenclaturaFormData } from "@/components/modals/NomenclaturaModal";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";

const categorias = ["Mantenimiento", "Inspección", "Reparación", "Instalación", "Calibración"];

export default function Nomenclaturas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["nomenclaturas"],
    queryFn: () => apiRequest<{ nomenclaturas: Array<Record<string, unknown>> }>("/nomenclaturas"),
  });

  const nomenclaturas = (data?.nomenclaturas || []).map((item) => ({
    id: String(item.id || ""),
    codigo: String(item.codigo || ""),
    descripcion: String(item.nombre || ""),
    categoria: String(item.categoria || ""),
    activo: Boolean(item.activo),
    fechaCreacion: String(item.createdAt || "").slice(0, 10),
  }));

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("/nomenclaturas", { method: "POST", body: payload }),
    onSuccess: () => {
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["nomenclaturas"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiRequest(`/nomenclaturas/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => {
      setIsDialogOpen(false);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["nomenclaturas"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/nomenclaturas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomenclaturas"] });
    },
  });

  const filteredNomenclaturas = nomenclaturas.filter((nomenclatura) => {
    const matchesSearch = 
      nomenclatura.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nomenclatura.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || nomenclatura.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selected = filteredNomenclaturas.find((item) => item.id === editingId) || null;
  const initialData: Partial<NomenclaturaFormData> | null = selected
    ? {
        codigo: selected.codigo,
        descripcion: selected.descripcion,
        categoria: selected.categoria,
        activo: selected.activo,
      }
    : null;

  const handleSubmit = (form: NomenclaturaFormData) => {
    const payload = {
      codigo: form.codigo,
      nombre: form.descripcion,
      categoria: form.categoria || "general",
      activo: form.activo,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }
    createMutation.mutate(payload);
  };

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
        
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => {
            setEditingId(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Nomenclatura
        </Button>
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
                        onClick={() => {
                          setEditingId(nomenclatura.id);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <ConfirmDeleteButton
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="¿Eliminar nomenclatura?"
                        description="Se eliminará esta nomenclatura del catálogo. Esta acción no se puede deshacer."
                        onConfirm={() => deleteMutation.mutate(nomenclatura.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </ConfirmDeleteButton>
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
      <NomenclaturaModal
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingId(null);
        }}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        initialData={initialData}
        categorias={categorias}
      />
    </div>
  );
}