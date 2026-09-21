import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronDown, Download, Plus, Search, Wallet } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { apiDownload, apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS } from "@/lib/permissions";

type Concepto = {
  id: string;
  tipo: "percepcion" | "deduccion";
  concepto: string;
  monto: number;
};

type Linea = {
  id: string;
  trabajadorId: string;
  sueldoBase: number;
  totalPercepciones: number;
  totalDeducciones: number;
  neto: number;
  estadoPago: "pendiente" | "pagado";
  pagadoEn?: string | null;
  trabajador?: { id: string; nombre: string; cargo?: string | null };
  conceptos?: Concepto[];
};

type Periodo = {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  nombre: string | null;
  estado: "borrador" | "cerrado";
  totalNeto: number;
  trabajadoresCount?: number;
  lineas?: Linea[];
};

const formatMoney = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);

const todayISO = () => new Date().toISOString().slice(0, 10);

const CONCEPTOS_POR_TIPO = {
  percepcion: [
    "Bono",
    "Horas extras",
    "Compensaciones y/o reposiciones",
    "Otros",
  ],
  deduccion: [
    "Faltas",
    "Descuento / Préstamos y/o tiempo",
    "Retención de pensión alimenticia",
    "Retención INFONAVIT",
    "Otros",
  ],
} as const;

const CONCEPTOS_FIJOS = {
  percepcion: CONCEPTOS_POR_TIPO.percepcion.filter((c) => c !== "Otros"),
  deduccion: CONCEPTOS_POR_TIPO.deduccion.filter((c) => c !== "Otros"),
};

const CONCEPTO_HEADER_LABEL: Record<string, string> = {
  Bono: "Bono",
  "Horas extras": "Horas extras",
  "Compensaciones y/o reposiciones": "Compensaciones",
  Faltas: "Faltas",
  "Descuento / Préstamos y/o tiempo": "Desc./Préstamos",
  "Retención de pensión alimenticia": "Pensión",
  "Retención INFONAVIT": "INFONAVIT",
  Otros: "Otros",
};

const montoConceptoColumna = (
  linea: Linea,
  tipo: "percepcion" | "deduccion",
  nombre: string
) => {
  const conceptos = (linea.conceptos || []).filter((c) => c.tipo === tipo);
  if (nombre === "Otros") {
    const fijos = new Set(CONCEPTOS_FIJOS[tipo] as readonly string[]);
    return conceptos
      .filter((c) => !fijos.has(c.concepto))
      .reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
  }
  return conceptos
    .filter((c) => c.concepto === nombre)
    .reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
};

const formatMoneyCell = (n: number) => (n ? formatMoney(n) : "—");

type ConceptoCampo = {
  monto: string;
  libre: string;
  precio: string;
  horas: string;
};

type ConceptosCampos = Record<string, ConceptoCampo>;

const emptyCamposForTipo = (tipo: "percepcion" | "deduccion"): ConceptosCampos =>
  Object.fromEntries(
    CONCEPTOS_POR_TIPO[tipo].map((nombre) => [
      nombre,
      { monto: "", libre: "", precio: "", horas: "" },
    ])
  );

const calcProductoMonto = (precio: string, cantidad: string) => {
  const p = Number(precio);
  const c = Number(cantidad);
  if (!Number.isFinite(p) || !Number.isFinite(c)) return NaN;
  return Number((p * c).toFixed(2));
};

const CONCEPTOS_PRECIO_CANTIDAD = new Set(["Horas extras", "Faltas"]);

