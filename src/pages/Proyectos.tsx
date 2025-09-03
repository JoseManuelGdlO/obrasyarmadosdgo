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

const Proyectos = () => {
  const proyectos = [
    {
      id: "PROY-001",
      nombre: "Construcción Autopista Norte",
      descripcion: "Construcción de 50km de autopista con infraestructura completa",
      cliente: "Ministerio de Transporte",
      ubicacion: "Bogotá - Tunja",
      fechaInicio: "2024-01-15",
      fechaFin: "2024-12-30",
      estado: "En Progreso",
      presupuesto: 850000000,
      progreso: 35,
      maquinasAsignadas: 12,
      responsable: "Ing. Carlos Mendoza"
    },
    {
      id: "PROY-002", 
      nombre: "Explotación Mina La Esperanza",
      descripcion: "Extracción de carbón y mantenimiento de equipos mineros",
      cliente: "Carbones del Cesar S.A.",
      ubicacion: "La Jagua de Ibirico, Cesar",
      fechaInicio: "2023-11-01",
      fechaFin: "2025-06-15",
      estado: "En Progreso",
      presupuesto: 1200000000,
      progreso: 68,
      maquinasAsignadas: 18,
      responsable: "Ing. Ana López"
    },
    {
      id: "PROY-003",
      nombre: "Urbanización Ciudad Verde",
      descripcion: "Movimiento de tierras y preparación de terreno para urbanización",
      cliente: "Constructora Horizonte",
      ubicacion: "Medellín, Antioquia",
      fechaInicio: "2024-02-01",
      fechaFin: "2024-08-30",
      estado: "Pendiente",
      presupuesto: 450000000,
      progreso: 0,
      maquinasAsignadas: 8,
      responsable: "Ing. Roberto Silva"
    },
    {
      id: "PROY-004",
      nombre: "Ampliación Puerto Buenaventura",
      descripcion: "Dragado y construcción de nuevos muelles portuarios",
      cliente: "Sociedad Portuaria Regional",
      ubicacion: "Buenaventura, Valle",
      fechaInicio: "2023-08-15",
      fechaFin: "2024-03-30",
      estado: "Completado",
      presupuesto: 920000000,
      progreso: 100,
      maquinasAsignadas: 15,
      responsable: "Ing. María García"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completado": return "bg-success text-success-foreground"
      case "En Progreso": return "bg-warning text-warning-foreground"
      case "Pendiente": return "bg-muted text-muted-foreground"
      case "Suspendido": return "bg-destructive text-destructive-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const enProgreso = proyectos.filter(p => p.estado === "En Progreso").length
  const completados = proyectos.filter(p => p.estado === "Completado").length
  const pendientes = proyectos.filter(p => p.estado === "Pendiente").length
  const valorTotal = proyectos.reduce((total, p) => total + p.presupuesto, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proyectos</h1>
          <p className="text-muted-foreground">Gestión de proyectos y contratos</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all">
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
              {proyectos.map((proyecto) => (
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
                      {proyecto.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                      <Button variant="default" size="sm">
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
    </div>
  )
}

export default Proyectos