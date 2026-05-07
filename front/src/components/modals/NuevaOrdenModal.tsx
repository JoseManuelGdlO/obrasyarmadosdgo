import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Save, Trash2, X, Package, Users } from "lucide-react"
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton"
import { apiRequest } from "@/lib/api"
import { toast } from "sonner"
import type { OrdenBackend } from "@/pages/OrdenesTrabajo"

interface NuevaOrdenModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ordenId?: string | null
}

interface MaquinaForm {
  id: string
  nombre: string
  numeroSerie?: string
  ubicacion?: string
  horometroActual?: number | string
}

interface TrabajadorOpt {
  id: string
  nombre: string
}

interface ProveedorOpt {
  id: string
  nombre: string
}

interface NomenclaturaOpt {
  id: string
  codigo: string
  nombre: string
}

interface ProyectoOpt {
  id: string
  nombre: string
}

interface ArticuloOpt {
  id: string
  nombre: string
  unidad?: string | null
  precioUnitario?: string | number | null
}

interface ActividadForm {
  id: string
  descripcion: string
  tecnicos: string[]
  horaInicio: string
  horaFin: string
}

interface ItemForm {
  id: string
  articuloId: string
  producto: string
  cantidad: number
  unidad: string
  costoUnitario: number | null
}

const PRIORIDADES = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
] as const

