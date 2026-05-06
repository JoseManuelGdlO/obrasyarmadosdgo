import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import { Plus, Search, Filter, Package, AlertTriangle, CheckCircle, Truck } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

type Articulo = {
  id: string;
  nombre: string;
  categoria: string;
  codigo?: string | null;
  stockActual: number;
  stockMinimo: number;
  precioUnitario: number;
  proveedor?: string | null;
  ubicacion?: string | null;
  unidad?: string | null;
};

type Movimiento = {
  id: string;
  articuloId: string;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string;
  referencia?: string | null;
  createdAt: string;
};

const defaultArticulo = {
  nombre: "",
  categoria: "",
  codigo: "",
  stockActual: "0",
  stockMinimo: "0",
  precioUnitario: "0",
  proveedor: "",
  ubicacion: "",
  unidad: "unidad",
};

const defaultMovimiento = {
  tipo: "entrada" as "entrada" | "salida" | "ajuste",
  cantidad: "1",
  motivo: "",
  referencia: "",
  costoUnitario: "",
};

const Inventario = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isArticuloModalOpen, setIsArticuloModalOpen] = useState(false);
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
  const [editingArticulo, setEditingArticulo] = useState<Articulo | null>(null);
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);
  const [articuloForm, setArticuloForm] = useState(defaultArticulo);
  const [movimientoForm, setMovimientoForm] = useState(defaultMovimiento);

  const { data: articulosData, isLoading } = useQuery({
    queryKey: ["articulos", searchTerm, onlyLowStock],
    queryFn: () =>
      apiRequest<{ articulos: Articulo[] }>(
        `/articulos?q=${encodeURIComponent(searchTerm)}&belowMin=${onlyLowStock ? "true" : "false"}`
      ),
  });

  const { data: resumenData } = useQuery({
    queryKey: ["inventario-resumen"],
    queryFn: () => apiRequest<{ resumen: { disponibles: number; stockBajo: number; agotados: number; valorTotal: number } }>("/articulos/resumen"),
  });

  const { data: alertasData } = useQuery({
    queryKey: ["inventario-alertas"],
    queryFn: () => apiRequest<{ alertas: Articulo[] }>("/movimientos-inventario/alertas/stock-minimo"),
  });

  const { data: kardexData } = useQuery({
    queryKey: ["articulo-kardex", selectedArticulo?.id],
    queryFn: () =>
      apiRequest<{ movimientos: Movimiento[] }>(`/articulos/${selectedArticulo?.id}/kardex`),
    enabled: Boolean(selectedArticulo?.id && isKardexModalOpen),
  });

  const articulos = useMemo(() => articulosData?.articulos || [], [articulosData?.articulos]);
  const resumen = resumenData?.resumen || { disponibles: 0, stockBajo: 0, agotados: 0, valorTotal: 0 };
  const alertas = alertasData?.alertas || [];

  const categorias = useMemo(
    () => Array.from(new Set(articulos.map((a) => a.categoria).filter(Boolean))).sort(),
    [articulos]
  );

  const createArticuloMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiRequest("/articulos", { method: "POST", body: payload }),
    onSuccess: () => {
      toast.success("Artículo creado");
      setIsArticuloModalOpen(false);
      setArticuloForm(defaultArticulo);
      queryClient.invalidateQueries({ queryKey: ["articulos"] });
      queryClient.invalidateQueries({ queryKey: ["inventario-resumen"] });
      queryClient.invalidateQueries({ queryKey: ["inventario-alertas"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error creando artículo"),
  });

  const updateArticuloMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiRequest(`/articulos/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => {
      toast.success("Artículo actualizado");
      setIsArticuloModalOpen(false);
      setEditingArticulo(null);
      setArticuloForm(defaultArticulo);
      queryClient.invalidateQueries({ queryKey: ["articulos"] });
      queryClient.invalidateQueries({ queryKey: ["inventario-resumen"] });
      queryClient.invalidateQueries({ queryKey: ["inventario-alertas"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error actualizando artículo"),
  });

  const deleteArticuloMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/articulos/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Artículo eliminado");
      queryClient.invalidateQueries({ queryKey: ["articulos"] });
      queryClient.invalidateQueries({ queryKey: ["inventario-resumen"] });
      queryClient.invalidateQueries({ queryKey: ["inventario-alertas"] });
    },
    onError: (err: Error) => toast.error(err.message || "Error eliminando artículo"),
  });

  const createMovimientoMutation = useMutation({
    mutationFn: ({ articuloId, payload }: { articuloId: string; payload: Record<string, unknown> }) =>
      apiRequest(`/articulos/${articuloId}/movimientos`, { method: "POST", body: payload }),
    onSuccess: () => {
      toast.success("Movimiento registrado");
      setIsMovimientoModalOpen(false);
      setMovimientoForm(defaultMovimiento);
      queryClient.invalidateQueries({ queryKey: ["articulos"] });
      queryClient.invalidateQueries({ queryKey: ["inventario-resumen"] });
      queryClient.invalidateQueries({ queryKey: ["inventario-alertas"] });
      if (selectedArticulo?.id) {
        queryClient.invalidateQueries({ queryKey: ["articulo-kardex", selectedArticulo.id] });
      }
    },
    onError: (err: Error) => toast.error(err.message || "Error registrando movimiento"),
  });

  const getEstado = (a: Articulo) => {
    if (a.stockActual <= 0) return "Agotado";
    if (a.stockActual <= a.stockMinimo) return "Stock Bajo";
    return "Disponible";
  };

  const getStatusColor = (status: string) => {
    if (status === "Disponible") return "bg-success text-success-foreground";
    if (status === "Stock Bajo") return "bg-warning text-warning-foreground";
    if (status === "Agotado") return "bg-destructive text-destructive-foreground";
    return "bg-muted text-muted-foreground";
  };

  const openCreateArticulo = () => {
    setEditingArticulo(null);
    setArticuloForm(defaultArticulo);
    setIsArticuloModalOpen(true);
  };

  const openEditArticulo = (articulo: Articulo) => {
    setEditingArticulo(articulo);
    setArticuloForm({
      nombre: articulo.nombre || "",
      categoria: articulo.categoria || "",
      codigo: articulo.codigo || "",
      stockActual: String(articulo.stockActual ?? 0),
      stockMinimo: String(articulo.stockMinimo ?? 0),
      precioUnitario: String(articulo.precioUnitario ?? 0),
      proveedor: articulo.proveedor || "",
      ubicacion: articulo.ubicacion || "",
      unidad: articulo.unidad || "unidad",
    });
    setIsArticuloModalOpen(true);
  };

  const submitArticulo = () => {
    const payload = {
      nombre: articuloForm.nombre,
      categoria: articuloForm.categoria,
      codigo: articuloForm.codigo || null,
      stockActual: Number(articuloForm.stockActual || 0),
      stockMinimo: Number(articuloForm.stockMinimo || 0),
      precioUnitario: Number(articuloForm.precioUnitario || 0),
      proveedor: articuloForm.proveedor || null,
      ubicacion: articuloForm.ubicacion || null,
      unidad: articuloForm.unidad || "unidad",
    };
    if (editingArticulo) {
      updateArticuloMutation.mutate({ id: editingArticulo.id, payload });
    } else {
      createArticuloMutation.mutate(payload);
    }
  };

  const openMovimiento = (articulo: Articulo) => {
    setSelectedArticulo(articulo);
    setMovimientoForm(defaultMovimiento);
    setIsMovimientoModalOpen(true);
  };

  const submitMovimiento = () => {
    if (!selectedArticulo) return;
    createMovimientoMutation.mutate({
      articuloId: selectedArticulo.id,
      payload: {
        tipo: movimientoForm.tipo,
        cantidad: Number(movimientoForm.cantidad || 0),
        motivo: movimientoForm.motivo,
        referencia: movimientoForm.referencia || null,
        costoUnitario: movimientoForm.costoUnitario ? Number(movimientoForm.costoUnitario) : null,
      },
    });
  };

  const openKardex = (articulo: Articulo) => {
    setSelectedArticulo(articulo);
    setIsKardexModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventario</h1>
          <p className="text-muted-foreground">Gestión de repuestos, stock, movimientos y alertas</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent text-white" onClick={openCreateArticulo}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Artículo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Artículos Disponibles" value={resumen.disponibles} icon={Package} description="En stock" trend={{ value: 0, isPositive: true }} />
        <StatCard title="Stock Bajo" value={resumen.stockBajo} icon={AlertTriangle} description="Requieren reposición" trend={{ value: 0, isPositive: false }} />
        <StatCard title="Agotados" value={resumen.agotados} icon={Truck} description="Sin existencias" trend={{ value: 0, isPositive: false }} />
        <StatCard title="Valor Total" value={`$${Number(resumen.valorTotal || 0).toLocaleString()}`} icon={CheckCircle} description="Inventario total" trend={{ value: 0, isPositive: true }} />
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Alertas de stock mínimo ({alertas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {alertas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay alertas activas.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {alertas.map((a) => (
                <Badge key={a.id} className="bg-warning text-warning-foreground">
                  {a.nombre} ({a.stockActual}/{a.stockMinimo})
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código, categoría, proveedor..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant={onlyLowStock ? "default" : "outline"} className="flex items-center gap-2" onClick={() => setOnlyLowStock((v) => !v)}>
              <Filter className="w-4 h-4" />
              {onlyLowStock ? "Mostrando stock bajo" : "Solo stock bajo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Lista de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead className="min-w-[420px] w-[520px]">Artículo</TableHead>
                <TableHead className="w-[140px]">Categoría</TableHead>
                <TableHead className="w-[90px]">Stock</TableHead>
                <TableHead className="w-[90px]">Stock Min</TableHead>
                <TableHead className="w-[120px]">Precio Unit.</TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
                <TableHead className="w-[220px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articulos.map((item) => {
                const estado = getEstado(item);
                return (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.codigo || "-"}</TableCell>
                    <TableCell className="min-w-[420px] w-[520px]">
                      <div className="max-w-[500px]">
                        <p className="font-medium text-primary">{item.nombre}</p>
                        <span className="text-xs text-muted-foreground">{item.unidad || "unidad"}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{item.categoria}</Badge></TableCell>
                    <TableCell className="font-medium">{item.stockActual}</TableCell>
                    <TableCell>{item.stockMinimo}</TableCell>
                    <TableCell>${Number(item.precioUnitario || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(estado)}>{estado}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => openKardex(item)}>Kardex</Button>
                        <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => openMovimiento(item)}>Mov.</Button>
                        <Button variant="default" size="sm" className="h-8 px-2" onClick={() => openEditArticulo(item)}>Editar</Button>
                        <ConfirmDeleteButton
                          title="¿Eliminar artículo?"
                          description="Esta acción eliminará el artículo y su historial de movimientos."
                          onConfirm={() => deleteArticuloMutation.mutate(item.id)}
                        >
                          <span className="inline-flex h-8 items-center">Eliminar</span>
                        </ConfirmDeleteButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {isLoading && <p className="text-sm text-muted-foreground mt-3">Cargando inventario...</p>}
          {!isLoading && articulos.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">No hay artículos para mostrar.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isArticuloModalOpen} onOpenChange={setIsArticuloModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticulo ? "Editar artículo" : "Nuevo artículo"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={articuloForm.nombre} onChange={(e) => setArticuloForm((p) => ({ ...p, nombre: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={articuloForm.categoria} onValueChange={(v) => setArticuloForm((p) => ({ ...p, categoria: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectItem value="Filtros">Filtros</SelectItem>
                  <SelectItem value="Lubricantes">Lubricantes</SelectItem>
                  <SelectItem value="Componentes">Componentes</SelectItem>
                  <SelectItem value="Repuestos">Repuestos</SelectItem>
                  <SelectItem value="Herramientas">Herramientas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Código</Label><Input value={articuloForm.codigo} onChange={(e) => setArticuloForm((p) => ({ ...p, codigo: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Unidad</Label><Input value={articuloForm.unidad} onChange={(e) => setArticuloForm((p) => ({ ...p, unidad: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Stock Actual</Label><Input type="number" value={articuloForm.stockActual} onChange={(e) => setArticuloForm((p) => ({ ...p, stockActual: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Stock Mínimo</Label><Input type="number" value={articuloForm.stockMinimo} onChange={(e) => setArticuloForm((p) => ({ ...p, stockMinimo: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Precio Unitario</Label><Input type="number" step="0.01" value={articuloForm.precioUnitario} onChange={(e) => setArticuloForm((p) => ({ ...p, precioUnitario: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Proveedor</Label><Input value={articuloForm.proveedor} onChange={(e) => setArticuloForm((p) => ({ ...p, proveedor: e.target.value }))} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Ubicación</Label><Input value={articuloForm.ubicacion} onChange={(e) => setArticuloForm((p) => ({ ...p, ubicacion: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={submitArticulo} disabled={createArticuloMutation.isPending || updateArticuloMutation.isPending}>
              {editingArticulo ? "Guardar cambios" : "Crear artículo"}
            </Button>
            <Button variant="outline" onClick={() => setIsArticuloModalOpen(false)}>Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMovimientoModalOpen} onOpenChange={setIsMovimientoModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar movimiento - {selectedArticulo?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={movimientoForm.tipo} onValueChange={(v) => setMovimientoForm((p) => ({ ...p, tipo: v as "entrada" | "salida" | "ajuste" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Cantidad</Label><Input type="number" min="1" value={movimientoForm.cantidad} onChange={(e) => setMovimientoForm((p) => ({ ...p, cantidad: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Motivo</Label><Input value={movimientoForm.motivo} onChange={(e) => setMovimientoForm((p) => ({ ...p, motivo: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Referencia</Label><Input value={movimientoForm.referencia} onChange={(e) => setMovimientoForm((p) => ({ ...p, referencia: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Costo Unitario (opcional)</Label><Input type="number" step="0.01" value={movimientoForm.costoUnitario} onChange={(e) => setMovimientoForm((p) => ({ ...p, costoUnitario: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={submitMovimiento} disabled={createMovimientoMutation.isPending}>Guardar movimiento</Button>
            <Button variant="outline" onClick={() => setIsMovimientoModalOpen(false)}>Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isKardexModalOpen} onOpenChange={setIsKardexModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kardex - {selectedArticulo?.nombre}</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Stock Anterior</TableHead>
                <TableHead>Stock Nuevo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Referencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(kardexData?.movimientos || []).map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{new Date(m.createdAt).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{m.tipo}</Badge></TableCell>
                  <TableCell>{m.cantidad}</TableCell>
                  <TableCell>{m.stockAnterior}</TableCell>
                  <TableCell>{m.stockNuevo}</TableCell>
                  <TableCell>{m.motivo}</TableCell>
                  <TableCell>{m.referencia || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(kardexData?.movimientos || []).length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">Sin movimientos registrados para este artículo.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventario;