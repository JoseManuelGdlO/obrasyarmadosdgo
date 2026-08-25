import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { apiRequest } from "@/lib/api";
import CuentaContableModal, { CuentaContableFormData } from "@/components/modals/CuentaContableModal";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import { toast } from "sonner";

type CuentaContableRow = {
  id: string;
  numero: string;
  nombre: string;
  activa: boolean;
  proveedorNombre: string;
};

export default function CuentasContables() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["cuentas-contables"],
    queryFn: () =>
      apiRequest<{
        cuentasContables: Array<Record<string, unknown>>;
      }>("/cuentas-contables"),
  });

  const cuentas: CuentaContableRow[] = (data?.cuentasContables || []).map((item) => {
    const proveedor = item.proveedor as { id?: string; nombre?: string } | null | undefined;
    return {
      id: String(item.id || ""),
      numero: String(item.numero || ""),
      nombre: String(item.nombre || ""),
      activa: Boolean(item.activa),
      proveedorNombre: proveedor?.nombre ? String(proveedor.nombre) : "",
    };
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("/cuentas-contables", { method: "POST", body: payload }),
    onSuccess: () => {
      toast.success("Cuenta creada");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["cuentas-contables"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error creando cuenta"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiRequest(`/cuentas-contables/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => {
      toast.success("Cuenta actualizada");
      setIsDialogOpen(false);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["cuentas-contables"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error actualizando cuenta"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/cuentas-contables/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Cuenta eliminada");
      queryClient.invalidateQueries({ queryKey: ["cuentas-contables"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error eliminando cuenta"),
  });

  const filtered = cuentas.filter((cuenta) => {
    const term = searchTerm.toLowerCase();
    return (
      cuenta.numero.toLowerCase().includes(term) ||
      cuenta.nombre.toLowerCase().includes(term) ||
      cuenta.proveedorNombre.toLowerCase().includes(term)
    );
  });

  const selected = filtered.find((item) => item.id === editingId) || null;
  const initialData: Partial<CuentaContableFormData> | null = selected
    ? {
        numero: selected.numero,
        nombre: selected.nombre,
        activa: selected.activa,
      }
    : null;

  const handleSubmit = (form: CuentaContableFormData) => {
    if (!form.numero.trim()) {
      toast.error("El número de cuenta es obligatorio");
      return;
    }
    const payload = {
      numero: form.numero.trim(),
      nombre: form.nombre.trim() || null,
      activa: form.activa,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cuentas contables</h1>
          <p className="text-gray-600 mt-1">
            Catálogo de números de cuenta internos para proveedores
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
          Nueva cuenta
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por número, nombre o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de cuentas ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Asignada a</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cuenta) => (
                <TableRow key={cuenta.id} className="hover:bg-gray-50">
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {cuenta.numero}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">{cuenta.nombre || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={cuenta.activa ? "default" : "destructive"}>
                      {cuenta.activa ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {cuenta.proveedorNombre || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditingId(cuenta.id);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <ConfirmDeleteButton
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="¿Eliminar cuenta contable?"
                        description="Se eliminará esta cuenta del catálogo. Esta acción no se puede deshacer."
                        onConfirm={() => deleteMutation.mutate(cuenta.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </ConfirmDeleteButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron cuentas que coincidan con la búsqueda
            </div>
          )}
        </CardContent>
      </Card>

      <CuentaContableModal
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingId(null);
        }}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        initialData={initialData}
      />
    </div>
  );
}
