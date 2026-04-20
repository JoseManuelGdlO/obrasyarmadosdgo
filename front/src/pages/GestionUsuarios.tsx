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
  UserCheck,
  Settings,
  Shield,
  User,
  Mail
} from "lucide-react"

const GestionUsuarios = () => {
  const usuarios = [
    {
      id: "USR-001",
      nombre: "Carlos Mendoza",
      email: "cmendoza@horizonte.com.co",
      rol: "Admin Cliente",
      cliente: "Constructora Horizonte S.A.",
      clienteId: "CLI-001",
      fechaRegistro: "2023-06-15",
      ultimoAcceso: "2024-01-15",
      estado: "Activo",
      proyectosAsignados: 8,
      permisos: ["Gestionar Proyectos", "Crear Usuarios", "Ver Reportes"]
    },
    {
      id: "USR-002", 
      nombre: "Ana López",
      email: "alopez@mineracesar.com",
      rol: "Admin Cliente",
      cliente: "Minera del Cesar LTDA",
      clienteId: "CLI-002",
      fechaRegistro: "2023-08-22",
      ultimoAcceso: "2024-01-14", 
      estado: "Activo",
      proyectosAsignados: 12,
      permisos: ["Gestionar Proyectos", "Crear Usuarios", "Ver Reportes"]
    },
    {
      id: "USR-003",
      nombre: "Roberto Silva",
      email: "rsilva@vialidadnal.gov.co", 
      rol: "Admin Cliente",
      cliente: "Vialidad Nacional",
      clienteId: "CLI-003",
      fechaRegistro: "2023-11-10",
      ultimoAcceso: "2024-01-16",
      estado: "Activo", 
      proyectosAsignados: 15,
      permisos: ["Gestionar Proyectos", "Crear Usuarios", "Ver Reportes"]
    },
    {
      id: "USR-004",
      nombre: "María García",
      email: "mgarcia@petrogas.com",
      rol: "Admin Cliente", 
      cliente: "Petróleo y Gas del Norte",
      clienteId: "CLI-004",
      fechaRegistro: "2024-01-05",
      ultimoAcceso: "2024-01-12",
      estado: "Configurando",
      proyectosAsignados: 2,
      permisos: ["Gestionar Proyectos", "Crear Usuarios"]
    },
    {
      id: "USR-005",
      nombre: "Luis Fernández", 
      email: "lfernandez@agrisabana.com",
      rol: "Admin Cliente",
      cliente: "Agroindustrial La Sabana",
      clienteId: "CLI-005", 
      fechaRegistro: "2023-12-18",
      ultimoAcceso: "2023-12-28",
      estado: "Suspendido",
      proyectosAsignados: 0,
      permisos: []
    },
    {
      id: "USR-006",
      nombre: "Sofía Ramírez",
      email: "sramirez@horizonte.com.co",
      rol: "Usuario",
      cliente: "Constructora Horizonte S.A.",
      clienteId: "CLI-001",
      fechaRegistro: "2023-07-20",
      ultimoAcceso: "2024-01-14",
      estado: "Activo",
      proyectosAsignados: 3,
      permisos: ["Ver Proyectos", "Editar Órdenes"]
    },
    {
      id: "USR-007",
      nombre: "Diego Morales",
      email: "dmorales@mineracesar.com", 
      rol: "Usuario",
      cliente: "Minera del Cesar LTDA",
      clienteId: "CLI-002",
      fechaRegistro: "2023-09-15",
      ultimoAcceso: "2024-01-13",
      estado: "Activo",
      proyectosAsignados: 5,
      permisos: ["Ver Proyectos", "Gestionar Inventario"]
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Activo": return "bg-success text-success-foreground"
      case "Configurando": return "bg-warning text-warning-foreground"
      case "Suspendido": return "bg-destructive text-destructive-foreground"
      case "Inactivo": return "bg-muted text-muted-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getRolColor = (rol: string) => {
    switch (rol) {
      case "Super Admin": return "bg-primary text-primary-foreground"
      case "Admin Cliente": return "bg-accent text-accent-foreground"
      case "Usuario": return "bg-secondary text-secondary-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const usuariosActivos = usuarios.filter(u => u.estado === "Activo").length
  const adminClientes = usuarios.filter(u => u.rol === "Admin Cliente").length
  const usuariosRegulares = usuarios.filter(u => u.rol === "Usuario").length
  const usuariosNuevos = usuarios.filter(u => new Date(u.fechaRegistro) > new Date("2024-01-01")).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Panel Super Administrador - Control Multi-Tenant de Usuarios</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Ver Clientes
          </Button>
          <Button className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Usuarios Activos"
          value={usuariosActivos}
          icon={UserCheck}
          description="En toda la plataforma"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Admin Clientes"
          value={adminClientes}
          icon={Crown}
          description="Administradores de organizaciones"
          trend={{ value: 1, isPositive: true }}
        />
        <StatCard
          title="Usuarios Regulares"
          value={usuariosRegulares}
          icon={Users}
          description="Usuarios finales"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Nuevos Este Mes"
          value={usuariosNuevos}
          icon={Shield}
          description="Registros recientes"
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, email, cliente, rol..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtrar por Cliente
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Filtrar por Rol
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Usuarios de la Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Proyectos</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <span className="font-medium">{usuario.id}</span>
                      </div>
                      <p className="font-medium text-primary">{usuario.nombre}</p>
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{usuario.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{usuario.cliente}</p>
                        <p className="text-xs text-muted-foreground">{usuario.clienteId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {usuario.rol === "Admin Cliente" ? <Crown className="w-4 h-4 text-accent" /> : <Shield className="w-4 h-4 text-primary" />}
                      <Badge className={getRolColor(usuario.rol)}>
                        {usuario.rol}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-medium">{usuario.proyectosAsignados}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {usuario.permisos.slice(0, 2).map((permiso, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {permiso}
                        </Badge>
                      ))}
                      {usuario.permisos.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{usuario.permisos.length - 2} más
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(usuario.estado)}>
                      {usuario.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm">{usuario.ultimoAcceso}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Shield className="w-3 h-3 mr-1" />
                        Permisos
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button variant="default" size="sm">
                        Ver Perfil
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

export default GestionUsuarios