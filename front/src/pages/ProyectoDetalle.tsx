import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, Plus, Pencil, Trash2, X, DollarSign, FileText, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { apiRequest, toAbsoluteAssetUrl } from "@/lib/api"

type Estado = "planeado" | "en_progreso" | "pausado" | "completado"

type ProyectoForm = {
  clienteId: string
  nombre: string
  descripcion: string
  ubicacion: string
  responsable: string
  estado: Estado
  fechaInicio: string
  fechaFin: string
  fechaModificatoria: string
  cantidadContrato: string
  modificacionContrato: string
  presupuesto: string
  progreso: string
  precioEstimado: string
}

type EstimacionFoto = {
  id: string
  ruta: string
}

type EstimacionData = {
  id: string
  numero: number
  fechaEstimacion: string
  montoEstimacion: number
  fechaPago: string
  montoPagado: number
  factura: string
  retencionAmortizacion: number
  caratula: string | null
  fotos: EstimacionFoto[]
}

type EstimacionForm = {
  fechaEstimacion: string
  montoEstimacion: string
  fechaPago: string
  montoPagado: string
  factura: string
  retencionAmortizacion: string
}

const defaultForm: ProyectoForm = {
  clienteId: "",
  nombre: "",
  descripcion: "",
  ubicacion: "",
  responsable: "",
  estado: "planeado",
  fechaInicio: "",
  fechaFin: "",
  fechaModificatoria: "",
  cantidadContrato: "0",
  modificacionContrato: "0",
  presupuesto: "0",
  progreso: "0",
  precioEstimado: "0",
}

const emptyEstimacion: EstimacionForm = {
  fechaEstimacion: "",
  montoEstimacion: "0",
  fechaPago: "",
  montoPagado: "0",
  factura: "",
  retencionAmortizacion: "0",
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"])

const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Las imágenes deben ser JPG o PNG."
  if (file.size > MAX_IMAGE_SIZE) return "Cada imagen debe pesar 2MB o menos."
  return null
}

const toEstimacionData = (estimacion: Record<string, unknown>): EstimacionData => ({
  id: String(estimacion.id || ""),
  numero: Number(estimacion.numero || 0),
  fechaEstimacion: String(estimacion.fechaEstimacion || ""),
  montoEstimacion: Number(estimacion.montoEstimacion || 0),
  fechaPago: String(estimacion.fechaPago || ""),
  montoPagado: Number(estimacion.montoPagado || 0),
  factura: String(estimacion.factura || ""),
  retencionAmortizacion: Number(estimacion.retencionAmortizacion || 0),
  caratula: estimacion.caratula ? String(estimacion.caratula) : null,
  fotos: Array.isArray(estimacion.fotos)
    ? estimacion.fotos.map((foto) => {
        const value = foto as Record<string, unknown>
        return { id: String(value.id || ""), ruta: String(value.ruta || "") }
      })
    : [],
})

const toEstimacionForm = (estimacion: Record<string, unknown>): EstimacionForm => ({
  fechaEstimacion: String(estimacion.fechaEstimacion || ""),
  montoEstimacion: String(Number(estimacion.montoEstimacion || 0)),
  fechaPago: String(estimacion.fechaPago || ""),
  montoPagado: String(Number(estimacion.montoPagado || 0)),
  factura: String(estimacion.factura || ""),
  retencionAmortizacion: String(Number(estimacion.retencionAmortizacion || 0)),
})

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

