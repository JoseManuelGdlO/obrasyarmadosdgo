import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import NuevaOrdenModal from "@/components/modals/NuevaOrdenModal"
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton"
import { apiRequest } from "@/lib/api"
import { toast } from "sonner"
import {
  Plus,
  Search,
  ClipboardList,
  Calendar,
  User,
  Truck,
  DollarSign,
  MapPin,
  Clock,
  History,
  CheckCircle2,
  Trash2,
} from "lucide-react"

type ClienteLite = { id: string; nombre: string }

type ProyectoLite = {
  id: string
  nombre: string
  cliente?: ClienteLite | null
}

type MaquinaLite = {
  id: string
  nombre: string
  modelo?: string | null
  placas?: string | null
  ubicacion?: string | null
}

type NomenclaturaLite = { id: string; codigo: string; nombre: string }
type ProveedorLite = { id: string; nombre: string }
type TrabajadorLite = { id: string; nombre: string }
type ArticuloLite = { id: string; nombre: string; unidad?: string | null }

type ActividadBackend = {
  id: string
  descripcion: string | null
  horaInicio: string | null
  horaFin: string | null
  tecnicos?: TrabajadorLite[]
}

type ItemBackend = {
  id: string
  articuloId: string
  cantidad: number
  unidad: string | null
  costoUnitario: string | number | null
  articulo?: ArticuloLite | null
}

export type OrdenBackend = {
  id: string
  folio: string | null
  titulo: string
  descripcion: string | null
  descripcionProveedor: string | null
  ubicacionSnapshot: string | null
  horometroSnapshot: string | null
  horasInvertidas: string | number | null
  costoTotal: string | number | null
  prioridad: "baja" | "media" | "alta" | "critica"
  estado: "abierta" | "en_progreso" | "pausada" | "cerrada"
  fechaProgramada: string | null
  fechaVencimiento: string | null
  fechaCierre: string | null
  createdAt: string
  proyectoId: string | null
  maquinaId: string | null
  proveedorId: string | null
  nomenclaturaId: string | null
  responsableId: string | null
  proyecto?: ProyectoLite | null
  maquina?: MaquinaLite | null
  nomenclatura?: NomenclaturaLite | null
  proveedor?: ProveedorLite | null
  responsable?: TrabajadorLite | null
  actividades?: ActividadBackend[]
  items?: ItemBackend[]
}

const PRIORIDAD_LABEL: Record<OrdenBackend["prioridad"], string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
}

const ESTADO_LABEL: Record<OrdenBackend["estado"], string> = {
  abierta: "Abierta",
  en_progreso: "En Progreso",
  pausada: "Pausada",
  cerrada: "Cerrada",
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount)

const getStatusColor = (estado: OrdenBackend["estado"]) => {
  switch (estado) {
    case "cerrada":
      return "bg-success text-success-foreground"
    case "en_progreso":
      return "bg-warning text-warning-foreground"
    case "pausada":
      return "bg-muted text-muted-foreground"
    case "abierta":
    default:
      return "bg-primary/10 text-primary"
  }
}

const getPriorityColor = (prioridad: OrdenBackend["prioridad"]) => {
  switch (prioridad) {
    case "critica":
      return "bg-destructive text-destructive-foreground"
    case "alta":
      return "bg-warning text-warning-foreground"
    case "media":
      return "bg-primary/10 text-primary"
    case "baja":
    default:
      return "bg-success/15 text-success"
  }
}

