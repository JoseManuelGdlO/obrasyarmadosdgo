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
  Calendar,
  MapPin,
  UserCheck,
  Settings
} from "lucide-react"

const Clientes = () => {
  const clientes = [
    {
      id: "CLI-001",
      nombre: "Constructora Horizonte S.A.",
      tipoIndustria: "Construcción",
      pais: "Colombia",
      ciudad: "Bogotá",
      fechaRegistro: "2023-06-15",
      estado: "Activo",
      planContratado: "Enterprise",
      proyectosActivos: 8,
      usuariosRegistrados: 25,
      adminPrincipal: "Carlos Mendoza",
      emailAdmin: "cmendoza@horizonte.com.co",
      ultimoAcceso: "2024-01-15"
    },
    {
      id: "CLI-002", 
      nombre: "Minera del Cesar LTDA",
      tipoIndustria: "Minería",
      pais: "Colombia", 
      ciudad: "Valledupar",
      fechaRegistro: "2023-08-22",
      estado: "Activo",
      planContratado: "Professional",
      proyectosActivos: 12,
      usuariosRegistrados: 45,
      adminPrincipal: "Ana López",
      emailAdmin: "alopez@mineracesar.com",
      ultimoAcceso: "2024-01-14"
    },
    {
      id: "CLI-003",
      nombre: "Vialidad Nacional",
      tipoIndustria: "Infraestructura",
      pais: "Colombia",
      ciudad: "Medellín", 
      fechaRegistro: "2023-11-10",
      estado: "Activo",
      planContratado: "Enterprise",
      proyectosActivos: 15,
      usuariosRegistrados: 60,
      adminPrincipal: "Roberto Silva",
      emailAdmin: "rsilva@vialidadnal.gov.co",
      ultimoAcceso: "2024-01-16"
    },
    {
      id: "CLI-004",
      nombre: "Petróleo y Gas del Norte",
      tipoIndustria: "Petróleo y Gas",
      pais: "Colombia",
      ciudad: "Barrancas",
      fechaRegistro: "2024-01-05",
      estado: "En Configuración",
      planContratado: "Professional",
      proyectosActivos: 2,
      usuariosRegistrados: 8,
      adminPrincipal: "María García",
      emailAdmin: "mgarcia@petrogas.com",
      ultimoAcceso: "2024-01-12"
    },
    {
      id: "CLI-005",
      nombre: "Agroindustrial La Sabana",
      tipoIndustria: "Agroindustria",
      pais: "Colombia", 
      ciudad: "Villavicencio",
      fechaRegistro: "2023-12-18",
      estado: "Suspendido",
      planContratado: "Basic",
      proyectosActivos: 0,
      usuariosRegistrados: 12,
      adminPrincipal: "Luis Fernández",
      emailAdmin: "lfernandez@agrisabana.com",
      ultimoAcceso: "2023-12-28"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Activo": return "bg-success text-success-foreground"
      case "En Configuración": return "bg-warning text-warning-foreground"
      case "Suspendido": return "bg-destructive text-destructive-foreground"
      case "Inactivo": return "bg-muted text-muted-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "Enterprise": return "bg-primary text-primary-foreground"
      case "Professional": return "bg-accent text-accent-foreground"
      case "Basic": return "bg-secondary text-secondary-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const clientesActivos = clientes.filter(c => c.estado === "Activo").length
  const totalProyectos = clientes.reduce((total, c) => total + c.proyectosActivos, 0)
  const totalUsuarios = clientes.reduce((total, c) => total + c.usuariosRegistrados, 0)
  const clientesNuevos = clientes.filter(c => new Date(c.fechaRegistro) > new Date("2024-01-01")).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Panel Super Administrador - Gestión Multi-Tenant</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Gestionar Usuarios
          </Button>
          <Button className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all">
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
          title="Usuarios Registrados"
          value={totalUsuarios}
          icon={UserCheck}
          description="Total en la plataforma"
          trend={{ value: 12, isPositive: true }}
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
                placeholder="Buscar por nombre, industria, administrador..." 
                className="pl-10"
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
                <TableHead>Admin Principal</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Proyectos</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
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
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium">{cliente.adminPrincipal}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{cliente.emailAdmin}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPlanColor(cliente.planContratado)}>
                      {cliente.planContratado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-medium">{cliente.proyectosActivos}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-primary" />
                      <span className="font-medium">{cliente.usuariosRegistrados}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(cliente.estado)}>
                      {cliente.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm">{cliente.ultimoAcceso}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Usuarios
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3 mr-1" />
                        Configurar
                      </Button>
                      <Button variant="default" size="sm">
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
    </div>
  )
}

export default Clientes