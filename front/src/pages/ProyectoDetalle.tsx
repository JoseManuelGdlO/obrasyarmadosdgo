import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, Plus, Pencil, Trash2, X, DollarSign, FileText, ListChecks, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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

const MONTOS_MANUALES_KEYS = [
  "contratoPrincipalSinIva",
  "acumuladoEstimacionAnterior",
  "estaEstimacion",
  "estimadoALaFecha",
  "saldoPorEstimar",
  "pagoDeduccion",
  "pagoOtrasDeducciones",
  "pagoEstaEstimacion",
  "pagoAmortizacionAnticipo",
  "pagoSubTotal1",
  "pagoRetencionFondoGarantia",
  "pagoSubTotal2",
  "pagoIva16",
  "pagoTotalAPagar",
  "anticipoTotalSinIva",
  "anticipoAcumuladoAnterior",
  "anticipoEstaEstimacion",
  "anticipoAcumuladoEsta",
  "anticipoSaldoPorAmortizar",
  "fondoTotalRetencionSinIva",
  "fondoAcumuladoAnterior",
  "fondoEstaEstimacion",
  "fondoAcumuladoEsta",
  "fondoSaldoPorRetener",
] as const

type MontoManualKey = (typeof MONTOS_MANUALES_KEYS)[number]

type MontosManualesNumeros = Record<MontoManualKey, number>
type MontosManualesForm = Record<MontoManualKey, string>

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
} & MontosManualesNumeros

type EstimacionForm = {
  fechaEstimacion: string
  montoEstimacion: string
  fechaPago: string
  montoPagado: string
  factura: string
  retencionAmortizacion: string
} & MontosManualesForm

const emptyMontosForm = (): MontosManualesForm =>
  Object.fromEntries(MONTOS_MANUALES_KEYS.map((key) => [key, "0"])) as MontosManualesForm

const montosFromRecord = (estimacion: Record<string, unknown>): MontosManualesNumeros =>
  Object.fromEntries(
    MONTOS_MANUALES_KEYS.map((key) => [key, Number(estimacion[key] || 0)])
  ) as MontosManualesNumeros

const montosFormFromRecord = (estimacion: Record<string, unknown>): MontosManualesForm =>
  Object.fromEntries(
    MONTOS_MANUALES_KEYS.map((key) => [key, String(Number(estimacion[key] || 0))])
  ) as MontosManualesForm

const montosFormFromData = (estimacion: EstimacionData): MontosManualesForm =>
  Object.fromEntries(
    MONTOS_MANUALES_KEYS.map((key) => [key, String(estimacion[key])])
  ) as MontosManualesForm

type MontoFieldDef = { key: MontoManualKey; label: string }

const MODULOS_MONTOS: Array<{ title: string; fields: MontoFieldDef[] }> = [
  {
    title: "Estado de Cuenta del Contrato (Sin IVA)",
    fields: [
      { key: "contratoPrincipalSinIva", label: "Contrato Principal sin IVA" },
      { key: "acumuladoEstimacionAnterior", label: "Acumulado Estimación Anterior" },
      { key: "estaEstimacion", label: "Esta Estimación" },
      { key: "estimadoALaFecha", label: "Estimado a la Fecha" },
      { key: "saldoPorEstimar", label: "Saldo por Estimar" },
    ],
  },
  {
    title: "Generación del pago",
    fields: [
      { key: "pagoDeduccion", label: "Deduccion" },
      { key: "pagoOtrasDeducciones", label: "Otras deducciones" },
      { key: "pagoEstaEstimacion", label: "Esta Estimacion" },
      { key: "pagoAmortizacionAnticipo", label: "Amortizacion del anticipo" },
      { key: "pagoSubTotal1", label: "Sub Total" },
      { key: "pagoRetencionFondoGarantia", label: "Retencion del Fondo Garantia" },
      { key: "pagoSubTotal2", label: "Sub Total" },
      { key: "pagoIva16", label: "I. V. A. 16%" },
      { key: "pagoTotalAPagar", label: "Total a pagar" },
    ],
  },
  {
    title:
      "Estado de Cuenta del Anticipo (Sin IVA) — NOTA: SE AMORTIZA EL 5% MAS QYE EK AUTORIZADO",
    fields: [
      { key: "anticipoTotalSinIva", label: "Total del Anticipo N.-1 sin IVA" },
      { key: "anticipoAcumuladoAnterior", label: "Acumulado a Estimacion anterior" },
      { key: "anticipoEstaEstimacion", label: "Esta Estimacion" },
      { key: "anticipoAcumuladoEsta", label: "Acumulado a esta Estimacion" },
      { key: "anticipoSaldoPorAmortizar", label: "Saldo Anticipo por Amortizar" },
    ],
  },
  {
    title: "Estado de Cuenta Fondo de Garantia 3% (Sin IVA)",
    fields: [
      { key: "fondoTotalRetencionSinIva", label: "Total de Retencion sin IVA" },
      { key: "fondoAcumuladoAnterior", label: "Acumulado a Estimacion anterior" },
      { key: "fondoEstaEstimacion", label: "Esta Estimacion" },
      { key: "fondoAcumuladoEsta", label: "Acumulado a esta Estimacion" },
      { key: "fondoSaldoPorRetener", label: "Saldo Anticipo por Retener" },
    ],
  },
]

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
  ...emptyMontosForm(),
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"])

const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Las imágenes deben ser JPG o PNG."
  if (file.size > MAX_IMAGE_SIZE) return "Cada imagen debe pesar 2MB o menos."
  return null
}

const getUploadDisplayName = (pathOrName: string) => {
  const segment = pathOrName.split("/").pop() || pathOrName
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
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
  ...montosFromRecord(estimacion),
})

const toEstimacionForm = (estimacion: Record<string, unknown>): EstimacionForm => ({
  fechaEstimacion: String(estimacion.fechaEstimacion || ""),
  montoEstimacion: String(Number(estimacion.montoEstimacion || 0)),
  fechaPago: String(estimacion.fechaPago || ""),
  montoPagado: String(Number(estimacion.montoPagado || 0)),
  factura: String(estimacion.factura || ""),
  retencionAmortizacion: String(Number(estimacion.retencionAmortizacion || 0)),
  ...montosFormFromRecord(estimacion),
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
  const [pendingExtraFiles, setPendingExtraFiles] = useState<
    Array<{ id: string; file: File; previewUrl: string }>
  >([])
  const [quitarCaratula, setQuitarCaratula] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const caratulaPreviewRef = useRef<string | null>(null)
  const pendingExtrasRef = useRef(pendingExtraFiles)
  caratulaPreviewRef.current = caratulaPreviewLocal
  pendingExtrasRef.current = pendingExtraFiles

  // Solo revocar blobs al desmontar. Revocar en cada cambio de lista
  // invalidaba las previews del medio al agregar más archivos.
  useEffect(
    () => () => {
      if (caratulaPreviewRef.current) URL.revokeObjectURL(caratulaPreviewRef.current)
      pendingExtrasRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    },
    []
  )

  useEffect(() => {
    if (!lightboxSrc) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxSrc(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [lightboxSrc])

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
    if (caratulaPreviewRef.current) {
      URL.revokeObjectURL(caratulaPreviewRef.current)
      caratulaPreviewRef.current = null
    }
    setCaratulaFile(null)
    setCaratulaPreviewLocal(null)
    setPendingExtraFiles((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      return []
    })
    setQuitarCaratula(false)
  }

  const replaceCaratulaPreview = (file: File) => {
    const nextUrl = URL.createObjectURL(file)
    setCaratulaPreviewLocal((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return nextUrl
    })
    setCaratulaFile(file)
    setQuitarCaratula(false)
  }

  const toPendingExtras = (files: File[]) =>
    files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))

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
    for (const key of MONTOS_MANUALES_KEYS) {
      body.append(key, String(Number(estimForm[key] || 0)))
    }
    if (caratulaFile) body.append("caratula", caratulaFile)
    if (quitarCaratula) body.append("quitarCaratula", "true")
    return body
  }

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

  const createEstim = useMutation({
    mutationFn: async ({ body, extras }: { body: FormData; extras: File[] }) => {
      const response = await apiRequest<{
        estimacion: Record<string, unknown>
        message?: string
      }>(`/proyectos/${id}/estimaciones`, { method: "POST", body })
      return { response, extras }
    },
    onSuccess: ({ response, extras }) => {
      setEditingEstimId(String(response.estimacion.id))
      setEstimForm(toEstimacionForm(response.estimacion))
      clearPhotoLocalState()
      upsertEstimacionCache(response.estimacion)
      invalidateEstim()
      toast.success("Estimación agregada correctamente.")
      if (extras.length) {
        addFotos.mutate({ estimId: String(response.estimacion.id), files: extras })
      }
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateEstim = useMutation({
    mutationFn: async ({
      estimId,
      body,
      extras,
    }: {
      estimId: string
      body: FormData
      extras: File[]
    }) => {
      const response = await apiRequest<{
        estimacion: Record<string, unknown>
        message?: string
      }>(`/proyectos/${id}/estimaciones/${estimId}`, { method: "PATCH", body })
      return { response, extras }
    },
    onSuccess: ({ response, extras }) => {
      setEditingEstimId(String(response.estimacion.id))
      setEstimForm(toEstimacionForm(response.estimacion))
      clearPhotoLocalState()
      upsertEstimacionCache(response.estimacion)
      invalidateEstim()
      toast.success("Estimación actualizada correctamente.")
      if (extras.length) {
        addFotos.mutate({ estimId: String(response.estimacion.id), files: extras })
      }
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

  const submitEstim = () => {
    const body = buildEstimFormData()
    const extras = pendingExtraFiles.map((item) => item.file)
    if (editingEstimId) {
      updateEstim.mutate({ estimId: editingEstimId, body, extras })
      return
    }
    createEstim.mutate({ body, extras })
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
      ...montosFormFromData(estimacion),
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
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                asChild
                disabled={addFotos.isPending}
              >
                <label className="cursor-pointer">
                  {addFotos.isPending ? "Agregando..." : "Agregar carátula"}
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
                      if (!files.length) return
                      const validationError = files
                        .map(validateImageFile)
                        .find((error): error is string => Boolean(error))
                      if (validationError) {
                        toast.error(validationError)
                        return
                      }

                      // Estimación ya guardada con carátula: subir todas como extras ya.
                      if (editingEstimId && caratulaSrc) {
                        addFotos.mutate({ estimId: editingEstimId, files })
                        return
                      }

                      // Sin carátula aún: primera = carátula local, resto = pendientes al guardar.
                      if (!caratulaSrc) {
                        const [first, ...rest] = files
                        replaceCaratulaPreview(first)
                        if (rest.length) {
                          setPendingExtraFiles((prev) => [...prev, ...toPendingExtras(rest)])
                        }
                        return
                      }

                      // Ya hay carátula local pendiente: acumular más para el guardado.
                      setPendingExtraFiles((prev) => [...prev, ...toPendingExtras(files)])
                    }}
                  />
                </label>
              </Button>
            </div>
            <ul className="space-y-1">
              {caratulaSrc && (
                <li className="flex items-center gap-2">
                  <button
                    type="button"
                    className="max-w-md truncate text-left text-sm text-primary underline-offset-4 hover:underline"
                    onClick={() => setLightboxSrc(caratulaSrc)}
                    title={
                      caratulaFile?.name ||
                      (savedCaratula ? getUploadDisplayName(savedCaratula) : "Carátula")
                    }
                  >
                    {caratulaFile?.name ||
                      (savedCaratula ? getUploadDisplayName(savedCaratula) : "Carátula")}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => {
                      if (caratulaPreviewLocal) {
                        URL.revokeObjectURL(caratulaPreviewLocal)
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
                </li>
              )}
              {editingEstimacion?.fotos.map((foto) => {
                const src = toAbsoluteAssetUrl(foto.ruta)
                if (!src) return null
                const name = getUploadDisplayName(foto.ruta)
                return (
                  <li key={foto.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      className="max-w-md truncate text-left text-sm text-primary underline-offset-4 hover:underline"
                      onClick={() => setLightboxSrc(src)}
                      title={name}
                    >
                      {name}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() =>
                        deleteFoto.mutate({
                          estimId: editingEstimId!,
                          fotoId: foto.id,
                        })
                      }
                      disabled={deleteFoto.isPending}
                      aria-label="Eliminar foto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                )
              })}
              {pendingExtraFiles.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    className="max-w-md truncate text-left text-sm text-primary underline-offset-4 hover:underline"
                    onClick={() => setLightboxSrc(item.previewUrl)}
                    title={item.file.name}
                  >
                    {item.file.name}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() =>
                      setPendingExtraFiles((prev) => {
                        const next = prev.filter((photo) => photo.id !== item.id)
                        URL.revokeObjectURL(item.previewUrl)
                        return next
                      })
                    }
                    aria-label="Quitar foto pendiente"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          {MODULOS_MONTOS.map((modulo) => (
            <Collapsible key={modulo.title} className="rounded-md border border-border">
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
                <span>{modulo.title}</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t border-border px-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modulo.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label>{field.label}</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="pl-7"
                          value={estimForm[field.key]}
                          onChange={(event) =>
                            setEstimForm((prev) => ({
                              ...prev,
                              [field.key]: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
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
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa"
          onClick={() => setLightboxSrc(null)}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-10 w-10 text-white hover:bg-white/10 hover:text-white"
            onClick={() => setLightboxSrc(null)}
            aria-label="Cerrar vista previa"
          >
            <X className="h-5 w-5" />
          </Button>
          <img
            src={lightboxSrc}
            alt="Vista previa"
            className="max-h-[85vh] max-w-[min(90vw,56rem)] rounded-md object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            onError={() => {
              toast.error("No se pudo cargar la imagen de vista previa.")
              setLightboxSrc(null)
            }}
          />
        </div>
      )}
    </div>
  )
}

export default ProyectoDetalle
