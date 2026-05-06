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
  Building,
  Users,
  Crown,
  MapPin,
  UserCheck
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import ClienteModal, { ClienteFormData } from "@/components/modals/ClienteModal"

const Clientes = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => apiRequest<{ clientes: Array<Record<string, unknown>> }>("/clientes"),
  })

  const clientes = (data?.clientes || []).map((cliente) => ({
    id: String(cliente.id || ""),
    nombre: String(cliente.nombre || ""),
    tipoIndustria: String(cliente.tipoIndustria || "-"),
    pais: String(cliente.pais || "-"),
    ciudad: String(cliente.ciudad || "-"),
    encargadoNombre: String(cliente.encargadoNombre || "-"),
    telefono: String(cliente.telefono || "-"),
    fechaRegistro: String(cliente.createdAt || "").slice(0, 10),
    estado: String(cliente.estado || "activo"),
    proyectosActivos: Number(cliente.proyectosActivos || 0),
  }))

  const createCliente = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("/clientes", { method: "POST", body: payload }),
    onSuccess: () => {
      setModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ["clientes"] })
    },
  })
  const updateCliente = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiRequest(`/clientes/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => {
      setModalOpen(false)
      setEditingClientId(null)
      queryClient.invalidateQueries({ queryKey: ["clientes"] })
    },
  })

  const filteredClientes = clientes.filter((cliente) =>
    [cliente.nombre, cliente.tipoIndustria, cliente.ciudad, cliente.pais].join(" ").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedClient = clientes.find((cliente) => cliente.id === editingClientId)
  const initialData: Partial<ClienteFormData> | null = selectedClient
    ? {
        nombre: selectedClient.nombre,
        tipoIndustria: selectedClient.tipoIndustria === "-" ? "" : selectedClient.tipoIndustria,
        pais: selectedClient.pais === "-" ? "" : selectedClient.pais,
        ciudad: selectedClient.ciudad === "-" ? "" : selectedClient.ciudad,
        encargadoNombre: selectedClient.encargadoNombre === "-" ? "" : selectedClient.encargadoNombre,
        telefono: selectedClient.telefono === "-" ? "" : selectedClient.telefono,
        estado: (selectedClient.estado as ClienteFormData["estado"]) || "activo",
      }
    : null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo": return "bg-success text-success-foreground"
      case "en_configuracion": return "bg-warning text-warning-foreground"
      case "suspendido": return "bg-destructive text-destructive-foreground"
      case "inactivo": return "bg-muted text-muted-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }
  const toStatusLabel = (status: string) => {
    if (status === "activo") return "Activo"
    if (status === "en_configuracion") return "En Configuración"
    if (status === "suspendido") return "Suspendido"
    if (status === "inactivo") return "Inactivo"
    return status
  }

  const saveCliente = (form: ClienteFormData) => {
    const payload = {
      nombre: form.nombre,
      tipoIndustria: form.tipoIndustria || null,
      pais: form.pais || null,
      ciudad: form.ciudad || null,
      encargadoNombre: form.encargadoNombre || null,
      telefono: form.telefono || null,
      estado: form.estado,
    }
    if (editingClientId) {
      updateCliente.mutate({ id: editingClientId, payload })
      return
    }
    createCliente.mutate(payload)
  }

  const clientesActivos = filteredClientes.filter(c => c.estado === "activo").length
  const totalProyectos = clientes.reduce((total, c) => total + c.proyectosActivos, 0)
  const totalCiudades = new Set(clientes.map((cliente) => cliente.ciudad).filter((ciudad) => ciudad && ciudad !== "-")).size
  const clientesNuevos = filteredClientes.filter(c => new Date(c.fechaRegistro) > new Date("2024-01-01")).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Panel Super Administrador - Gestión Multi-Tenant</p>
        </div>
        <div className="flex gap-3">
          <Button
            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all"
            onClick={() => {
              setEditingClientId(null)
              setModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Clientes Activos"
          value={clientesActivos}
          icon={Building}
          description="Organizaciones activas"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Proyectos Totales"
          value={totalProyectos}
          icon={Users}
          description="En todas las organizaciones"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Ciudades Cubiertas"
          value={totalCiudades}
          icon={UserCheck}
          description="Con presencia de clientes"
          trend={{ value: 4, isPositive: true }}
        />
        <StatCard
          title="Clientes Nuevos"
          value={clientesNuevos}
          icon={Crown}
          description="Este mes"
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, industria o ubicación..." 
                className="pl-10"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros Avanzados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Organizaciones Registradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Industria</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Encargado</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Proyectos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow key={cliente.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-primary" />
                        <span className="font-medium">{cliente.id}</span>
                      </div>
                      <p className="font-medium text-primary">{cliente.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Registro: {cliente.fechaRegistro}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{cliente.tipoIndustria}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{cliente.ciudad}</p>
                        <p className="text-xs text-muted-foreground">{cliente.pais}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{cliente.encargadoNombre}</TableCell>
                  <TableCell>{cliente.telefono}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-medium">{cliente.proyectosActivos}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(cliente.estado)}>
                      {toStatusLabel(cliente.estado)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setEditingClientId(cliente.id)
                          setModalOpen(true)
                        }}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ClienteModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setEditingClientId(null)
        }}
        onSubmit={saveCliente}
        isSubmitting={createCliente.isPending || updateCliente.isPending}
        initialData={initialData}
      />
    </div>
  )
}

export default Clientes