const ESTADOS = [
  { value: "abierta", label: "Abierta" },
  { value: "en_progreso", label: "En progreso" },
  { value: "pausada", label: "Pausada" },
  { value: "cerrada", label: "Cerrada" },
] as const

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`

const NuevaOrdenModal = ({ open, onOpenChange, ordenId }: NuevaOrdenModalProps) => {
  const queryClient = useQueryClient()
  const isEdit = Boolean(ordenId)

  const [folio, setFolio] = useState("")
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [prioridad, setPrioridad] = useState<(typeof PRIORIDADES)[number]["value"]>("media")
  const [estado, setEstado] = useState<(typeof ESTADOS)[number]["value"]>("abierta")
  const [fechaVencimiento, setFechaVencimiento] = useState("")
  const [maquinaId, setMaquinaId] = useState("")
  const [proyectoId, setProyectoId] = useState("")
  const [nomenclaturaId, setNomenclaturaId] = useState("")
  const [responsableId, setResponsableId] = useState("")
  const [actividades, setActividades] = useState<ActividadForm[]>([])
  const [items, setItems] = useState<ItemForm[]>([])

  const [necesitaProveedorExterno, setNecesitaProveedorExterno] = useState(false)
  const [proveedorId, setProveedorId] = useState("")
  const [descripcionProveedor, setDescripcionProveedor] = useState("")

  const [actividadDraft, setActividadDraft] = useState<ActividadForm>({
    id: "",
    descripcion: "",
    tecnicos: [],
    horaInicio: "",
    horaFin: "",
  })
  const [tecnicoTemp, setTecnicoTemp] = useState("")
  const [productoTemp, setProductoTemp] = useState("")
  const [cantidadTemp, setCantidadTemp] = useState("")

  const maquinasQuery = useQuery({
    queryKey: ["maquinas-options"],
    enabled: open,
    queryFn: () => apiRequest<{ maquinas: MaquinaForm[] }>("/maquinas"),
  })
  const trabajadoresQuery = useQuery({
    queryKey: ["trabajadores-options"],
    enabled: open,
    queryFn: () => apiRequest<{ trabajadores: TrabajadorOpt[] }>("/trabajadores"),
  })
  const proveedoresQuery = useQuery({
    queryKey: ["proveedores-options"],
    enabled: open,
    queryFn: () => apiRequest<{ proveedores: ProveedorOpt[] }>("/proveedores"),
  })
  const nomenclaturasQuery = useQuery({
    queryKey: ["nomenclaturas-options"],
    enabled: open,
    queryFn: () => apiRequest<{ nomenclaturas: NomenclaturaOpt[] }>("/nomenclaturas"),
  })
  const proyectosQuery = useQuery({
    queryKey: ["proyectos-options"],
    enabled: open,
    queryFn: () => apiRequest<{ proyectos: ProyectoOpt[] }>("/proyectos"),
  })
  const articulosQuery = useQuery({
    queryKey: ["articulos-options"],
    enabled: open,
    queryFn: () => apiRequest<{ articulos: ArticuloOpt[] }>("/articulos"),
  })

  const ordenQuery = useQuery({
    queryKey: ["orden-trabajo", ordenId],
    enabled: open && Boolean(ordenId),
    queryFn: () => apiRequest<{ orden: OrdenBackend }>(`/ordenes-trabajo/${ordenId}`),
  })

  const maquinas = maquinasQuery.data?.maquinas ?? []
  const trabajadores = trabajadoresQuery.data?.trabajadores ?? []
  const proveedores = proveedoresQuery.data?.proveedores ?? []
  const nomenclaturas = nomenclaturasQuery.data?.nomenclaturas ?? []
  const proyectos = proyectosQuery.data?.proyectos ?? []
  const articulos = articulosQuery.data?.articulos ?? []

  const maquinaSeleccionada = useMemo(
    () => maquinas.find((m) => m.id === maquinaId) || null,
    [maquinas, maquinaId]
  )

  const resetForm = () => {
    setFolio("")
    setTitulo("")
    setDescripcion("")
    setPrioridad("media")
    setEstado("abierta")
    setFechaVencimiento("")
    setMaquinaId("")
    setProyectoId("")
    setNomenclaturaId("")
    setResponsableId("")
    setActividades([])
    setItems([])
    setNecesitaProveedorExterno(false)
    setProveedorId("")
    setDescripcionProveedor("")
    setActividadDraft({ id: "", descripcion: "", tecnicos: [], horaInicio: "", horaFin: "" })
    setTecnicoTemp("")
    setProductoTemp("")
    setCantidadTemp("")
  }

  useEffect(() => {
    if (!open) {
      resetForm()
      return
    }
    if (!ordenId) {
      resetForm()
      return
    }
    if (ordenQuery.data?.orden) {
      const o = ordenQuery.data.orden
      setFolio(o.folio || "")
      setTitulo(o.titulo || "")
      setDescripcion(o.descripcion || "")
      setPrioridad(o.prioridad)
      setEstado(o.estado)
      setFechaVencimiento(o.fechaVencimiento || "")
      setMaquinaId(o.maquinaId || "")
      setProyectoId(o.proyectoId || "")
      setNomenclaturaId(o.nomenclaturaId || "")
      setResponsableId(o.responsableId || "")
      setActividades(
        (o.actividades || []).map((a) => ({
          id: a.id,
          descripcion: a.descripcion || "",
          horaInicio: (a.horaInicio || "").slice(0, 5),
          horaFin: (a.horaFin || "").slice(0, 5),
          tecnicos: (a.tecnicos || []).map((t) => t.id),
        }))
      )
      setItems(
        (o.items || []).map((it) => ({
          id: it.id,
          articuloId: it.articuloId,
          producto: it.articulo?.nombre || "",
          cantidad: Number(it.cantidad) || 1,
          unidad: it.unidad || it.articulo?.unidad || "",
          costoUnitario:
            it.costoUnitario !== null && it.costoUnitario !== undefined
              ? Number(it.costoUnitario)
              : null,
        }))
      )
      setNecesitaProveedorExterno(Boolean(o.proveedorId))
      setProveedorId(o.proveedorId || "")
      setDescripcionProveedor(o.descripcionProveedor || "")
    }
  }, [open, ordenId, ordenQuery.data])

  const agregarActividad = () => {
    if (!actividadDraft.descripcion.trim() || !actividadDraft.horaInicio || !actividadDraft.horaFin) {
      toast.error("Completa descripción, hora inicio y hora fin")
      return
    }
    setActividades((prev) => [...prev, { ...actividadDraft, id: newId() }])
    setActividadDraft({ id: "", descripcion: "", tecnicos: [], horaInicio: "", horaFin: "" })
  }

  const eliminarActividad = (id: string) => {
    setActividades((prev) => prev.filter((a) => a.id !== id))
  }

  const agregarTecnicoAActividad = () => {
    if (!tecnicoTemp || actividadDraft.tecnicos.includes(tecnicoTemp)) return
    setActividadDraft((prev) => ({ ...prev, tecnicos: [...prev.tecnicos, tecnicoTemp] }))
    setTecnicoTemp("")
  }

  const eliminarTecnicoDeDraft = (tecnicoId: string) => {
    setActividadDraft((prev) => ({
      ...prev,
      tecnicos: prev.tecnicos.filter((t) => t !== tecnicoId),
    }))
  }

  const agregarItem = () => {
    const articulo = articulos.find((a) => a.id === productoTemp)
    if (!articulo || !cantidadTemp) {
      toast.error("Selecciona artículo y cantidad")
      return
    }
    if (items.some((i) => i.articuloId === articulo.id)) {
      toast.error("Ese artículo ya está agregado")
      return
    }
    const cantidad = parseInt(cantidadTemp, 10)
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      toast.error("Cantidad inválida")
      return
    }
    setItems((prev) => [
      ...prev,
      {
        id: newId(),
        articuloId: articulo.id,
        producto: articulo.nombre,
        cantidad,
        unidad: articulo.unidad || "",
        costoUnitario:
          articulo.precioUnitario !== null && articulo.precioUnitario !== undefined
            ? Number(articulo.precioUnitario)
            : null,
      },
    ])
    setProductoTemp("")
    setCantidadTemp("")
  }

  const eliminarItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const buildPayload = () => ({
    titulo: titulo.trim(),
    descripcion: descripcion.trim() || null,
    prioridad,
    estado,
    fechaVencimiento: fechaVencimiento || null,
    maquinaId: maquinaId || null,
    proyectoId: proyectoId || null,
    nomenclaturaId: nomenclaturaId || null,
    responsableId: responsableId || null,
    proveedorId: necesitaProveedorExterno ? proveedorId || null : null,
    descripcionProveedor: necesitaProveedorExterno ? descripcionProveedor.trim() || null : null,
    actividades: actividades.map((a) => ({
      descripcion: a.descripcion,
      horaInicio: a.horaInicio,
      horaFin: a.horaFin,
      tecnicos: a.tecnicos,
    })),
    items: items.map((it) => ({
      articuloId: it.articuloId,
      cantidad: it.cantidad,
      unidad: it.unidad || null,
      costoUnitario: it.costoUnitario,
    })),
  })

  const saveMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildPayload>) =>
      isEdit
        ? apiRequest(`/ordenes-trabajo/${ordenId}`, { method: "PATCH", body: payload })
        : apiRequest(`/ordenes-trabajo`, { method: "POST", body: payload }),
    onSuccess: () => {
      toast.success(isEdit ? "Orden actualizada" : "Orden creada")
      queryClient.invalidateQueries({ queryKey: ["ordenes-trabajo"] })
      if (ordenId) queryClient.invalidateQueries({ queryKey: ["orden-trabajo", ordenId] })
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message || "Error al guardar la orden"),
  })

  const handleSubmit = () => {
    if (!titulo.trim()) {
      toast.error("El título es obligatorio")
      return
    }
    if (necesitaProveedorExterno && !proveedorId) {
      toast.error("Selecciona el proveedor externo")
      return
    }
    saveMutation.mutate(buildPayload())
  }

  const tituloModal = isEdit ? `Editar Orden ${folio || ""}` : "Nueva Orden de Trabajo"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">FOLIO</Badge>
            <span>{tituloModal}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Orden</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="folio">Folio OT</Label>
                <Input
                  id="folio"
                  value={folio}
                  readOnly
                  placeholder="Se generará al guardar (OT-AAAA-####)"
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo (Nomenclatura)</Label>
                <Select value={nomenclaturaId} onValueChange={setNomenclaturaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nomenclatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {nomenclaturas.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.codigo} - {n.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. Reparación motor principal"
                />
              </div>
              <div className="space-y-2">
                <Label>Responsable</Label>
                <Select value={responsableId} onValueChange={setResponsableId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    {trabajadores.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Máquina</Label>
                <Select value={maquinaId} onValueChange={setMaquinaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar máquina" />
                  </SelectTrigger>
                  <SelectContent>
                    {maquinas.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombre}
                        {m.numeroSerie ? ` - ${m.numeroSerie}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Proyecto</Label>
                <Select value={proyectoId} onValueChange={setProyectoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {proyectos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={prioridad} onValueChange={(v) => setPrioridad(v as typeof prioridad)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={estado} onValueChange={(v) => setEstado(v as typeof estado)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.filter((s) => isEdit || s.value !== "cerrada").map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha Vencimiento</Label>
                <Input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                />
              </div>

              {maquinaSeleccionada && (
                <>
                  <div className="space-y-2">
                    <Label>Serie</Label>
                    <Input value={maquinaSeleccionada.numeroSerie || ""} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación</Label>
                    <Input value={maquinaSeleccionada.ubicacion || ""} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Horómetro</Label>
                    <Input
                      value={String(maquinaSeleccionada.horometroActual ?? "")}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descripción del problema</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción detallada del problema o falla..."
                className="min-h-20"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actividades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                <div className="space-y-2">
                  <Label>Descripción de la Actividad</Label>
                  <Textarea
                    value={actividadDraft.descripcion}
                    onChange={(e) =>
                      setActividadDraft({ ...actividadDraft, descripcion: e.target.value })
                    }
                    placeholder="Descripción de la actividad a realizar..."
                    className="min-h-16"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora Inicio</Label>
                    <Input
                      type="time"
                      value={actividadDraft.horaInicio}
                      onChange={(e) =>
                        setActividadDraft({ ...actividadDraft, horaInicio: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Fin</Label>
                    <Input
                      type="time"
                      value={actividadDraft.horaFin}
                      onChange={(e) =>
                        setActividadDraft({ ...actividadDraft, horaFin: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Técnicos Asignados</Label>
                  <div className="flex gap-2">
                    <Select value={tecnicoTemp} onValueChange={setTecnicoTemp}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar técnico" />
                      </SelectTrigger>
                      <SelectContent>
                        {trabajadores.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={agregarTecnicoAActividad} size="sm" type="button">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {actividadDraft.tecnicos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {actividadDraft.tecnicos.map((tid) => {
                        const t = trabajadores.find((x) => x.id === tid)
                        return (
                          <Badge key={tid} variant="secondary" className="flex items-center gap-1">
                            {t?.nombre || tid}
                            <X
                              className="w-3 h-3 cursor-pointer"
                              onClick={() => eliminarTecnicoDeDraft(tid)}
                            />
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                <Button onClick={agregarActividad} className="w-full" type="button">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Actividad
                </Button>
              </div>

              {actividades.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Técnicos</TableHead>
                      <TableHead>Hora Inicio</TableHead>
                      <TableHead>Hora Fin</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actividades.map((act) => (
                      <TableRow key={act.id}>
                        <TableCell className="max-w-xs">
                          <p className="text-sm">{act.descripcion}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {act.tecnicos.map((tid) => {
                              const t = trabajadores.find((x) => x.id === tid)
                              return (
                                <Badge key={tid} variant="outline" className="text-xs">
                                  {t?.nombre || tid}
                                </Badge>
                              )
                            })}
                          </div>
                        </TableCell>
                        <TableCell>{act.horaInicio}</TableCell>
                        <TableCell>{act.horaFin}</TableCell>
                        <TableCell>
                          <ConfirmDeleteButton
                            variant="destructive"
                            size="sm"
                            title="¿Eliminar actividad?"
                            description="Se quitará de la orden."
                            onConfirm={() => eliminarActividad(act.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </ConfirmDeleteButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" /> Proveedor Externo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="necesita-proveedor"
                  checked={necesitaProveedorExterno}
                  onCheckedChange={(checked) => {
                    setNecesitaProveedorExterno(Boolean(checked))
                    if (!checked) {
                      setProveedorId("")
                      setDescripcionProveedor("")
                    }
                  }}
                />
                <Label htmlFor="necesita-proveedor" className="text-sm font-medium">
                  Necesita proveedor externo
                </Label>
              </div>

              {necesitaProveedorExterno && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label>Proveedor</Label>
                    <Select value={proveedorId} onValueChange={setProveedorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {proveedores.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción del trabajo</Label>
                    <Textarea
                      value={descripcionProveedor}
                      onChange={(e) => setDescripcionProveedor(e.target.value)}
                      placeholder="Descripción del trabajo que realizará el proveedor externo..."
                      className="min-h-20"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" /> Inventario consumido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label>Artículo</Label>
                  <Select value={productoTemp} onValueChange={setProductoTemp}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar artículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {articulos.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={cantidadTemp}
                    onChange={(e) => setCantidadTemp(e.target.value)}
                    placeholder="0"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidad</Label>
                  <Input
                    value={
                      productoTemp
                        ? articulos.find((a) => a.id === productoTemp)?.unidad || ""
                        : ""
                    }
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={agregarItem} className="w-full" type="button">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              {items.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artículo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Costo Unit.</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>{it.producto}</TableCell>
                        <TableCell>{it.cantidad}</TableCell>
                        <TableCell>{it.unidad}</TableCell>
                        <TableCell>
                          {it.costoUnitario !== null ? it.costoUnitario : "—"}
                        </TableCell>
                        <TableCell>
                          <ConfirmDeleteButton
                            variant="destructive"
                            size="sm"
                            title="¿Eliminar artículo?"
                            description="Se quitará del consumo de la orden."
                            onConfirm={() => eliminarItem(it.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </ConfirmDeleteButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-primary to-accent text-white"
              disabled={saveMutation.isPending}
              type="button"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Guardando..." : "Guardar Orden"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NuevaOrdenModal
