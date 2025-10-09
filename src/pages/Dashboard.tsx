import { useState } from "react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import NuevaOrdenModal from "@/components/modals/NuevaOrdenModal"
import {
  ClipboardList,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  Users,
  Building,
  Plus
} from "lucide-react"

const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const recentOrders = [
    { id: "OT-001", machine: "Excavadora CAT 320", client: "Constructora ABC", status: "En Progreso", priority: "Alta" },
    { id: "OT-002", machine: "Grúa Liebherr LTM", client: "Minera XYZ", status: "Pendiente", priority: "Media" },
    { id: "OT-003", machine: "Bulldozer D6T", client: "Vialidad Nacional", status: "Completada", priority: "Baja" },
    { id: "OT-004", machine: "Retroexcavadora JCB", client: "Obras Públicas", status: "En Progreso", priority: "Alta" },
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
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Panel de control del sistema de mantenimiento</p>
        </div>
        <Button 
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden de Trabajo
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Órdenes Activas"
          value={24}
          icon={ClipboardList}
          description="Órdenes en progreso"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Equipos Fuera de Servicio"
          value={8}
          icon={AlertTriangle}
          description="Requieren mantenimiento"
          trend={{ value: -5, isPositive: false }}
        />
        <StatCard
          title="Máquinas Activas"
          value={156}
          icon={Truck}
          description="En operación"
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard
          title="Disponibilidad"
          value="94%"
          icon={CheckCircle}
          description="Promedio mensual"
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Órdenes de Trabajo Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{order.id}</span>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.machine}</p>
                    <p className="text-xs text-muted-foreground">{order.client}</p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" size="lg">
              <ClipboardList className="w-4 h-4 mr-3" />
              Nueva Orden
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Package className="w-4 h-4 mr-3" />
              Gestionar Inventario
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Users className="w-4 h-4 mr-3" />
              Asignar Técnico
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Building className="w-4 h-4 mr-3" />
              Contactar Proveedor
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-center text-success">Completadas Hoy</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-success mb-2">12</div>
            <p className="text-sm text-muted-foreground">Órdenes finalizadas</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-center text-warning">En Progreso</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-warning mb-2">18</div>
            <p className="text-sm text-muted-foreground">Órdenes activas</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-center text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-muted-foreground mb-2">6</div>
            <p className="text-sm text-muted-foreground">Esperando asignación</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal para nueva orden */}
      <NuevaOrdenModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}

export default Dashboard