const Nomina = () => {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = can(PERMISSIONS.NOMINA_CREATE);
  const canPay = can(PERMISSIONS.NOMINA_PAY);

  const [estadoFiltro, setEstadoFiltro] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [nuevaOpen, setNuevaOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(todayISO());
  const [fechaFin, setFechaFin] = useState(todayISO());
  const [nombre, setNombre] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [conceptosOpen, setConceptosOpen] = useState(false);
  const [lineaActiva, setLineaActiva] = useState<Linea | null>(null);
  const [sueldoEdit, setSueldoEdit] = useState("");
  const [camposPercepcion, setCamposPercepcion] = useState<ConceptosCampos>(() =>
    emptyCamposForTipo("percepcion")
  );
  const [camposDeduccion, setCamposDeduccion] = useState<ConceptosCampos>(() =>
    emptyCamposForTipo("deduccion")
  );
  const [guardandoConceptos, setGuardandoConceptos] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [percepcionesOpen, setPercepcionesOpen] = useState(false);
  const [deduccionesOpen, setDeduccionesOpen] = useState(false);

  const listQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (estadoFiltro !== "all") params.set("estado", estadoFiltro);
    if (search.trim()) params.set("q", search.trim());
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [estadoFiltro, search]);

  const { data, isLoading } = useQuery({
    queryKey: ["nomina-periodos", listQuery],
    queryFn: () => apiRequest<{ periodos: Periodo[] }>(`/nomina/periodos${listQuery}`),
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["nomina-periodo", selectedId],
    queryFn: () => apiRequest<{ periodo: Periodo }>(`/nomina/periodos/${selectedId}`),
    enabled: !!selectedId && detailOpen,
  });

  const periodoDetalle = detailData?.periodo;
  const isBorrador = periodoDetalle?.estado === "borrador";

  const createMutation = useMutation({
    mutationFn: (payload: { fechaInicio: string; fechaFin: string; nombre?: string | null }) =>
      apiRequest<{ periodo: Periodo }>("/nomina/periodos", { method: "POST", body: payload }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["nomina-periodos"] });
      toast.success("Nómina creada");
      setNuevaOpen(false);
      setSelectedId(res.periodo.id);
      setDetailOpen(true);
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo crear la nómina"),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ periodo: Periodo }>(`/nomina/periodos/${id}`, {
        method: "PATCH",
        body: { estado: "cerrado" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomina-periodos"] });
      queryClient.invalidateQueries({ queryKey: ["nomina-periodo", selectedId] });
      toast.success("Periodo cerrado y líneas marcadas como pagadas");
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo cerrar el periodo"),
  });

  const updateLineaMutation = useMutation({
    mutationFn: ({
      periodoId,
      lineaId,
      body,
    }: {
      periodoId: string;
      lineaId: string;
      body: Record<string, unknown>;
    }) =>
      apiRequest<{ linea: Linea }>(`/nomina/periodos/${periodoId}/lineas/${lineaId}`, {
        method: "PATCH",
        body,
      }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nomina-periodos"] });
      queryClient.invalidateQueries({ queryKey: ["nomina-periodo", selectedId] });
      if (lineaActiva && res.linea.id === lineaActiva.id) {
        setLineaActiva(res.linea);
        setSueldoEdit(String(res.linea.sueldoBase));
      }
      if ("estadoPago" in variables.body) {
        toast.success("Línea actualizada");
      }
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo actualizar la línea"),
  });

  const addConceptoMutation = useMutation({
    mutationFn: ({
      periodoId,
      lineaId,
      body,
    }: {
      periodoId: string;
      lineaId: string;
      body: { tipo: "percepcion" | "deduccion"; concepto: string; monto: number };
    }) =>
      apiRequest<{ linea: Linea }>(
        `/nomina/periodos/${periodoId}/lineas/${lineaId}/conceptos`,
        { method: "POST", body }
      ),
  });

  const deleteConceptoMutation = useMutation({
    mutationFn: ({
      periodoId,
      lineaId,
      conceptoId,
    }: {
      periodoId: string;
      lineaId: string;
      conceptoId: string;
    }) =>
      apiRequest<{ linea: Linea }>(
        `/nomina/periodos/${periodoId}/lineas/${lineaId}/conceptos/${conceptoId}`,
        { method: "DELETE" }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["nomina-periodos"] });
      queryClient.invalidateQueries({ queryKey: ["nomina-periodo", selectedId] });
      setLineaActiva(res.linea);
      toast.success("Concepto eliminado");
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo eliminar el concepto"),
  });

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const downloadXlsx = async () => {
    if (!periodoDetalle) return;
    setDescargando(true);
    try {
      const label =
        periodoDetalle.nombre ||
        `${periodoDetalle.fechaInicio}_${periodoDetalle.fechaFin}`;
      const safe =
        label
          .trim()
          .replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/gi, "")
          .replace(/\s+/g, "_")
          .slice(0, 60) || "periodo";
      await apiDownload(`/nomina/periodos/${periodoDetalle.id}/xlsx`, {
        fallbackFilename: `nomina_${safe}.xlsx`,
      });
      toast.success("Nómina descargada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo descargar el Excel");
    } finally {
      setDescargando(false);
    }
  };

  const openConceptos = (linea: Linea) => {
    setLineaActiva(linea);
    setSueldoEdit(String(linea.sueldoBase ?? 0));
    setCamposPercepcion(emptyCamposForTipo("percepcion"));
    setCamposDeduccion(emptyCamposForTipo("deduccion"));
    setPercepcionesOpen(false);
    setDeduccionesOpen(false);
    setConceptosOpen(true);
  };

  const updateCampo = (
    tipo: "percepcion" | "deduccion",
    nombre: string,
    patch: Partial<ConceptoCampo>
  ) => {
    const setter = tipo === "percepcion" ? setCamposPercepcion : setCamposDeduccion;
    setter((prev) => ({
      ...prev,
      [nombre]: { ...prev[nombre], ...patch },
    }));
  };

  const collectPendientes = (
    tipo: "percepcion" | "deduccion",
    campos: ConceptosCampos
  ): { tipo: "percepcion" | "deduccion"; concepto: string; monto: number }[] | null => {
    const pendientes: { tipo: "percepcion" | "deduccion"; concepto: string; monto: number }[] =
      [];
    for (const clave of CONCEPTOS_POR_TIPO[tipo]) {
      const campo = campos[clave];
      if (!campo) continue;

      let monto: number;
      if (CONCEPTOS_PRECIO_CANTIDAD.has(clave)) {
        const tienePrecio = campo.precio.trim() !== "";
        const tieneCantidad = campo.horas.trim() !== "";
        if (!tienePrecio && !tieneCantidad) continue;
        if (!tienePrecio || !tieneCantidad) {
          toast.error(
            clave === "Horas extras"
              ? "En Horas extras indica precio y cantidad de horas"
              : "En Faltas indica precio y cantidad de faltas"
          );
          return null;
        }
        monto = calcProductoMonto(campo.precio, campo.horas);
        if (!Number.isFinite(monto) || monto < 0) {
          toast.error(
            clave === "Horas extras"
              ? "Precio u horas inválidos en Horas extras"
              : "Precio o cantidad inválidos en Faltas"
          );
          return null;
        }
        if (monto === 0) continue;
      } else {
        if (!campo.monto.trim()) continue;
        monto = Number(campo.monto);
        if (!Number.isFinite(monto) || monto < 0) {
          toast.error(`Monto inválido en ${clave}`);
          return null;
        }
        if (monto === 0) continue;
      }

      const concepto = clave === "Otros" ? campo.libre.trim() : clave;
      if (!concepto) {
        toast.error(
          `Describe el concepto en Otros (${tipo === "percepcion" ? "percepción" : "deducción"})`
        );
        return null;
      }
      pendientes.push({ tipo, concepto, monto });
    }
    return pendientes;
  };

  const submitBalance = async () => {
    if (!periodoDetalle || !lineaActiva) return;

    const sueldo = Number(sueldoEdit);
    if (!Number.isFinite(sueldo) || sueldo < 0) {
      toast.error("Sueldo inválido");
      return;
    }

    const percepcionesPendientes = collectPendientes("percepcion", camposPercepcion);
    if (percepcionesPendientes === null) return;
    const deduccionesPendientes = collectPendientes("deduccion", camposDeduccion);
    if (deduccionesPendientes === null) return;

    const pendientes = [...percepcionesPendientes, ...deduccionesPendientes];
    const sueldoCambio = Number(lineaActiva.sueldoBase) !== sueldo;

    if (!sueldoCambio && pendientes.length === 0) {
      toast.error("Cambia el sueldo o indica al menos un monto mayor a 0");
      return;
    }

    setGuardandoConceptos(true);
    try {
      let lastLinea: Linea | null = null;

      if (sueldoCambio) {
        const resSueldo = await updateLineaMutation.mutateAsync({
          periodoId: periodoDetalle.id,
          lineaId: lineaActiva.id,
          body: { sueldoBase: sueldo },
        });
        lastLinea = resSueldo.linea;
      }

      for (const item of pendientes) {
        const res = await addConceptoMutation.mutateAsync({
          periodoId: periodoDetalle.id,
          lineaId: lineaActiva.id,
          body: { tipo: item.tipo, concepto: item.concepto, monto: item.monto },
        });
        lastLinea = res.linea;
      }

      if (lastLinea) {
        setLineaActiva(lastLinea);
        setSueldoEdit(String(lastLinea.sueldoBase));
      }
      queryClient.invalidateQueries({ queryKey: ["nomina-periodos"] });
      queryClient.invalidateQueries({ queryKey: ["nomina-periodo", selectedId] });
      setCamposPercepcion(emptyCamposForTipo("percepcion"));
      setCamposDeduccion(emptyCamposForTipo("deduccion"));

      if (sueldoCambio && pendientes.length === 0) {
        toast.success("Sueldo base guardado");
      } else if (sueldoCambio) {
        toast.success(
          pendientes.length === 1
            ? "Sueldo y balance guardados"
            : `Sueldo y balance guardados (${pendientes.length} conceptos)`
        );
      } else {
        toast.success(
          pendientes.length === 1
            ? "Balance agregado"
            : `Balance agregado (${pendientes.length} conceptos)`
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardandoConceptos(false);
    }
  };

  const renderCamposForm = (
    tipo: "percepcion" | "deduccion",
    titulo: string,
    campos: ConceptosCampos
  ) => (
    <div className="space-y-3 rounded-md border p-3">
      <Label className="text-sm font-semibold">{titulo}</Label>
      {CONCEPTOS_POR_TIPO[tipo].map((nombre) => {
        if (CONCEPTOS_PRECIO_CANTIDAD.has(nombre)) {
          const precio = campos[nombre]?.precio || "";
          const cantidad = campos[nombre]?.horas || "";
          const total = calcProductoMonto(precio, cantidad);
          const totalLabel =
            precio.trim() && cantidad.trim() && Number.isFinite(total)
              ? formatMoney(total)
              : "—";
          const cantidadLabel = nombre === "Horas extras" ? "Horas" : "Cantidad de faltas";
          const totalPrefix =
            nombre === "Horas extras" ? "Total percepción" : "Total deducción";
          return (
            <div key={nombre} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{nombre}</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    {nombre === "Horas extras" ? "Precio / hora" : "Precio / falta"}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={precio}
                    onChange={(e) => updateCampo(tipo, nombre, { precio: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{cantidadLabel}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={cantidad}
                    onChange={(e) => updateCampo(tipo, nombre, { horas: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {totalPrefix}: <span className="font-medium text-foreground">{totalLabel}</span>
              </p>
            </div>
          );
        }

        return (
          <div key={nombre} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{nombre}</Label>
            {nombre === "Otros" && (
              <Input
                placeholder={`Describe ${tipo === "percepcion" ? "la percepción" : "la deducción"}`}
                value={campos[nombre]?.libre || ""}
                onChange={(e) => updateCampo(tipo, nombre, { libre: e.target.value })}
              />
            )}
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={campos[nombre]?.monto || ""}
              onChange={(e) => updateCampo(tipo, nombre, { monto: e.target.value })}
            />
          </div>
        );
      })}
    </div>
  );

  const percepciones = (lineaActiva?.conceptos || []).filter((c) => c.tipo === "percepcion");
  const deducciones = (lineaActiva?.conceptos || []).filter((c) => c.tipo === "deduccion");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nómina</h1>
          <p className="text-sm text-muted-foreground">
            Periodos de pago, percepciones y deducciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/nomina/extras">
              <Wallet className="mr-2 h-4 w-4" />
              Pagos extras
            </Link>
          </Button>
          {canCreate && (
            <Button onClick={() => setNuevaOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva nómina
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Periodos</CardTitle>
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar por nombre…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : !(data?.periodos || []).length ? (
            <p className="text-sm text-muted-foreground">
              No hay periodos. Usa &quot;Nueva nómina&quot; para crear uno.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Fechas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Trabajadores</TableHead>
                  <TableHead className="text-right">Total neto</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.periodos || []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.nombre || "Sin nombre"}</TableCell>
                    <TableCell>
                      {p.fechaInicio} → {p.fechaFin}
                    </TableCell>
                    <TableCell className="capitalize">{p.estado}</TableCell>
                    <TableCell className="text-right">{p.trabajadoresCount ?? 0}</TableCell>
                    <TableCell className="text-right">{formatMoney(p.totalNeto)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openDetail(p.id)}>
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={nuevaOpen} onOpenChange={setNuevaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva nómina</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Fecha inicio</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha fin</Label>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nombre (opcional)</Label>
              <Input
                placeholder="Ej: Quincena 1 septiembre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={createMutation.isPending}
              onClick={() => {
                if (!fechaInicio || !fechaFin) {
                  toast.error("Indica las fechas del periodo");
                  return;
                }
                if (fechaFin < fechaInicio) {
                  toast.error("La fecha fin debe ser ≥ fecha inicio");
                  return;
                }
                createMutation.mutate({
                  fechaInicio,
                  fechaFin,
                  nombre: nombre.trim() || null,
                });
              }}
            >
              Crear periodo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {periodoDetalle?.nombre || "Periodo"}{" "}
              {periodoDetalle
                ? `(${periodoDetalle.fechaInicio} → ${periodoDetalle.fechaFin})`
                : ""}
            </DialogTitle>
          </DialogHeader>
          {detailLoading || !periodoDetalle ? (
            <p className="text-sm text-muted-foreground">Cargando detalle…</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  Estado: <span className="capitalize font-medium">{periodoDetalle.estado}</span>
                  {" · "}
                  Total neto: <strong>{formatMoney(periodoDetalle.totalNeto)}</strong>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={descargando}
                    onClick={() => downloadXlsx()}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Excel
                  </Button>
                  {canPay && periodoDetalle.estado === "borrador" && (
                    <Button
                      variant="default"
                      disabled={closeMutation.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            "¿Cerrar el periodo? Se marcarán todas las líneas pendientes como pagadas."
                          )
                        ) {
                          closeMutation.mutate(periodoDetalle.id);
                        }
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Cerrar periodo
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead rowSpan={2} className="align-bottom">
                        Trabajador
                      </TableHead>
                      <TableHead rowSpan={2} className="align-bottom text-right whitespace-nowrap">
                        Sueldo base
                      </TableHead>
                      <TableHead
                        colSpan={CONCEPTOS_POR_TIPO.percepcion.length}
                        className="text-center border-b"
                      >
                        Percepciones
                      </TableHead>
                      <TableHead
                        colSpan={CONCEPTOS_POR_TIPO.deduccion.length}
                        className="text-center border-b"
                      >
                        Deducciones
                      </TableHead>
                      <TableHead rowSpan={2} className="align-bottom text-right">
                        Neto
                      </TableHead>
                      <TableHead rowSpan={2} className="align-bottom">
                        Pago
                      </TableHead>
                      <TableHead rowSpan={2} className="align-bottom" />
                    </TableRow>
                    <TableRow>
                      {CONCEPTOS_POR_TIPO.percepcion.map((nombre) => (
                        <TableHead
                          key={`p-${nombre}`}
                          className="text-right text-xs whitespace-nowrap font-medium"
                          title={nombre}
                        >
                          {CONCEPTO_HEADER_LABEL[nombre] || nombre}
                        </TableHead>
                      ))}
                      {CONCEPTOS_POR_TIPO.deduccion.map((nombre) => (
                        <TableHead
                          key={`d-${nombre}`}
                          className="text-right text-xs whitespace-nowrap font-medium"
                          title={nombre}
                        >
                          {CONCEPTO_HEADER_LABEL[nombre] || nombre}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(periodoDetalle.lineas || []).map((linea) => (
                      <TableRow key={linea.id}>
                        <TableCell className="whitespace-nowrap">
                          {linea.trabajador?.nombre || "—"}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {formatMoney(linea.sueldoBase)}
                        </TableCell>
                        {CONCEPTOS_POR_TIPO.percepcion.map((nombre) => (
                          <TableCell
                            key={`${linea.id}-p-${nombre}`}
                            className="text-right whitespace-nowrap text-sm"
                          >
                            {formatMoneyCell(montoConceptoColumna(linea, "percepcion", nombre))}
                          </TableCell>
                        ))}
                        {CONCEPTOS_POR_TIPO.deduccion.map((nombre) => (
                          <TableCell
                            key={`${linea.id}-d-${nombre}`}
                            className="text-right whitespace-nowrap text-sm"
                          >
                            {formatMoneyCell(montoConceptoColumna(linea, "deduccion", nombre))}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          {formatMoney(linea.neto)}
                        </TableCell>
                        <TableCell className="capitalize whitespace-nowrap">
                          {linea.estadoPago}
                        </TableCell>
                        <TableCell className="text-right space-x-1 whitespace-nowrap">
                          <Button size="sm" variant="outline" onClick={() => openConceptos(linea)}>
                            Conceptos
                          </Button>
                          {canPay &&
                            isBorrador &&
                            linea.estadoPago === "pendiente" && (
                              <Button
                                size="sm"
                                disabled={updateLineaMutation.isPending}
                                onClick={() =>
                                  updateLineaMutation.mutate({
                                    periodoId: periodoDetalle.id,
                                    lineaId: linea.id,
                                    body: { estadoPago: "pagado" },
                                  })
                                }
                              >
                                Pagar
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={conceptosOpen} onOpenChange={setConceptosOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Conceptos · {lineaActiva?.trabajador?.nombre || "Trabajador"}
            </DialogTitle>
          </DialogHeader>
          {lineaActiva && periodoDetalle && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sueldo base (periodo)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sueldoEdit}
                  disabled={!canCreate || !isBorrador}
                  onChange={(e) => setSueldoEdit(e.target.value)}
                />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Percepciones</h3>
                {percepciones.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin percepciones</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {percepciones.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2">
                        <span>
                          {c.concepto}: {formatMoney(c.monto)}
                        </span>
                        {canCreate && isBorrador && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              deleteConceptoMutation.mutate({
                                periodoId: periodoDetalle.id,
                                lineaId: lineaActiva.id,
                                conceptoId: c.id,
                              })
                            }
                          >
                            Quitar
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Deducciones</h3>
                {deducciones.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin deducciones</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {deducciones.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2">
                        <span>
                          {c.concepto}: {formatMoney(c.monto)}
                        </span>
                        {canCreate && isBorrador && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              deleteConceptoMutation.mutate({
                                periodoId: periodoDetalle.id,
                                lineaId: lineaActiva.id,
                                conceptoId: c.id,
                              })
                            }
                          >
                            Quitar
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-md border p-3 text-sm">
                Neto: <strong>{formatMoney(lineaActiva.neto)}</strong>
              </div>

              {canCreate && isBorrador && (
                <div className="space-y-3 border-t pt-3">
                  <Collapsible open={percepcionesOpen} onOpenChange={setPercepcionesOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex w-full items-center justify-between"
                      >
                        <span>Percepciones</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            percepcionesOpen ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      {renderCamposForm("percepcion", "Percepciones", camposPercepcion)}
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible open={deduccionesOpen} onOpenChange={setDeduccionesOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex w-full items-center justify-between"
                      >
                        <span>Deducciones</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            deduccionesOpen ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      {renderCamposForm("deduccion", "Deducciones", camposDeduccion)}
                    </CollapsibleContent>
                  </Collapsible>

                  <Button
                    className="w-full"
                    disabled={guardandoConceptos}
                    onClick={() => submitBalance()}
                  >
                    Agregar Balance
                  </Button>
                </div>
              )}
              {!isBorrador && (
                <p className="text-xs text-muted-foreground">
                  Periodo cerrado: solo lectura.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Nomina;
