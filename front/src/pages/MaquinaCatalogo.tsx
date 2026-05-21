import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS } from "@/lib/permissions";

interface CatalogItem {
  id: string;
  nombre: string;
  activo: boolean;
  claseId?: string;
  clase?: { id: string; nombre: string };
}

export default function MaquinaCatalogo() {
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const canEdit = can(PERMISSIONS.MAQUINAS_EDIT);

  const [searchClase, setSearchClase] = useState("");
  const [searchTipo, setSearchTipo] = useState("");
  const [selectedClaseId, setSelectedClaseId] = useState("");

  const [claseDialogOpen, setClaseDialogOpen] = useState(false);
  const [tipoDialogOpen, setTipoDialogOpen] = useState(false);
  const [editingClaseId, setEditingClaseId] = useState<string | null>(null);
  const [editingTipoId, setEditingTipoId] = useState<string | null>(null);
  const [claseForm, setClaseForm] = useState({ nombre: "", activo: true });
  const [tipoForm, setTipoForm] = useState({ nombre: "", claseId: "", activo: true });

  const { data: clasesData } = useQuery({
    queryKey: ["maquina-clases"],
    queryFn: () => apiRequest<{ clases: CatalogItem[] }>("/maquina-clases"),
  });

  const { data: tiposData } = useQuery({
    queryKey: ["maquina-tipos", selectedClaseId],
    queryFn: () => {
      const params = selectedClaseId ? `?claseId=${selectedClaseId}` : "";
      return apiRequest<{ tipos: CatalogItem[] }>(`/maquina-tipos${params}`);
    },
  });

  const clases = clasesData?.clases || [];
  const tipos = tiposData?.tipos || [];

  const filteredClases = clases.filter((c) =>
    c.nombre.toLowerCase().includes(searchClase.toLowerCase())
  );
  const filteredTipos = tipos.filter((t) =>
    t.nombre.toLowerCase().includes(searchTipo.toLowerCase())
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["maquina-clases"] });
    queryClient.invalidateQueries({ queryKey: ["maquina-tipos"] });
  };

  const saveClaseMutation = useMutation({
    mutationFn: async () => {
      const body = { nombre: claseForm.nombre.trim(), activo: claseForm.activo };
      if (editingClaseId) {
        return apiRequest(`/maquina-clases/${editingClaseId}`, { method: "PATCH", body });
      }
      return apiRequest("/maquina-clases", { method: "POST", body });
    },
    onSuccess: () => {
      toast.success(editingClaseId ? "Clase actualizada" : "Clase creada");
      setClaseDialogOpen(false);
      setEditingClaseId(null);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteClaseMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/maquina-clases/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Clase eliminada");
      if (selectedClaseId) setSelectedClaseId("");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveTipoMutation = useMutation({
    mutationFn: async () => {
      const body = {
        nombre: tipoForm.nombre.trim(),
        claseId: tipoForm.claseId,
        activo: tipoForm.activo,
      };
      if (editingTipoId) {
        return apiRequest(`/maquina-tipos/${editingTipoId}`, { method: "PATCH", body });
      }
      return apiRequest("/maquina-tipos", { method: "POST", body });
    },
    onSuccess: () => {
      toast.success(editingTipoId ? "Tipo actualizado" : "Tipo creado");
      setTipoDialogOpen(false);
      setEditingTipoId(null);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteTipoMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/maquina-tipos/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Tipo eliminado");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openNewClase = () => {
    setEditingClaseId(null);
    setClaseForm({ nombre: "", activo: true });
    setClaseDialogOpen(true);
  };

  const openEditClase = (item: CatalogItem) => {
    setEditingClaseId(item.id);
    setClaseForm({ nombre: item.nombre, activo: item.activo });
    setClaseDialogOpen(true);
  };

  const openNewTipo = () => {
    setEditingTipoId(null);
    setTipoForm({
      nombre: "",
      claseId: selectedClaseId || clases[0]?.id || "",
      activo: true,
    });
    setTipoDialogOpen(true);
  };

  const openEditTipo = (item: CatalogItem) => {
    setEditingTipoId(item.id);
    setTipoForm({
      nombre: item.nombre,
      claseId: item.claseId || selectedClaseId,
      activo: item.activo,
    });
    setTipoDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Catálogo Clase y Tipo</h1>
        <p className="text-gray-600 mt-1">
          Administra las clases y tipos disponibles al registrar máquinas y vehículos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Clases</CardTitle>
            {canEdit && (
              <Button size="sm" onClick={openNewClase}>
                <Plus className="h-4 w-4 mr-1" /> Nueva clase
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar clase..."
                value={searchClase}
                onChange={(e) => setSearchClase(e.target.value)}
                className="pl-10"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  {canEdit && <TableHead className="text-center">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClases.map((clase) => (
                  <TableRow
                    key={clase.id}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedClaseId === clase.id ? "bg-amber-50" : ""
                    }`}
                    onClick={() => setSelectedClaseId(clase.id)}
                  >
                    <TableCell className="font-medium">{clase.nombre}</TableCell>
                    <TableCell>
                      <Badge variant={clase.activo ? "default" : "secondary"}>
                        {clase.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div
                          className="flex gap-2 justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditClase(clase)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <ConfirmDeleteButton
                            className="h-8 w-8 p-0 text-red-600"
                            title="¿Eliminar clase?"
                            description="Solo es posible si no hay máquinas ni tipos asociados."
                            onConfirm={() => deleteClaseMutation.mutate(clase.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </ConfirmDeleteButton>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              Tipos {selectedClaseId ? `(${clases.find((c) => c.id === selectedClaseId)?.nombre})` : ""}
            </CardTitle>
            {canEdit && (
              <Button size="sm" onClick={openNewTipo} disabled={!selectedClaseId && clases.length === 0}>
                <Plus className="h-4 w-4 mr-1" /> Nuevo tipo
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar tipo..."
                value={searchTipo}
                onChange={(e) => setSearchTipo(e.target.value)}
                className="pl-10"
              />
            </div>
            {!selectedClaseId && (
              <p className="text-sm text-gray-500">Selecciona una clase para ver y filtrar sus tipos.</p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead>Estado</TableHead>
                  {canEdit && <TableHead className="text-center">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTipos.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell className="font-medium">{tipo.nombre}</TableCell>
                    <TableCell>{tipo.clase?.nombre || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={tipo.activo ? "default" : "secondary"}>
                        {tipo.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditTipo(tipo)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <ConfirmDeleteButton
                            className="h-8 w-8 p-0 text-red-600"
                            title="¿Eliminar tipo?"
                            description="Solo es posible si no hay máquinas asociadas."
                            onConfirm={() => deleteTipoMutation.mutate(tipo.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </ConfirmDeleteButton>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={claseDialogOpen} onOpenChange={setClaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClaseId ? "Editar clase" : "Nueva clase"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveClaseMutation.mutate();
            }}
          >
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={claseForm.nombre}
                onChange={(e) => setClaseForm((p) => ({ ...p, nombre: e.target.value }))}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={claseForm.activo}
                onCheckedChange={(v) => setClaseForm((p) => ({ ...p, activo: Boolean(v) }))}
              />
              <Label>Activo</Label>
            </div>
            <Button type="submit" disabled={saveClaseMutation.isPending}>
              Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={tipoDialogOpen} onOpenChange={setTipoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTipoId ? "Editar tipo" : "Nuevo tipo"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveTipoMutation.mutate();
            }}
          >
            <div className="space-y-1">
              <Label>Clase</Label>
              <Select
                value={tipoForm.claseId}
                onValueChange={(v) => setTipoForm((p) => ({ ...p, claseId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar clase" />
                </SelectTrigger>
                <SelectContent>
                  {clases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={tipoForm.nombre}
                onChange={(e) => setTipoForm((p) => ({ ...p, nombre: e.target.value }))}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={tipoForm.activo}
                onCheckedChange={(v) => setTipoForm((p) => ({ ...p, activo: Boolean(v) }))}
              />
              <Label>Activo</Label>
            </div>
            <Button type="submit" disabled={saveTipoMutation.isPending}>
              Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
