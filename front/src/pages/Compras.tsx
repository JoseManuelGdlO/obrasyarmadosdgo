import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  FileSpreadsheet,
  FileText,
  Search,
  Upload,
  Eye,
  Trash2,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { apiRequest, toAbsoluteAssetUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS } from "@/lib/permissions";

type Factura = {
  id: string;
  archivoPath: string;
  nombreOriginal: string;
  mimeType: string;
  createdAt?: string;
};

type Partida = {
  id: string;
  indice: number;
  cantidad: number;
  unidad: string | null;
  nombreProducto: string;
  caracteristicas: string | null;
  paraQueSeUsara: string | null;
  quienRecibeMaterial?: string | null;
  quienLoUsa?: string | null;
  quienLoPide?: string | null;
  precioUnitario: number;
  importeTotal: number;
};

type OrdenCompra = {
  id: string;
  fecha: string;
  empresa?: string | null;
  clienteId?: string | null;
  proyectoId?: string | null;
  proyecto: string;
  proveedor: string;
  total: number;
  archivoImportPath?: string | null;
  partidasCount: number;
  facturasCount: number;
  partidas?: Partida[];
  facturas?: Factura[];
};

type PartidaForm = {
  key: string;
  cantidad: string;
  unidad: string;
  nombreProducto: string;
  caracteristicas: string;
  paraQueSeUsara: string;
  quienRecibeMaterial: string;
  quienLoUsa: string;
  quienLoPide: string;
  precioUnitario: string;
};

const emptyPartida = (n = 1): PartidaForm => ({
  key: `${Date.now()}-${n}-${Math.random().toString(36).slice(2, 7)}`,
  cantidad: "1",
  unidad: "PZA",
  nombreProducto: "",
  caracteristicas: "",
  paraQueSeUsara: "",
  quienRecibeMaterial: "",
  quienLoUsa: "",
  quienLoPide: "",
  precioUnitario: "0",
});

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatMoney = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);

const calcImporte = (cantidad: string, precio: string) => {
  const c = Number(cantidad);
  const p = Number(precio);
  if (!Number.isFinite(c) || !Number.isFinite(p)) return 0;
  return Number((c * p).toFixed(4));
};

