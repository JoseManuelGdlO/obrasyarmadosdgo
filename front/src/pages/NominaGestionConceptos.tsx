import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS } from "@/lib/permissions";

type ValorOpcion = { etiqueta: string; valor: string; origen?: "cargo" | "manual" };

type ConceptoGestion = {
  id: string;
  nombre: string;
  tipo: "percepcion" | "deduccion";
  modo: "monto" | "precio_cantidad";
  activo: boolean;
  orden: number;
  valores?: Array<{ etiqueta: string; valor: number | null; origen?: "cargo" | "manual" }>;
};

const esSueldoBase = (nombre: string) => nombre.trim().toLowerCase() === "sueldo base";

const emptyForm = () => ({
  nombre: "",
  tipo: "percepcion" as ConceptoGestion["tipo"],
  modo: "monto" as ConceptoGestion["modo"],
  orden: "0",
  activo: true,
  valores: [] as ValorOpcion[],
});

export default function NominaGestionConceptos() {
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.NOMINA_CREATE);
  const queryClient = useQueryClient();
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const { data, isLoading } = useQuery({
    queryKey: ["nomina-gestion-conceptos"],
    queryFn: () =>
      apiRequest<{ conceptos: ConceptoGestion[] }>("/nomina/gestion-conceptos"),
  });

  const conceptos = useMemo(() => {
    const all = data?.conceptos || [];
    if (filtroTipo === "all") return all;
    return all.filter((c) => c.tipo === filtroTipo);
  }, [data?.conceptos, filtroTipo]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        modo: form.modo,
        orden: Number(form.orden) || 0,
        activo: form.activo,
        valores: form.valores
          .filter((item) => item.etiqueta.trim() && item.valor.trim())
          .map((item) => ({
            etiqueta: item.etiqueta.trim(),
            valor: Number(item.valor),
          })),
      };
      if (editingId) {
        return apiRequest(`/nomina/gestion-conceptos/${editingId}`, {
          method: "PATCH",
          body: payload,
        });
      }
      return apiRequest("/nomina/gestion-conceptos", { method: "POST", body: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomina-gestion-conceptos"] });
      toast.success(editingId ? "Concepto actualizado" : "Concepto creado");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm());
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo guardar"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      apiRequest(`/nomina/gestion-conceptos/${id}`, {
        method: "PATCH",
        body: { activo },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomina-gestion-conceptos"] });
      toast.success("Estado actualizado");
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/nomina/gestion-conceptos/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomina-gestion-conceptos"] });
      toast.success("Concepto eliminado");
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo eliminar"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Conceptos</h1>
          <p className="text-sm text-muted-foreground">
            Percepciones y deducciones que se capturan en la nómina
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/nomina">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Nómina
            </Link>
          </Button>
          {canCreate && (
            <Button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo concepto
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conceptos</CardTitle>
          <div className="w-full max-w-xs pt-2">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="percepcion">Percepciones</SelectItem>
                <SelectItem value="deduccion">Deducciones</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : conceptos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay conceptos.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Captura</TableHead>
                  <TableHead className="text-right">Opciones</TableHead>
                  <TableHead className="text-right">Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {conceptos.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell>
                      {c.tipo === "percepcion" ? "Percepción" : "Deducción"}
                    </TableCell>
                    <TableCell>
                      {c.modo === "precio_cantidad" ? "Precio × cantidad" : "Monto"}
                    </TableCell>
                    <TableCell className="text-right">{c.valores?.length || 0}</TableCell>
                    <TableCell className="text-right">{c.orden}</TableCell>
                    <TableCell>{c.activo ? "Activo" : "Inactivo"}</TableCell>
                    <TableCell className="space-x-1 whitespace-nowrap text-right">
                      {canCreate && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(c.id);
                              setForm({
                                nombre: c.nombre,
                                tipo: c.tipo,
                                modo: c.modo,
                                orden: String(c.orden),
                                activo: c.activo,
                                valores: (c.valores || []).map((item) => ({
                                  etiqueta: item.etiqueta,
                                  valor: item.valor == null ? "" : String(item.valor),
                                  origen: item.origen === "cargo" ? "cargo" : "manual",
                                })),
                              });
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={toggleMutation.isPending}
                            onClick={() =>
                              toggleMutation.mutate({ id: c.id, activo: !c.activo })
                            }
                          >
                            {c.activo ? "Desactivar" : "Activar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (window.confirm(`¿Eliminar «${c.nombre}»?`)) {
                                deleteMutation.mutate(c.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar concepto" : "Nuevo concepto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, tipo: value as ConceptoGestion["tipo"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percepcion">Percepción</SelectItem>
                  <SelectItem value="deduccion">Deducción</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Captura</Label>
              <Select
                value={form.modo}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, modo: value as ConceptoGestion["modo"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monto">Monto</SelectItem>
                  <SelectItem value="precio_cantidad">Precio × cantidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Orden</Label>
              <Input
                type="number"
                value={form.orden}
                onChange={(e) => setForm((f) => ({ ...f, orden: e.target.value }))}
              />
            </div>
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <Label>Opciones para seleccionar</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      valores: [...f.valores, { etiqueta: "", valor: "", origen: "manual" }],
                    }))
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Agregar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {esSueldoBase(form.nombre)
                  ? "Los cargos de Trabajadores aparecen solos. Puedes cambiar su sueldo o agregar otras opciones."
                  : "Si agregas opciones, en la nómina solo se elige una. El valor es el monto o el precio."}
              </p>
              {form.valores.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {esSueldoBase(form.nombre)
                    ? "No hay cargos en Trabajadores. Puedes agregar opciones a mano."
                    : "Sin opciones. Se captura el monto a mano."}
                </p>
              ) : (
                form.valores.map((item, index) => {
                  const esCargo = esSueldoBase(form.nombre) && item.origen === "cargo";
                  return (
                  <div key={index} className="grid grid-cols-[1fr_120px_auto] gap-2">
                    <Input
                      placeholder="Nombre de la opción"
                      value={item.etiqueta}
                      disabled={esCargo}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          valores: f.valores.map((row, i) =>
                            i === index ? { ...row, etiqueta: e.target.value } : row
                          ),
                        }))
                      }
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={esSueldoBase(form.nombre) ? "Sueldo" : "Valor"}
                      value={item.valor}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          valores: f.valores.map((row, i) =>
                            i === index ? { ...row, valor: e.target.value } : row
                          ),
                        }))
                      }
                    />
                    {esCargo ? (
                      <span className="w-10" />
                    ) : (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          valores: f.valores.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    )}
                  </div>
                  );
                })
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={form.activo ? "activo" : "inactivo"}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, activo: value === "activo" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                disabled={saveMutation.isPending}
                onClick={() => {
                  if (!form.nombre.trim()) {
                    toast.error("Indica el nombre");
                    return;
                  }
                  const incompleta = form.valores.some((item) => {
                    const esCargo = esSueldoBase(form.nombre) && item.origen === "cargo";
                    if (esCargo && !item.valor.trim()) return false;
                    return (
                      (item.etiqueta.trim() && !item.valor.trim()) ||
                      (!item.etiqueta.trim() && item.valor.trim())
                    );
                  });
                  if (incompleta) {
                    toast.error("Cada opción necesita nombre y valor");
                    return;
                  }
                  saveMutation.mutate();
                }}
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