const ProyectoDetalle = () => {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<ProyectoForm>(defaultForm)
  const [estimForm, setEstimForm] = useState<EstimacionForm>(emptyEstimacion)
  const [editingEstimId, setEditingEstimId] = useState<string | null>(null)
  const [caratulaFile, setCaratulaFile] = useState<File | null>(null)
  const [caratulaPreviewLocal, setCaratulaPreviewLocal] = useState<string | null>(null)
  const [quitarCaratula, setQuitarCaratula] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  useEffect(
    () => () => {
      if (caratulaPreviewLocal) URL.revokeObjectURL(caratulaPreviewLocal)
    },
    [caratulaPreviewLocal]
  )

  const { data: proyectoResponse } = useQuery({
    queryKey: ["proyecto", id],
    queryFn: () => apiRequest<{ proyecto: Record<string, unknown> }>(`/proyectos/${id}`),
    enabled: Boolean(id),
  })

  const { data: clientsResponse } = useQuery({
    queryKey: ["clientes-lite"],
    queryFn: () => apiRequest<{ clientes: Array<{ id: string; nombre: string }> }>("/clientes"),
  })

  const { data: estimacionesResponse } = useQuery({
    queryKey: ["proyecto-estimaciones", id],
    queryFn: async () => {
      const response = await apiRequest<{ estimaciones: Array<Record<string, unknown>> }>(
        `/proyectos/${id}/estimaciones`
      )
      return { estimaciones: response.estimaciones.map(toEstimacionData) }
    },
    enabled: Boolean(id),
  })

  const clientes = clientsResponse?.clientes || []
  const proyecto = proyectoResponse?.proyecto

  useEffect(() => {
    if (!proyecto) return
    setForm({
      clienteId: String(proyecto.clienteId || ""),
      nombre: String(proyecto.nombre || ""),
      descripcion: String(proyecto.descripcion || ""),
      ubicacion: String(proyecto.ubicacion || ""),
      responsable: String(proyecto.responsable || ""),
      estado: (String(proyecto.estado || "planeado") as Estado),
      fechaInicio: String(proyecto.fechaInicio || ""),
      fechaFin: String(proyecto.fechaFin || ""),
      fechaModificatoria: String(proyecto.fechaModificatoria || ""),
      cantidadContrato: String(proyecto.cantidadContrato ?? 0),
      modificacionContrato: String(proyecto.modificacionContrato ?? 0),
      presupuesto: String(proyecto.presupuesto ?? 0),
      progreso: String(proyecto.progreso ?? 0),
      precioEstimado: String(proyecto.precioEstimado ?? 0),
    })
  }, [proyecto])

  const estimaciones = useMemo(
    () => estimacionesResponse?.estimaciones || [],
    [estimacionesResponse?.estimaciones]
  )

  const totalContrato = useMemo(
    () => Number(form.cantidadContrato || 0) + Number(form.modificacionContrato || 0),
    [form.cantidadContrato, form.modificacionContrato]
  )

  const totales = useMemo(() => {
    const estimado = estimaciones.reduce((sum, e) => sum + e.montoEstimacion, 0)
    const pagado = estimaciones.reduce((sum, e) => sum + e.montoPagado, 0)
    const retencion = estimaciones.reduce((sum, e) => sum + e.retencionAmortizacion, 0)
    return { estimado, pagado, retencion, pendiente: estimado - pagado }
  }, [estimaciones])

  const pendienteContrato = totalContrato - totales.pagado

  const saveProyecto = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest(`/proyectos/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => {
      toast.success("Proyecto actualizado correctamente.")
      queryClient.invalidateQueries({ queryKey: ["proyecto", id] })
      queryClient.invalidateQueries({ queryKey: ["proyectos"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const handleSaveProyecto = () => {
    saveProyecto.mutate({
      clienteId: form.clienteId || null,
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      ubicacion: form.ubicacion || null,
      responsable: form.responsable || null,
      estado: form.estado,
      fechaInicio: form.fechaInicio || null,
      fechaFin: form.fechaFin || null,
      fechaModificatoria: form.fechaModificatoria || null,
      cantidadContrato: Number(form.cantidadContrato || 0),
      modificacionContrato: Number(form.modificacionContrato || 0),
      presupuesto: Number(form.presupuesto || 0),
      progreso: Number(form.progreso || 0),
      precioEstimado: Math.trunc(Number(form.precioEstimado || 0)),
    })
  }

  const invalidateEstim = () =>
    queryClient.invalidateQueries({ queryKey: ["proyecto-estimaciones", id] })

  const upsertEstimacionCache = (estimacion: Record<string, unknown>) => {
    const nextEstimacion = toEstimacionData(estimacion)
    queryClient.setQueryData<{ estimaciones: EstimacionData[] }>(
      ["proyecto-estimaciones", id],
      (current) => {
        const currentEstimaciones = current?.estimaciones || []
        const exists = currentEstimaciones.some((item) => item.id === nextEstimacion.id)
        return {
          estimaciones: exists
            ? currentEstimaciones.map((item) =>
                item.id === nextEstimacion.id ? nextEstimacion : item
              )
            : [...currentEstimaciones, nextEstimacion],
        }
      }
    )
  }

  const clearPhotoLocalState = () => {
    setCaratulaFile(null)
    setCaratulaPreviewLocal(null)
    setQuitarCaratula(false)
  }

  const buildEstimFormData = () => {
    const body = new FormData()
    body.append("fechaEstimacion", estimForm.fechaEstimacion || "")
    body.append("montoEstimacion", String(Number(estimForm.montoEstimacion || 0)))
    body.append("fechaPago", estimForm.fechaPago || "")
    body.append("montoPagado", String(Number(estimForm.montoPagado || 0)))
    body.append("factura", estimForm.factura.trim())
    body.append(
      "retencionAmortizacion",
      String(Number(estimForm.retencionAmortizacion || 0))
    )
    if (caratulaFile) body.append("caratula", caratulaFile)
    if (quitarCaratula) body.append("quitarCaratula", "true")
    return body
  }

  const createEstim = useMutation({
    mutationFn: (body: FormData) =>
      apiRequest<{ estimacion: Record<string, unknown>; message?: string }>(
        `/proyectos/${id}/estimaciones`,
        { method: "POST", body }
      ),
    onSuccess: (response) => {
      setEditingEstimId(String(response.estimacion.id))
      setEstimForm(toEstimacionForm(response.estimacion))
      clearPhotoLocalState()
      upsertEstimacionCache(response.estimacion)
      invalidateEstim()
      toast.success("Estimación agregada correctamente.")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateEstim = useMutation({
    mutationFn: ({ estimId, body }: { estimId: string; body: FormData }) =>
      apiRequest<{ estimacion: Record<string, unknown>; message?: string }>(
        `/proyectos/${id}/estimaciones/${estimId}`,
        { method: "PATCH", body }
      ),
    onSuccess: (response) => {
      setEditingEstimId(String(response.estimacion.id))
      setEstimForm(toEstimacionForm(response.estimacion))
      clearPhotoLocalState()
      upsertEstimacionCache(response.estimacion)
      invalidateEstim()
      toast.success("Estimación actualizada correctamente.")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteEstim = useMutation({
    mutationFn: (estimId: string) =>
      apiRequest(`/proyectos/${id}/estimaciones/${estimId}`, { method: "DELETE" }),
    onSuccess: (_, estimId) => {
      if (editingEstimId === estimId) {
        setEditingEstimId(null)
        setEstimForm(emptyEstimacion)
        clearPhotoLocalState()
      }
      invalidateEstim()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const addFotos = useMutation({
    mutationFn: async ({ estimId, files }: { estimId: string; files: File[] }) => {
      const body = new FormData()
      files.forEach((file) => body.append("fotos", file))
      return apiRequest(`/proyectos/${id}/estimaciones/${estimId}/fotos`, {
        method: "POST",
        body,
      })
    },
    onSuccess: () => {
      toast.success("Fotos agregadas.")
      invalidateEstim()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteFoto = useMutation({
    mutationFn: ({ estimId, fotoId }: { estimId: string; fotoId: string }) =>
      apiRequest(`/proyectos/${id}/estimaciones/${estimId}/fotos/${fotoId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Foto eliminada.")
      invalidateEstim()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const submitEstim = () => {
    const body = buildEstimFormData()
    if (editingEstimId) {
      updateEstim.mutate({ estimId: editingEstimId, body })
      return
    }
    createEstim.mutate(body)
  }

  const startEditEstim = (estimacion: EstimacionData) => {
    clearPhotoLocalState()
    setEditingEstimId(estimacion.id)
    setEstimForm({
      fechaEstimacion: estimacion.fechaEstimacion,
      montoEstimacion: String(estimacion.montoEstimacion),
      fechaPago: estimacion.fechaPago,
      montoPagado: String(estimacion.montoPagado),
      factura: estimacion.factura,
      retencionAmortizacion: String(estimacion.retencionAmortizacion),
    })
  }

  const cancelEditEstim = () => {
    setEditingEstimId(null)
    setEstimForm(emptyEstimacion)
    clearPhotoLocalState()
  }

  const isSavingEstim = createEstim.isPending || updateEstim.isPending
  const editingEstimacion = editingEstimId
    ? estimaciones.find((estimacion) => estimacion.id === editingEstimId)
    : null
  const savedCaratula = editingEstimacion?.caratula || null
  const caratulaSrc =
    caratulaPreviewLocal ||
    (!quitarCaratula ? toAbsoluteAssetUrl(savedCaratula) : null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/proyectos")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {form.nombre || "Proyecto"}
            </h1>
            <p className="text-muted-foreground">Gestión del contrato y sus estimaciones</p>
          </div>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-none shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total contrato</p>
              <p className="text-2xl font-bold">{formatCurrency(totalContrato)}</p>
            </div>
            <FileText className="w-8 h-8 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Estimaciones pagadas</p>
              <p className="text-2xl font-bold">{formatCurrency(totales.pagado)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Retención / amortización</p>
              <p className="text-2xl font-bold">{formatCurrency(totales.retencion)}</p>
            </div>
            <ListChecks className="w-8 h-8 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendiente de pago</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(pendienteContrato)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Datos del proyecto / contrato */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Datos del proyecto y contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={form.clienteId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, clienteId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre del proyecto</Label>
              <Input
                value={form.nombre}
                onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input
                value={form.ubicacion}
                onChange={(event) => setForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Input
                value={form.responsable}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, responsable: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={form.estado}
                onValueChange={(value: Estado) => setForm((prev) => ({ ...prev, estado: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planeado">Pendiente</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="pausado">Suspendido</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Progreso (%)</Label>
              <Input
                type="number"
                min="0"
                step={1}
                value={form.progreso}
                onChange={(event) => setForm((prev) => ({ ...prev, progreso: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha inicio</Label>
              <Input
                type="date"
                value={form.fechaInicio}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fechaInicio: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha fin (término)</Label>
              <Input
                type="date"
                value={form.fechaFin}
                onChange={(event) => setForm((prev) => ({ ...prev, fechaFin: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha modificatoria</Label>
              <Input
                type="date"
                value={form.fechaModificatoria}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fechaModificatoria: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Cantidad contrato</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.cantidadContrato}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, cantidadContrato: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Modificación contrato</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.modificacionContrato}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, modificacionContrato: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Total contrato</Label>
              <Input value={formatCurrency(totalContrato)} readOnly disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={form.descripcion}
              onChange={(event) => setForm((prev) => ({ ...prev, descripcion: event.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProyecto} disabled={saveProyecto.isPending}>
              {saveProyecto.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estimaciones */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>{editingEstimId ? "Editar estimación" : "Agregar estimación"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Fecha estimación</Label>
              <Input
                type="date"
                value={estimForm.fechaEstimacion}
                onChange={(event) =>
                  setEstimForm((prev) => ({ ...prev, fechaEstimacion: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Monto estimación</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={estimForm.montoEstimacion}
                onChange={(event) =>
                  setEstimForm((prev) => ({ ...prev, montoEstimacion: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha pago</Label>
              <Input
                type="date"
                value={estimForm.fechaPago}
                onChange={(event) =>
                  setEstimForm((prev) => ({ ...prev, fechaPago: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Monto pagado</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={estimForm.montoPagado}
                onChange={(event) =>
                  setEstimForm((prev) => ({ ...prev, montoPagado: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Factura</Label>
              <Input
                value={estimForm.factura}
                placeholder="Nº factura"
                onChange={(event) =>
                  setEstimForm((prev) => ({ ...prev, factura: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Retención / amortización</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={estimForm.retencionAmortizacion}
                onChange={(event) =>
                  setEstimForm((prev) => ({
                    ...prev,
                    retencionAmortizacion: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Carátula</Label>
            <div className="flex flex-wrap items-start gap-3">
              <Button type="button" variant="outline" asChild>
                <label className="cursor-pointer">
                  Agregar carátula
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ""
                      if (!file) return
                      const validationError = validateImageFile(file)
                      if (validationError) {
                        toast.error(validationError)
                        return
                      }
                      setCaratulaFile(file)
                      setCaratulaPreviewLocal(URL.createObjectURL(file))
                      setQuitarCaratula(false)
                    }}
                  />
                </label>
              </Button>
              {caratulaSrc && (
                <div className="relative">
                  <button
                    type="button"
                    className="block overflow-hidden rounded-md border"
                    onClick={() => setLightboxSrc(caratulaSrc)}
                    aria-label="Ver carátula"
                  >
                    <img
                      src={caratulaSrc}
                      alt="Carátula de la estimación"
                      className="h-24 w-32 object-cover"
                    />
                  </button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-7 w-7"
                    onClick={() => {
                      if (caratulaPreviewLocal) {
                        setCaratulaFile(null)
                        setCaratulaPreviewLocal(null)
                        return
                      }
                      setQuitarCaratula(true)
                    }}
                    aria-label="Quitar carátula"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          {editingEstimId && (
            <div className="space-y-2">
              <Label>Fotos adicionales</Label>
              <div>
                <Button type="button" variant="outline" asChild disabled={addFotos.isPending}>
                  <label className="cursor-pointer">
                    {addFotos.isPending ? "Agregando..." : "Agregar fotos"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      disabled={addFotos.isPending}
                      className="hidden"
                      onChange={(event) => {
                        if (addFotos.isPending) return
                        const files = Array.from(event.target.files || [])
                        event.target.value = ""
                        if (!files.length || !editingEstimId) return
                        const validationError = files
                          .map(validateImageFile)
                          .find((error): error is string => Boolean(error))
                        if (validationError) {
                          toast.error(validationError)
                          return
                        }
                        addFotos.mutate({ estimId: editingEstimId, files })
                      }}
                    />
                  </label>
                </Button>
              </div>
              {editingEstimacion?.fotos.length ? (
                <div className="flex flex-wrap gap-3">
                  {editingEstimacion.fotos.map((foto) => {
                    const src = toAbsoluteAssetUrl(foto.ruta)
                    if (!src) return null
                    return (
                      <div key={foto.id} className="relative">
                        <button
                          type="button"
                          className="block overflow-hidden rounded-md border"
                          onClick={() => setLightboxSrc(src)}
                          aria-label="Ver foto adicional"
                        >
                          <img
                            src={src}
                            alt="Foto adicional de la estimación"
                            className="h-24 w-32 object-cover"
                          />
                        </button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -right-2 -top-2 h-7 w-7"
                          onClick={() =>
                            deleteFoto.mutate({
                              estimId: editingEstimId,
                              fotoId: foto.id,
                            })
                          }
                          disabled={deleteFoto.isPending}
                          aria-label="Eliminar foto adicional"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={submitEstim} disabled={isSavingEstim}>
              <Plus className="w-4 h-4 mr-2" />
              {editingEstimId ? "Guardar cambios" : "Agregar"}
            </Button>
            {editingEstimId && (
              <Button variant="outline" onClick={cancelEditEstim}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Fecha estimación</TableHead>
                <TableHead>Monto estimación</TableHead>
                <TableHead>Fecha pago</TableHead>
                <TableHead>Monto pagado</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Retención / amortización</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Sin estimaciones registradas.
                  </TableCell>
                </TableRow>
              ) : (
                estimaciones.map((estimacion) => (
                  <TableRow key={estimacion.id}>
                    <TableCell>{estimacion.numero}</TableCell>
                    <TableCell>{estimacion.fechaEstimacion || "-"}</TableCell>
                    <TableCell>{formatCurrency(estimacion.montoEstimacion)}</TableCell>
                    <TableCell>{estimacion.fechaPago || "-"}</TableCell>
                    <TableCell>{formatCurrency(estimacion.montoPagado)}</TableCell>
                    <TableCell>{estimacion.factura || "-"}</TableCell>
                    <TableCell>{formatCurrency(estimacion.retencionAmortizacion)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => startEditEstim(estimacion)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteEstim.mutate(estimacion.id)}
                          disabled={deleteEstim.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {estimaciones.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-semibold">
                    Totales
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(totales.estimado)}</TableCell>
                  <TableCell />
                  <TableCell className="font-semibold">{formatCurrency(totales.pagado)}</TableCell>
                  <TableCell />
                  <TableCell className="font-semibold">{formatCurrency(totales.retencion)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>

      {/* Resúmenes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>Resumen por contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Total contrato</span>
              <span className="font-medium">{formatCurrency(totalContrato)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Suma estimaciones pagadas</span>
              <span className="font-medium">{formatCurrency(totales.pagado)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Suma retención / amortización</span>
              <span className="font-medium">{formatCurrency(totales.retencion)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-semibold">Pendiente de pago</span>
              <span className="font-semibold text-primary">{formatCurrency(pendienteContrato)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>Resumen por estimaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimación</TableHead>
                  <TableHead>Estimado</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Retención</TableHead>
                  <TableHead>Pendiente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Sin estimaciones registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  estimaciones.map((estimacion) => (
                    <TableRow key={estimacion.id}>
                      <TableCell>Estimación {estimacion.numero}</TableCell>
                      <TableCell>{formatCurrency(estimacion.montoEstimacion)}</TableCell>
                      <TableCell>{formatCurrency(estimacion.montoPagado)}</TableCell>
                      <TableCell>{formatCurrency(estimacion.retencionAmortizacion)}</TableCell>
                      <TableCell>
                        {formatCurrency(estimacion.montoEstimacion - estimacion.montoPagado)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {estimaciones.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Totales</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(totales.estimado)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(totales.pagado)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(totales.retencion)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(totales.pendiente)}</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={Boolean(lightboxSrc)}
        onOpenChange={(open) => {
          if (!open) setLightboxSrc(null)
        }}
      >
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Vista previa</DialogTitle>
          {lightboxSrc && (
            <img
              src={lightboxSrc}
              alt="Vista previa"
              className="max-h-[85vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProyectoDetalle
