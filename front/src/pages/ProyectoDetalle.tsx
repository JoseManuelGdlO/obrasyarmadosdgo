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
import { apiRequest } from "@/lib/api"

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

type EstimacionData = {
  id: string
  numero: number
  fechaEstimacion: string
  montoEstimacion: number
  fechaPago: string
  montoPagado: number
  factura: string
  retencionAmortizacion: number
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
    queryFn: () =>
      apiRequest<{ estimaciones: Array<Record<string, unknown>> }>(`/proyectos/${id}/estimaciones`),
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

  const estimaciones: EstimacionData[] = (estimacionesResponse?.estimaciones || []).map(
    (estimacion) => ({
      id: String(estimacion.id || ""),
      numero: Number(estimacion.numero || 0),
      fechaEstimacion: String(estimacion.fechaEstimacion || ""),
      montoEstimacion: Number(estimacion.montoEstimacion || 0),
      fechaPago: String(estimacion.fechaPago || ""),
      montoPagado: Number(estimacion.montoPagado || 0),
      factura: String(estimacion.factura || ""),
      retencionAmortizacion: Number(estimacion.retencionAmortizacion || 0),
    })
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

  const createEstim = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest(`/proyectos/${id}/estimaciones`, { method: "POST", body: payload }),
    onSuccess: () => {
      setEstimForm(emptyEstimacion)
      setEditingEstimId(null)
      invalidateEstim()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateEstim = useMutation({
    mutationFn: ({ estimId, payload }: { estimId: string; payload: Record<string, unknown> }) =>
      apiRequest(`/proyectos/${id}/estimaciones/${estimId}`, { method: "PATCH", body: payload }),
    onSuccess: () => {
      setEstimForm(emptyEstimacion)
      setEditingEstimId(null)
      invalidateEstim()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteEstim = useMutation({
    mutationFn: (estimId: string) =>
      apiRequest(`/proyectos/${id}/estimaciones/${estimId}`, { method: "DELETE" }),
    onSuccess: invalidateEstim,
    onError: (error: Error) => toast.error(error.message),
  })

  const submitEstim = () => {
    const payload = {
      fechaEstimacion: estimForm.fechaEstimacion || null,
      montoEstimacion: Number(estimForm.montoEstimacion || 0),
      fechaPago: estimForm.fechaPago || null,
      montoPagado: Number(estimForm.montoPagado || 0),
      factura: estimForm.factura.trim() || null,
      retencionAmortizacion: Number(estimForm.retencionAmortizacion || 0),
    }
    if (editingEstimId) {
      updateEstim.mutate({ estimId: editingEstimId, payload })
      return
    }
    createEstim.mutate(payload)
  }

  const startEditEstim = (estimacion: EstimacionData) => {
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
  }

  const isSavingEstim = createEstim.isPending || updateEstim.isPending

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
    </div>
  )
}

export default ProyectoDetalle
