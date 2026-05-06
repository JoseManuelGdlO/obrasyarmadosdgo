import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { StatCard } from "@/components/ui/stat-card"
import { 
  Plus, 
  Search, 
  Filter, 
  FolderOpen,
  Calendar,
  MapPin,
  DollarSign,
  Users
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import ProyectoModal, { ProyectoFormData } from "@/components/modals/ProyectoModal"

const Proyectos = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: projectsResponse } = useQuery({
    queryKey: ["proyectos"],
    queryFn: () => apiRequest<{ proyectos: Array<Record<string, unknown>> }>("/proyectos"),
  })
  const { data: clientsResponse } = useQuery({
    queryKey: ["clientes-lite"],
    queryFn: () => apiRequest<{ clientes: Array<{ id: string; nombre: string }> }>("/clientes"),
  })

  const clientes = clientsResponse?.clientes || []
  const clientById = useMemo(
    () => Object.fromEntries(clientes.map((cliente) => [cliente.id, cliente.nombre])),
    [clientes]
  )

  const proyectos = (projectsResponse?.proyectos || []).map((proyecto) => ({
    id: String(proyecto.id || ""),
    nombre: String(proyecto.nombre || ""),
    descripcion: String(proyecto.descripcion || ""),
    clienteId: String(proyecto.clienteId || ""),
    cliente: clientById[String(proyecto.clienteId || "")] || "Sin cliente",
    ubicacion: String(proyecto.ubicacion || ""),
    fechaInicio: String(proyecto.fechaInicio || ""),
    fechaFin: String(proyecto.fechaFin || ""),
    estado: String(proyecto.estado || "planeado"),
    presupuesto: Number(proyecto.presupuesto || 0),
    progreso: Number(proyecto.progreso || 0),
    maquinasAsignadas: Number(proyecto.maquinasAsignadas || 0),
    responsable: String(proyecto.responsable || ""),
  }))

  const createProject = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("/proyectos", { method: "POST", body: payload }),
    onSuccess: () => {
      setModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ["proyectos"] })
    },
  })

  const updateProject = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiRequest(`/proyectos/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => {
      setModalOpen(false)
      setEditingProjectId(null)
      queryClient.invalidateQueries({ queryKey: ["proyectos"] })
    },
  })

  const filteredProjects = proyectos.filter((proyecto) =>
    [proyecto.nombre, proyecto.cliente, proyecto.ubicacion].join(" ").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedProject = proyectos.find((proyecto) => proyecto.id === editingProjectId)
  const initialData: Partial<ProyectoFormData> | null = selectedProject
    ? {
        clienteId: selectedProject.clienteId,
        nombre: selectedProject.nombre,
        descripcion: selectedProject.descripcion,
        ubicacion: selectedProject.ubicacion,
        fechaInicio: selectedProject.fechaInicio,
        fechaFin: selectedProject.fechaFin,
        estado: (selectedProject.estado as ProyectoFormData["estado"]) || "planeado",
        presupuesto: String(selectedProject.presupuesto || 0),
        progreso: String(selectedProject.progreso || 0),
        responsable: selectedProject.responsable,
      }
    : null

  const saveProject = (data: ProyectoFormData) => {
    const payload = {
      clienteId: data.clienteId,
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      ubicacion: data.ubicacion || null,
      fechaInicio: data.fechaInicio || null,
      fechaFin: data.fechaFin || null,
      estado: data.estado,
      presupuesto: Number(data.presupuesto || 0),
      progreso: Number(data.progreso || 0),
      responsable: data.responsable || null,
    }

    if (editingProjectId) {
      updateProject.mutate({ id: editingProjectId, payload })
      return
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
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const enProgreso = filteredProjects.filter(p => p.estado === "en_progreso").length
  const completados = filteredProjects.filter(p => p.estado === "completado").length
  const pendientes = filteredProjects.filter(p => p.estado === "planeado").length
  const valorTotal = proyectos.reduce((total, p) => total + p.presupuesto, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proyectos</h1>
          <p className="text-muted-foreground">Gestión de proyectos y contratos</p>
        </div>
        <Button
          className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all"
          onClick={() => {
            setEditingProjectId(null)
            setModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Stats Grid */}
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
          value={formatCurrency(valorTotal).replace('COP', '')}
          icon={DollarSign}
          description="Portafolio total"
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, cliente, ubicación..." 
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

      {/* Projects Table */}
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
                <TableHead>Cliente</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Presupuesto</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Máquinas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
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
                      <span className="text-sm">{proyecto.cliente}</span>
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
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{formatCurrency(proyecto.presupuesto)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{proyecto.progreso}%</span>
                      </div>
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="h-2 bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                          style={{ width: `${proyecto.progreso}%` }}
                        />
                      </div>
                    </div>
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
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setEditingProjectId(proyecto.id)
                          setModalOpen(true)
                        }}
                      >
                        Gestionar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ProyectoModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setEditingProjectId(null)
        }}
        onSubmit={saveProject}
        isSubmitting={createProject.isPending || updateProject.isPending}
        initialData={initialData}
        clientes={clientes}
      />
    </div>
  )
}

export default Proyectos