const Compras = () => {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const xlsmRef = useRef<HTMLInputElement>(null);
  const facturaRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [nuevaOpen, setNuevaOpen] = useState(false);
  const [gestionOpen, setGestionOpen] = useState(false);
  const [gestionPartida, setGestionPartida] = useState<{
    ordenId: string;
    partidaId: string;
    nombreProducto: string;
  } | null>(null);
  const [gestionForm, setGestionForm] = useState({
    caracteristicas: "",
    paraQueSeUsara: "",
    quienRecibeMaterial: "",
    quienLoUsa: "",
    quienLoPide: "",
  });
  const [nuevaGestionKey, setNuevaGestionKey] = useState<string | null>(null);
  const [fecha, setFecha] = useState(todayISO());
  const [clienteId, setClienteId] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [proyectoId, setProyectoId] = useState("");
  const [proyecto, setProyecto] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [partidasForm, setPartidasForm] = useState<PartidaForm[]>([emptyPartida(1)]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const canImport = can(PERMISSIONS.COMPRAS_IMPORT);
  const canFacturas = can(PERMISSIONS.COMPRAS_FACTURAS);
  const canViewClientes = can(PERMISSIONS.CLIENTES_VIEW);
  const canViewProyectos = can(PERMISSIONS.PROYECTOS_VIEW);

  const totalForm = useMemo(
    () => partidasForm.reduce((sum, p) => sum + calcImporte(p.cantidad, p.precioUnitario), 0),
    [partidasForm]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["compras", search],
    queryFn: () => {
      const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
      return apiRequest<{ ordenes: OrdenCompra[] }>(`/compras${q}`);
    },
  });

  const { data: clientesData } = useQuery({
    queryKey: ["clientes-lite-compras"],
    queryFn: () =>
      apiRequest<{ clientes: Array<{ id: string; nombre: string }> }>("/clientes"),
    enabled: nuevaOpen && (canViewClientes || canImport),
  });

  const { data: proyectosData } = useQuery({
    queryKey: ["proyectos-lite-compras"],
    queryFn: () =>
      apiRequest<{
        proyectos: Array<{ id: string; nombre: string; clienteId: string }>;
      }>("/proyectos"),
    enabled: nuevaOpen && (canViewProyectos || canImport),
  });

  const clientes = clientesData?.clientes || [];
  const proyectosEmpresa = useMemo(() => {
    const all = proyectosData?.proyectos || [];
    if (!clienteId) return [];
    return all.filter((p) => p.clienteId === clienteId);
  }, [proyectosData?.proyectos, clienteId]);

  const ordenes = useMemo(() => data?.ordenes || [], [data?.ordenes]);

  const filas = useMemo(() => {
    const rows: Array<{
      key: string;
      ordenId: string;
      partidaId: string | null;
      fecha: string;
      empresa: string;
      proyecto: string;
      proveedor: string;
      indice: number | string;
      cantidad: number | string;
      unidad: string;
      nombreProducto: string;
      caracteristicas: string;
      paraQueSeUsara: string;
      quienRecibeMaterial: string;
      quienLoUsa: string;
      quienLoPide: string;
      precioUnitario: number;
      importeTotal: number;
      facturasCount: number;
    }> = [];
    for (const o of ordenes) {
      const partidas = o.partidas || [];
      if (partidas.length === 0) {
        rows.push({
          key: o.id,
          ordenId: o.id,
          partidaId: null,
          fecha: o.fecha,
          empresa: o.empresa || "—",
          proyecto: o.proyecto,
          proveedor: o.proveedor,
          indice: "—",
          cantidad: "—",
          unidad: "—",
          nombreProducto: "—",
          caracteristicas: "",
          paraQueSeUsara: "",
          quienRecibeMaterial: "",
          quienLoUsa: "",
          quienLoPide: "",
          precioUnitario: 0,
          importeTotal: 0,
          facturasCount: o.facturasCount,
        });
        continue;
      }
      for (const p of partidas) {
        rows.push({
          key: p.id,
          ordenId: o.id,
          partidaId: p.id,
          fecha: o.fecha,
          empresa: o.empresa || "—",
          proyecto: o.proyecto,
          proveedor: o.proveedor,
          indice: p.indice,
          cantidad: p.cantidad,
          unidad: p.unidad || "—",
          nombreProducto: p.nombreProducto,
          caracteristicas: p.caracteristicas || "",
          paraQueSeUsara: p.paraQueSeUsara || "",
          quienRecibeMaterial: p.quienRecibeMaterial || "",
          quienLoUsa: p.quienLoUsa || "",
          quienLoPide: p.quienLoPide || "",
          precioUnitario: p.precioUnitario,
          importeTotal: p.importeTotal,
          facturasCount: o.facturasCount,
        });
      }
    }
    return rows;
  }, [ordenes]);

  const totalPages = Math.max(1, Math.ceil(filas.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const filasPage = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filas.slice(start, start + PAGE_SIZE);
  }, [filas, currentPage, PAGE_SIZE]);

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["compras", selectedId],
    queryFn: () => apiRequest<{ orden: OrdenCompra }>(`/compras/${selectedId}`),
    enabled: !!selectedId && detailOpen,
  });

  const detalle = detailData?.orden;

  const resetNuevaForm = () => {
    setFecha(todayISO());
    setClienteId("");
    setEmpresa("");
    setProyectoId("");
    setProyecto("");
    setProveedor("");
    setPartidasForm([emptyPartida(1)]);
    setNuevaGestionKey(null);
  };

  const createMutation = useMutation({
    mutationFn: (payload: {
      fecha: string;
      empresa: string;
      clienteId: string;
      proyectoId: string;
      proyecto: string;
      proveedor: string;
      partidas: Array<{
        indice: number;
        cantidad: number;
        unidad: string;
        nombreProducto: string;
        caracteristicas: string;
        paraQueSeUsara: string;
        quienRecibeMaterial: string;
        quienLoUsa: string;
        quienLoPide: string;
        precioUnitario: number;
        importeTotal: number;
      }>;
    }) => apiRequest<{ orden: OrdenCompra }>("/compras", { method: "POST", body: payload }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      toast.success("Compra registrada");
      setNuevaOpen(false);
      resetNuevaForm();
      if (res.orden?.id) {
        setSelectedId(res.orden.id);
        setDetailOpen(true);
      }
    },
    onError: (err: Error) => toast.error(err.message || "Error al crear la compra"),
  });

  const uploadFacturaMutation = useMutation({
    mutationFn: ({ ordenId, file }: { ordenId: string; file: File }) => {
      const body = new FormData();
      body.append("archivo", file);
      return apiRequest(`/compras/${ordenId}/facturas`, { method: "POST", body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      toast.success("Factura subida");
    },
    onError: (err: Error) => toast.error(err.message || "Error al subir factura"),
  });

  const uploadXlsmMutation = useMutation({
    mutationFn: ({ ordenId, file }: { ordenId: string; file: File }) => {
      const body = new FormData();
      body.append("archivo", file);
      return apiRequest(`/compras/${ordenId}/xlsm`, { method: "POST", body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      toast.success("XLSM guardado en la compra");
    },
    onError: (err: Error) => toast.error(err.message || "Error al subir XLSM"),
  });

  const deleteFacturaMutation = useMutation({
    mutationFn: ({ ordenId, facturaId }: { ordenId: string; facturaId: string }) =>
      apiRequest(`/compras/${ordenId}/facturas/${facturaId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      toast.success("Factura eliminada");
    },
    onError: (err: Error) => toast.error(err.message || "Error al eliminar"),
  });

  const gestionMutation = useMutation({
    mutationFn: ({
      ordenId,
      partidaId,
      body,
    }: {
      ordenId: string;
      partidaId: string;
      body: typeof gestionForm;
    }) =>
      apiRequest(`/compras/${ordenId}/partidas/${partidaId}/gestion`, {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      toast.success("Gestión guardada");
      setGestionOpen(false);
      setGestionPartida(null);
    },
    onError: (err: Error) => toast.error(err.message || "Error al guardar gestión"),
  });

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const openGestion = (row: (typeof filas)[number]) => {
    if (!row.partidaId) {
      toast.error("Esta fila no tiene partida para gestionar");
      return;
    }
    setNuevaGestionKey(null);
    setGestionPartida({
      ordenId: row.ordenId,
      partidaId: row.partidaId,
      nombreProducto: row.nombreProducto,
    });
    setGestionForm({
      caracteristicas: row.caracteristicas,
      paraQueSeUsara: row.paraQueSeUsara,
      quienRecibeMaterial: row.quienRecibeMaterial,
      quienLoUsa: row.quienLoUsa,
      quienLoPide: row.quienLoPide,
    });
    setGestionOpen(true);
  };

  const closeGestionDialog = () => {
    setGestionOpen(false);
    setGestionPartida(null);
    setNuevaGestionKey(null);
  };

  const nuevaGestionPartida = nuevaGestionKey
    ? partidasForm.find((p) => p.key === nuevaGestionKey) || null
    : null;

  const updatePartida = (key: string, patch: Partial<PartidaForm>) => {
    setPartidasForm((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  };

  const submitNueva = () => {
    if (!fecha.trim() || !empresa.trim() || !proyecto.trim() || !proveedor.trim()) {
      toast.error("Completa fecha, empresa, proyecto y proveedor");
      return;
    }
    if (!clienteId || !proyectoId) {
      toast.error("Selecciona empresa y proyecto de las listas");
      return;
    }
    const partidas = partidasForm
      .map((p, idx) => ({
        indice: idx + 1,
        cantidad: Number(p.cantidad),
        unidad: p.unidad.trim(),
        nombreProducto: p.nombreProducto.trim(),
        caracteristicas: p.caracteristicas.trim(),
        paraQueSeUsara: p.paraQueSeUsara.trim(),
        quienRecibeMaterial: p.quienRecibeMaterial.trim(),
        quienLoUsa: p.quienLoUsa.trim(),
        quienLoPide: p.quienLoPide.trim(),
        precioUnitario: Number(p.precioUnitario),
        importeTotal: calcImporte(p.cantidad, p.precioUnitario),
      }))
      .filter((p) => p.nombreProducto);

    if (partidas.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    if (partidas.some((p) => !Number.isFinite(p.cantidad) || p.cantidad <= 0)) {
      toast.error("Cada partida necesita cantidad mayor a 0");
      return;
    }

    createMutation.mutate({
      fecha: fecha.trim(),
      empresa: empresa.trim(),
      clienteId,
      proyectoId,
      proyecto: proyecto.trim(),
      proveedor: proveedor.trim(),
      partidas,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
          <p className="text-muted-foreground">
            Captura lo que se desea comprar y adjunta facturas o XLSM por orden
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/compras/facturas">
              <FileText className="mr-2 h-4 w-4" />
              Facturas
            </Link>
          </Button>
          {canImport && (
            <Button
              onClick={() => {
                resetNuevaForm();
                setNuevaOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva compra
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Compras / partidas
          </CardTitle>
          <div className="relative max-w-sm mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar empresa, proyecto o proveedor…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : filas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay compras. Usa &quot;Nueva compra&quot; para capturar lo que se desea comprar.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-center">Índice</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Nombre del Producto</TableHead>
                    <TableHead className="text-center">Gestión</TableHead>
                    <TableHead className="text-right">Precio unitario</TableHead>
                    <TableHead className="text-right">Importe total</TableHead>
                    <TableHead className="text-center">Facturas</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filasPage.map((row) => (
                    <TableRow
                      key={row.key}
                      className="cursor-pointer"
                      onClick={() => openDetail(row.ordenId)}
                    >
                      <TableCell className="whitespace-nowrap">{row.fecha}</TableCell>
                      <TableCell>{row.empresa}</TableCell>
                      <TableCell>{row.proyecto}</TableCell>
                      <TableCell>{row.proveedor}</TableCell>
                      <TableCell className="text-center">{row.indice}</TableCell>
                      <TableCell className="text-right">{row.cantidad}</TableCell>
                      <TableCell>{row.unidad}</TableCell>
                      <TableCell className="min-w-[160px]">{row.nombreProducto}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!row.partidaId}
                          onClick={(e) => {
                            e.stopPropagation();
                            openGestion(row);
                          }}
                        >
                          Gestión
                        </Button>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {typeof row.precioUnitario === "number"
                          ? formatMoney(row.precioUnitario)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {typeof row.importeTotal === "number"
                          ? formatMoney(row.importeTotal)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">{row.facturasCount}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(row.ordenId);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filas.length)} de {filas.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm tabular-nums">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={gestionOpen || !!nuevaGestionKey}
        onOpenChange={(open) => {
          if (!open) closeGestionDialog();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Gestión
              {gestionPartida
                ? ` · ${gestionPartida.nombreProducto}`
                : nuevaGestionPartida?.nombreProducto
                  ? ` · ${nuevaGestionPartida.nombreProducto}`
                  : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="gestion-caracteristicas">Características</Label>
              <Textarea
                id="gestion-caracteristicas"
                value={gestionForm.caracteristicas}
                onChange={(e) =>
                  setGestionForm((prev) => ({ ...prev, caracteristicas: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gestion-para-que">Para qué se usa</Label>
              <Textarea
                id="gestion-para-que"
                value={gestionForm.paraQueSeUsara}
                onChange={(e) =>
                  setGestionForm((prev) => ({ ...prev, paraQueSeUsara: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gestion-recibe">Quién recibe el material</Label>
              <Input
                id="gestion-recibe"
                value={gestionForm.quienRecibeMaterial}
                onChange={(e) =>
                  setGestionForm((prev) => ({ ...prev, quienRecibeMaterial: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gestion-usa">Quién lo usa</Label>
              <Input
                id="gestion-usa"
                value={gestionForm.quienLoUsa}
                onChange={(e) =>
                  setGestionForm((prev) => ({ ...prev, quienLoUsa: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gestion-pide">Quién lo pide</Label>
              <Input
                id="gestion-pide"
                value={gestionForm.quienLoPide}
                onChange={(e) =>
                  setGestionForm((prev) => ({ ...prev, quienLoPide: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={closeGestionDialog}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={
                  (!nuevaGestionKey && (!canImport || !gestionPartida)) ||
                  gestionMutation.isPending
                }
                onClick={() => {
                  if (nuevaGestionKey) {
                    updatePartida(nuevaGestionKey, { ...gestionForm });
                    closeGestionDialog();
                    toast.success("Gestión aplicada a la partida");
                    return;
                  }
                  if (!gestionPartida) return;
                  gestionMutation.mutate({
                    ordenId: gestionPartida.ordenId,
                    partidaId: gestionPartida.partidaId,
                    body: gestionForm,
                  });
                }}
              >
                {gestionMutation.isPending ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={nuevaOpen}
        onOpenChange={(open) => {
          setNuevaOpen(open);
          if (!open) resetNuevaForm();
        }}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="compra-fecha">Fecha de compra</Label>
                <Input
                  id="compra-fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Empresa</Label>
                <Select
                  value={clienteId || undefined}
                  onValueChange={(value) => {
                    const selected = clientes.find((c) => c.id === value);
                    setClienteId(value);
                    setEmpresa(selected?.nombre || "");
                    setProyectoId("");
                    setProyecto("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Proyecto destino</Label>
                <Select
                  value={proyectoId || undefined}
                  disabled={!clienteId}
                  onValueChange={(value) => {
                    const selected = proyectosEmpresa.find((p) => p.id === value);
                    setProyectoId(value);
                    setProyecto(selected?.nombre || "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        clienteId ? "Selecciona proyecto" : "Primero elige empresa"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {proyectosEmpresa.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        Sin proyectos para esta empresa
                      </SelectItem>
                    ) : (
                      proyectosEmpresa.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="compra-proveedor">Proveedor</Label>
                <Input
                  id="compra-proveedor"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  placeholder="Nombre del proveedor"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Partidas</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPartidasForm((prev) => [...prev, emptyPartida(prev.length + 1)])
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Agregar partida
                </Button>
              </div>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead className="min-w-[90px]">Cantidad</TableHead>
                      <TableHead className="min-w-[80px]">Unidad</TableHead>
                      <TableHead className="min-w-[160px]">Nombre del producto</TableHead>
                      <TableHead className="text-center">Gestión</TableHead>
                      <TableHead className="min-w-[110px]">P. unitario</TableHead>
                      <TableHead className="min-w-[110px] text-right">Importe</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partidasForm.map((p, idx) => (
                      <TableRow key={p.key}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={p.cantidad}
                            onChange={(e) => updatePartida(p.key, { cantidad: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={p.unidad}
                            onChange={(e) => updatePartida(p.key, { unidad: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={p.nombreProducto}
                            onChange={(e) =>
                              updatePartida(p.key, { nombreProducto: e.target.value })
                            }
                            placeholder="Producto"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNuevaGestionKey(p.key);
                              setGestionForm({
                                caracteristicas: p.caracteristicas,
                                paraQueSeUsara: p.paraQueSeUsara,
                                quienRecibeMaterial: p.quienRecibeMaterial,
                                quienLoUsa: p.quienLoUsa,
                                quienLoPide: p.quienLoPide,
                              });
                            }}
                          >
                            Gestión
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={p.precioUnitario}
                            onChange={(e) =>
                              updatePartida(p.key, { precioUnitario: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {formatMoney(calcImporte(p.cantidad, p.precioUnitario))}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={partidasForm.length <= 1}
                            onClick={() =>
                              setPartidasForm((prev) => prev.filter((x) => x.key !== p.key))
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end text-sm font-semibold">
                Total: {formatMoney(totalForm)}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNuevaOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={submitNueva}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Guardando…" : "Guardar compra"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detalle
                ? `${detalle.proyecto} · ${detalle.proveedor} · ${detalle.fecha}`
                : "Detalle de orden"}
            </DialogTitle>
          </DialogHeader>
          {detailLoading || !detalle ? (
            <p className="text-sm text-muted-foreground">Cargando detalle…</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-semibold">{formatMoney(detalle.total)}</p>
                {canFacturas && (
                  <>
                    <input
                      ref={facturaRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file && selectedId) {
                          uploadFacturaMutation.mutate({ ordenId: selectedId, file });
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={uploadFacturaMutation.isPending}
                      onClick={() => facturaRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Subir factura
                    </Button>
                  </>
                )}
              </div>

              <div className="rounded-md border p-3 space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Archivo XLSM
                </h3>
                {detalle.archivoImportPath ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="truncate text-muted-foreground">
                      {detalle.archivoImportPath.split("/").pop()}
                    </span>
                    <div className="flex gap-2">
                      {toAbsoluteAssetUrl(detalle.archivoImportPath) && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={toAbsoluteAssetUrl(detalle.archivoImportPath)!}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Descargar
                          </a>
                        </Button>
                      )}
                      {canImport && (
                        <>
                          <input
                            ref={xlsmRef}
                            type="file"
                            accept=".xlsm,.xlsx"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (file && selectedId) {
                                uploadXlsmMutation.mutate({ ordenId: selectedId, file });
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={uploadXlsmMutation.isPending}
                            onClick={() => xlsmRef.current?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Reemplazar XLSM
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">Sin archivo XLSM en esta compra.</p>
                    {canImport && (
                      <>
                        <input
                          ref={xlsmRef}
                          type="file"
                          accept=".xlsm,.xlsx"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file && selectedId) {
                              uploadXlsmMutation.mutate({ ordenId: selectedId, file });
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          disabled={uploadXlsmMutation.isPending}
                          onClick={() => xlsmRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {uploadXlsmMutation.isPending ? "Subiendo…" : "Subir XLSM"}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Partidas</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cant.</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="text-right">P.U.</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(detalle.partidas || []).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.indice}</TableCell>
                        <TableCell>
                          <div>{p.nombreProducto}</div>
                          {p.caracteristicas && (
                            <div className="text-xs text-muted-foreground">{p.caracteristicas}</div>
                          )}
                        </TableCell>
                        <TableCell>{p.cantidad}</TableCell>
                        <TableCell>{p.unidad || "—"}</TableCell>
                        <TableCell className="text-right">{formatMoney(p.precioUnitario)}</TableCell>
                        <TableCell className="text-right">{formatMoney(p.importeTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Facturas</h3>
                {(detalle.facturas || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin facturas adjuntas.</p>
                ) : (
                  <ul className="space-y-2">
                    {(detalle.facturas || []).map((f) => {
                      const url = toAbsoluteAssetUrl(f.archivoPath);
                      return (
                        <li
                          key={f.id}
                          className="flex items-center justify-between gap-2 rounded border px-3 py-2 text-sm"
                        >
                          <span className="truncate">{f.nombreOriginal}</span>
                          <div className="flex shrink-0 gap-1">
                            {url && (
                              <Button size="sm" variant="ghost" asChild>
                                <a href={url} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {canFacturas && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  deleteFacturaMutation.mutate({
                                    ordenId: detalle.id,
                                    facturaId: f.id,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Compras;
