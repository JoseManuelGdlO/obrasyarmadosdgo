import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  Filter, 
  ClipboardList,
  Calendar,
  User,
  Truck
} from "lucide-react"

const OrdenesTrabajo = () => {
  const ordenes = [
    {
      id: "OT-2024-001",
      titulo: "Mantenimiento preventivo sistema hidráulico",
      maquina: "Excavadora CAT 320DL",
      cliente: "Constructora Horizonte S.A.",
      tecnico: "Carlos Rodríguez",
      fechaCreacion: "2024-01-15",
      fechaVencimiento: "2024-01-22",
      estado: "En Progreso",
      prioridad: "Alta",
      descripcion: "Revisión completa del sistema hidráulico, cambio de filtros y verificación de presiones."
    },
    {
      id: "OT-2024-002", 
      titulo: "Reparación motor principal",
      maquina: "Bulldozer Komatsu D65PX",
      cliente: "Minera del Norte LTDA",
      tecnico: "Ana Martínez",
      fechaCreacion: "2024-01-14",
      fechaVencimiento: "2024-01-20",
      estado: "Pendiente",
      prioridad: "Media",
      descripcion: "Motor presenta ruidos anómalos. Requiere diagnóstico completo y posible reemplazo de componentes."
    },
    {
      id: "OT-2024-003",
      titulo: "Calibración sistema GPS",
      maquina: "Grúa Liebherr LTM 1090",
      cliente: "Vialidad Nacional",
      tecnico: "Roberto Silva",
      fechaCreacion: "2024-01-12",
      fechaVencimiento: "2024-01-18",
      estado: "Completada",
      prioridad: "Baja",
      descripcion: "Calibración y actualización del sistema de navegación GPS integrado."
    },
    {
      id: "OT-2024-004",
      titulo: "Mantenimiento correctivo transmisión",
      maquina: "Retroexcavadora JCB 3CX",
      cliente: "Obras Públicas Municipal",
      tecnico: "Luis Fernández",
      fechaCreacion: "2024-01-16",
      fechaVencimiento: "2024-01-25",
      estado: "En Progreso",
      prioridad: "Alta",
      descripcion: "Falla en la transmisión automática. Requiere desmontaje y reparación completa."
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completada": return "bg-success text-success-foreground"
      case "En Progreso": return "bg-warning text-warning-foreground"
      case "Pendiente": return "bg-muted text-muted-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta": return "bg-destructive text-destructive-foreground"
      case "Media": return "bg-warning text-warning-foreground"
      case "Baja": return "bg-success text-success-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Órdenes de Trabajo</h1>
          <p className="text-muted-foreground">Gestiona todas las órdenes de mantenimiento</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por ID, máquina, cliente..." 
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

      {/* Orders Table */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Lista de Órdenes de Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Máquina</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Fecha Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenes.map((orden) => (
                <TableRow key={orden.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{orden.id}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium text-primary">{orden.titulo}</p>
                      <p className="text-sm text-muted-foreground truncate">{orden.descripcion}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" />
                      <span className="text-sm">{orden.maquina}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-primary" />
                      <span className="text-sm">{orden.cliente}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-sm">{orden.tecnico}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm">{orden.fechaVencimiento}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(orden.estado)}>
                      {orden.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(orden.prioridad)}>
                      {orden.prioridad}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                      <Button variant="default" size="sm">
                        Editar
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

export default OrdenesTrabajo