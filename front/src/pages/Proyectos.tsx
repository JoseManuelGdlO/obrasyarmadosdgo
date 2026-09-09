import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { StatCard } from "@/components/ui/stat-card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  Search,
  Filter,
  FolderOpen,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  ShoppingCart,
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import { filterByProyectoScope, useAuth } from "@/lib/auth-context"
import { PERMISSIONS } from "@/lib/permissions"
import ProyectoModal, { ProyectoFormData } from "@/components/modals/ProyectoModal"

type CompraPartida = {
  id: string
  indice: number
  cantidad: number
  unidad: string | null
  nombreProducto: string
  precioUnitario: number
  importeTotal: number
}

type CompraOrden = {
  id: string
  fecha: string
  proyecto: string
  proveedor: string
  total: number
  partidas?: CompraPartida[]
}

const formatMoneyMx = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0)

const Proyectos = () => {
  const navigate = useNavigate()
  const { proyectoIds, can } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [comprasOpen, setComprasOpen] = useState(false)
  const [comprasProyectoNombre, setComprasProyectoNombre] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const canViewCompras = can(PERMISSIONS.COMPRAS_VIEW)

  const { data: projectsResponse } = useQuery({
    queryKey: ["proyectos"],
    queryFn: () => apiRequest<{ proyectos: Array<Record<string, unknown>> }>("/proyectos"),
  })
  const { data: clientsResponse } = useQuery({
    queryKey: ["clientes-lite"],
    queryFn: () => apiRequest<{ clientes: Array<{ id: string; nombre: string }> }>("/clientes"),
  })

  const { data: comprasData, isLoading: comprasLoading } = useQuery({
    queryKey: ["compras-por-proyecto", comprasProyectoNombre],
    queryFn: () =>
      apiRequest<{ ordenes: CompraOrden[] }>(
        `/compras?proyecto=${encodeURIComponent(comprasProyectoNombre || "")}`
      ),
    enabled: comprasOpen && !!comprasProyectoNombre && canViewCompras,
  })

  const comprasFilas = useMemo(() => {
    const ordenes = comprasData?.ordenes || []
    const nombreNorm = (comprasProyectoNombre || "").trim().toLowerCase()
    const rows: Array<{
      key: string
      fecha: string
      proyecto: string
      proveedor: string
      indice: number | string
      cantidad: number | string
      unidad: string
      nombreProducto: string
      precioUnitario: number
      importeTotal: number
    }> = []
    for (const o of ordenes) {
      // Relación por nombre de proyecto (texto libre en compras)
      if (nombreNorm && !String(o.proyecto || "").toLowerCase().includes(nombreNorm)) {
        continue
      }
      const partidas = o.partidas || []
      if (partidas.length === 0) {
        rows.push({
          key: o.id,
          fecha: o.fecha,
          proyecto: o.proyecto,
          proveedor: o.proveedor,
          indice: "—",
          cantidad: "—",
          unidad: "—",
          nombreProducto: "—",
          precioUnitario: 0,
          importeTotal: Number(o.total) || 0,
        })
        continue
      }
      for (const p of partidas) {
        rows.push({
          key: p.id,
          fecha: o.fecha,
          proyecto: o.proyecto,
          proveedor: o.proveedor,
          indice: p.indice,
          cantidad: p.cantidad,
          unidad: p.unidad || "—",
          nombreProducto: p.nombreProducto,
          precioUnitario: p.precioUnitario,
          importeTotal: p.importeTotal,
        })
      }
    }
    return rows
  }, [comprasData?.ordenes, comprasProyectoNombre])

  const clientes = clientsResponse?.clientes || []
  const clientById = useMemo(
    () => Object.fromEntries(clientes.map((cliente) => [cliente.id, cliente.nombre])),
    [clientes]
  )

  const proyectos = useMemo(() => {
    const mapped = (projectsResponse?.proyectos || []).map((proyecto) => ({
      id: String(proyecto.id || ""),
      nombre: String(proyecto.nombre || ""),
      descripcion: String(proyecto.descripcion || ""),
      clienteId: String(proyecto.clienteId || ""),
      empresa: String(proyecto.empresa || clientById[String(proyecto.clienteId || "")] || "Sin empresa"),
      ubicacion: String(proyecto.ubicacion || ""),
      fechaInicio: String(proyecto.fechaInicio || ""),
      fechaFin: String(proyecto.fechaFin || ""),
      estado: String(proyecto.estado || "planeado"),
      totalContrato: Number(proyecto.totalContrato || 0),
      totalEstimacion: Number(proyecto.totalEstimacion || 0),
      deudaContrato: Number(proyecto.deudaContrato || 0),
      maquinasAsignadas: Number(proyecto.maquinasAsignadas || 0),
      responsable: String(proyecto.responsable || ""),
    }))
    const scoped = filterByProyectoScope(mapped, proyectoIds)
    const deudaPorEmpresa = scoped.reduce<Record<string, number>>((acc, proyecto) => {
      const key = proyecto.clienteId || proyecto.empresa
      acc[key] = (acc[key] || 0) + proyecto.deudaContrato
      return acc
    }, {})
    return scoped.map((proyecto) => ({
      ...proyecto,
      deudaEmpresa: deudaPorEmpresa[proyecto.clienteId || proyecto.empresa] || 0,
    }))
  }, [projectsResponse?.proyectos, clientById, proyectoIds])

  const createProject = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<{ proyecto: { id: string } }>("/proyectos", { method: "POST", body: payload }),
    onSuccess: (data) => {
      setModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ["proyectos"] })
      queryClient.invalidateQueries({ queryKey: ["clientes"] })
      queryClient.invalidateQueries({ queryKey: ["clientes-lite"] })
      const newId = data?.proyecto?.id
      if (newId) navigate(`/proyectos/${newId}`)
    },
  })

  const filteredProjects = proyectos.filter((proyecto) =>
    [proyecto.nombre, proyecto.empresa, proyecto.ubicacion].join(" ").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const saveProject = (data: ProyectoFormData) => {
    const payload = {
      clienteId: data.clienteId,
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      ubicacion: data.ubicacion || null,
      fechaInicio: data.fechaInicio || null,
      fechaFin: data.fechaFin || null,
      fechaModificatoria: data.fechaModificatoria || null,
      estado: data.estado,
      presupuesto: Number(data.presupuesto || 0),
      progreso: Number(data.progreso || 0),
      precioEstimado: Math.trunc(Number(data.precioEstimado || 0)),
      cantidadContrato: Number(data.cantidadContrato || 0),
      modificacionContrato: Number(data.modificacionContrato || 0),
      responsable: data.responsable || null,
    }
    createProject.mutate(payload)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completado": return "bg-success text-success-foreground"
      case "en_progreso": return "bg-warning text-warning-foreground"
      case "planeado": return "bg-muted text-muted-foreground"
      case "pausado": return "bg-destructive text-destructive-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const toStatusLabel = (status: string) => {
    if (status === "en_progreso") return "En Progreso"
    if (status === "planeado") return "Pendiente"
    if (status === "completado") return "Completado"
    if (status === "pausado") return "Suspendido"
    return status
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const enProgreso = filteredProjects.filter((p) => p.estado === "en_progreso").length
  const completados = filteredProjects.filter((p) => p.estado === "completado").length
  const pendientes = filteredProjects.filter((p) => p.estado === "planeado").length
  const valorTotal = proyectos.reduce((total, p) => total + p.totalContrato, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proyectos</h1>
          <p className="text-muted-foreground">Gestión de proyectos y contratos</p>
        </div>
        <Button
          className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="En Progreso"
          value={enProgreso}
          icon={FolderOpen}
          description="Proyectos activos"
          trend={{ value: 2, isPositive: true }}
        />
        <StatCard
          title="Completados"
          value={completados}
          icon={Calendar}
          description="Finalizados"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Pendientes"
          value={pendientes}
          icon={Users}
          description="Por iniciar"
          trend={{ value: -1, isPositive: false }}
        />
        <StatCard
          title="Valor Total"
          value={formatCurrency(valorTotal).replace("COP", "")}
          icon={DollarSign}
          description="Total contratos"
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, empresa, ubicación..."
                className="pl-10"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Lista de Proyectos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Total contrato</TableHead>
                <TableHead>Estimación</TableHead>
                <TableHead>Deuda empresa</TableHead>
                <TableHead>Máquinas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
                <TableHead>Compras</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((proyecto) => (
                <TableRow key={proyecto.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{proyecto.id}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium text-primary">{proyecto.nombre}</p>
                      <p className="text-sm text-muted-foreground truncate">{proyecto.descripcion}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Responsable: {proyecto.responsable}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm">{proyecto.empresa}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm">{proyecto.ubicacion}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-primary" />
                        <span className="text-xs text-muted-foreground">Inicio:</span>
                        <span className="text-xs">{proyecto.fechaInicio}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-primary" />
                        <span className="text-xs text-muted-foreground">Fin:</span>
                        <span className="text-xs">{proyecto.fechaFin}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{formatCurrency(proyecto.totalContrato)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{formatCurrency(proyecto.totalEstimacion)}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${proyecto.deudaEmpresa > 0 ? "text-primary" : ""}`}>
                      {formatCurrency(proyecto.deudaEmpresa)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{proyecto.maquinasAsignadas}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(proyecto.estado)}>
                      {toStatusLabel(proyecto.estado)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/proyectos/${proyecto.id}`)}
                    >
                      Gestionar
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canViewCompras}
                      title={!canViewCompras ? "Sin permiso de compras" : undefined}
                      onClick={() => {
                        setComprasProyectoNombre(proyecto.nombre)
                        setComprasOpen(true)
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Lista de compras
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={comprasOpen}
        onOpenChange={(open) => {
          setComprasOpen(open)
          if (!open) setComprasProyectoNombre(null)
        }}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Compras{comprasProyectoNombre ? ` · ${comprasProyectoNombre}` : ""}
            </DialogTitle>
          </DialogHeader>
          {!canViewCompras ? (
            <p className="text-sm text-muted-foreground">No tienes permiso para ver compras.</p>
          ) : comprasLoading ? (
            <p className="text-sm text-muted-foreground">Cargando compras…</p>
          ) : comprasFilas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay compras relacionadas con este nombre de proyecto.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-center">Índice</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">P. unitario</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comprasFilas.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="whitespace-nowrap">{row.fecha}</TableCell>
                      <TableCell>{row.proyecto}</TableCell>
                      <TableCell>{row.proveedor}</TableCell>
                      <TableCell className="text-center">{row.indice}</TableCell>
                      <TableCell className="text-right">{row.cantidad}</TableCell>
                      <TableCell>{row.unidad}</TableCell>
                      <TableCell>{row.nombreProducto}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatMoneyMx(row.precioUnitario)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatMoneyMx(row.importeTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ProyectoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={saveProject}
        isSubmitting={createProject.isPending}
        initialData={null}
        clientes={clientes}
      />
    </div>
  )
}

export default Proyectos
