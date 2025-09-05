import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import NuevaOrdenModal from "@/components/modals/NuevaOrdenModal"
import { 
  Plus, 
  Search, 
  Filter, 
  ClipboardList,
  Calendar,
  User,
  Truck,
  DollarSign,
  MapPin
} from "lucide-react"

const OrdenesTrabajo = () => {
  const [modalOpen, setModalOpen] = useState(false)
  
  const ordenes = [
    {
      id: "OT-2024-001",
      titulo: "Mantenimiento preventivo sistema hidráulico",
      maquina: "Excavadora CAT 320DL",
      ubicacion: "Sector A - Planta Norte",
      nomenclatura: { codigo: "MPR", descripcion: "MANTENIMIENTO PREVENTIVO RUTINARIO" },
      tecnico: "Carlos Rodríguez",
      fechaCreacion: "2024-01-15",
      fechaVencimiento: "2024-01-22",
      estado: "En Progreso",
      prioridad: "Alta",
      costoTotal: 1250000,
      descripcion: "Revisión completa del sistema hidráulico, cambio de filtros y verificación de presiones."
    },
    {
      id: "OT-2024-002", 
      titulo: "Reparación motor principal",
      maquina: "Bulldozer Komatsu D65PX",
      ubicacion: "Sector B - Zona Industrial",
      nomenclatura: { codigo: "MCU", descripcion: "MANTENIMIENTO CORRECTIVO URGENTE" },
      tecnico: "Ana Martínez",
      fechaCreacion: "2024-01-14",
      fechaVencimiento: "2024-01-20",
      estado: "Pendiente",
      prioridad: "Media",
      costoTotal: 2800000,
      descripcion: "Motor presenta ruidos anómalos. Requiere diagnóstico completo y posible reemplazo de componentes."
    },
    {
      id: "OT-2024-003",
      titulo: "Calibración sistema GPS",
      maquina: "Grúa Liebherr LTM 1090",
      ubicacion: "Sector C - Área de Carga",
      nomenclatura: { codigo: "INS", descripcion: "INSPECCIÓN DE SEGURIDAD" },
      tecnico: "Roberto Silva",
      fechaCreacion: "2024-01-12",
      fechaVencimiento: "2024-01-18",
      estado: "Completada",
      prioridad: "Baja",
      costoTotal: 450000,
      descripcion: "Calibración y actualización del sistema de navegación GPS integrado."
    },
    {
      id: "OT-2024-004",
      titulo: "Mantenimiento correctivo transmisión",
      maquina: "Retroexcavadora JCB 3CX",
      ubicacion: "Sector D - Patio de Maniobras",
      nomenclatura: { codigo: "MCP", descripcion: "MANTENIMIENTO CORRECTIVO PROGRAMADO" },
      tecnico: "Luis Fernández",
      fechaCreacion: "2024-01-16",
      fechaVencimiento: "2024-01-25",
      estado: "En Progreso",
      prioridad: "Alta",
      costoTotal: 1850000,
      descripcion: "Falla en la transmisión automática. Requiere desmontaje y reparación completa."
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)
  }

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

  const calculateDaysOpen = (fechaCreacion: string) => {
    const creationDate = new Date(fechaCreacion)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - creationDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Órdenes de Trabajo</h1>
          <p className="text-muted-foreground">Gestiona todas las órdenes de mantenimiento</p>
        </div>
        <Button 
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all"
        >
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
                <TableHead>Ubicación</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Fecha Vencimiento</TableHead>
                <TableHead>Días Abierta</TableHead>
                <TableHead>Costo Total</TableHead>
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
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm">{orden.ubicacion}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="text-xs font-mono bg-muted px-1 rounded">{orden.nomenclatura.codigo}</span>
                        <span className="text-xs text-muted-foreground">{orden.nomenclatura.descripcion}</span>
                      </div>
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
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium">{calculateDaysOpen(orden.fechaCreacion)} días</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(orden.costoTotal)}</span>
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

      {/* Modal para nueva orden */}
      <NuevaOrdenModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}

export default OrdenesTrabajo