const calculateDaysOpen = (fechaCreacion: string) => {
  const creation = new Date(fechaCreacion)
  if (Number.isNaN(creation.getTime())) return 0
  const today = new Date()
  const diff = Math.abs(today.getTime() - creation.getTime())
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const OrdenesTrabajo = () => {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOrdenId, setEditingOrdenId] = useState<string | null>(null)
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const queryKey = useMemo(
    () => ["ordenes-trabajo", { historico: mostrarHistorico, q: searchTerm.trim() }],
    [mostrarHistorico, searchTerm]
  )

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set("estado", mostrarHistorico ? "cerrada" : "abiertas")
      if (searchTerm.trim()) params.set("q", searchTerm.trim())
      const res = await apiRequest<{ ordenes: OrdenBackend[] }>(
        `/ordenes-trabajo?${params.toString()}`
      )
      return res.ordenes
    },
  })

  const cerrarMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/ordenes-trabajo/${id}/cerrar`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success("Orden cerrada y stock actualizado")
      queryClient.invalidateQueries({ queryKey: ["ordenes-trabajo"] })
      queryClient.invalidateQueries({ queryKey: ["articulos"] })
    },
    onError: (err: Error) => toast.error(err.message || "Error al cerrar la orden"),
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/ordenes-trabajo/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Orden eliminada")
      queryClient.invalidateQueries({ queryKey: ["ordenes-trabajo"] })
    },
    onError: (err: Error) => toast.error(err.message || "Error al eliminar la orden"),
  })

  const ordenes = data ?? []

  const handleNueva = () => {
    setEditingOrdenId(null)
    setModalOpen(true)
  }

  const handleEditar = (id: string) => {
    setEditingOrdenId(id)
    setModalOpen(true)
  }

  const handleCloseModal = (open: boolean) => {
    setModalOpen(open)
    if (!open) setEditingOrdenId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Órdenes de Trabajo</h1>
          <p className="text-muted-foreground">Gestiona todas las órdenes de mantenimiento</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={mostrarHistorico ? "default" : "outline"}
            onClick={() => setMostrarHistorico(!mostrarHistorico)}
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            {mostrarHistorico ? "Ver Activas" : "Histórico"}
          </Button>
          <Button
            onClick={handleNueva}
            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Orden
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por folio, título o máquina..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>
            {mostrarHistorico
              ? `Histórico de Órdenes Cerradas (${ordenes.length})`
              : `Órdenes de Trabajo Activas (${ordenes.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Máquina</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Días Abierta</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                    Cargando órdenes...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8 text-destructive">
                    Error al cargar las órdenes
                  </TableCell>
                </TableRow>
              ) : ordenes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                    {mostrarHistorico
                      ? "No hay órdenes cerradas"
                      : "No hay órdenes de trabajo activas"}
                  </TableCell>
                </TableRow>
              ) : (
                ordenes.map((orden) => (
                  <TableRow key={orden.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{orden.folio || orden.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-primary">{orden.titulo}</p>
                        {orden.descripcion && (
                          <p className="text-sm text-muted-foreground truncate">
                            {orden.descripcion}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          {orden.maquina?.nombre || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          {orden.ubicacionSnapshot || orden.maquina?.ubicacion || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-xs font-mono bg-muted px-1 rounded">
                            {orden.nomenclatura?.codigo || "—"}
                          </span>
                          {orden.nomenclatura?.nombre && (
                            <span className="text-xs text-muted-foreground">
                              {orden.nomenclatura.nombre}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <span className="text-sm">{orden.responsable?.nombre || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm">{orden.fechaVencimiento || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium">
                          {calculateDaysOpen(orden.createdAt)} días
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">
                          {Number(orden.horasInvertidas || 0)} hrs
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(Number(orden.costoTotal || 0))}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(orden.estado)}>
                        {ESTADO_LABEL[orden.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(orden.prioridad)}>
                        {PRIORIDAD_LABEL[orden.prioridad]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditar(orden.id)}
                        >
                          {orden.estado === "cerrada" ? "Ver" : "Editar"}
                        </Button>
                        {orden.estado !== "cerrada" && (
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1"
                            disabled={cerrarMutation.isPending}
                            onClick={() => cerrarMutation.mutate(orden.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Cerrar
                          </Button>
                        )}
                        <ConfirmDeleteButton
                          variant="destructive"
                          size="sm"
                          title="¿Eliminar orden?"
                          description="Se eliminará la orden y sus actividades/items asociados."
                          onConfirm={() => eliminarMutation.mutate(orden.id)}
                          disabled={eliminarMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </ConfirmDeleteButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NuevaOrdenModal
        open={modalOpen}
        onOpenChange={handleCloseModal}
        ordenId={editingOrdenId}
      />
    </div>
  )
}

export default OrdenesTrabajo
