import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import NuevaOrdenModal from "@/components/modals/NuevaOrdenModal"
import logoObras from "@/assets/logo-obras.png"
import { apiRequest } from "@/lib/api"
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Truck,
  Plus
} from "lucide-react"

type DashboardOrder = {
  id: string
  machine: string
  client: string
  status: string
  priority: string
}

type DashboardChecklistItem = {
  placa: string
  nombre: string
  completado: boolean
}

type DashboardHomeResponse = {
  stats: {
    ordenesActivas: number
    equiposFueraServicio: number
    maquinasActivas: number
    disponibilidad: number
    checklist: {
      completados: number
      total: number
      porcentaje: number
    }
  }
  trends: {
    ordenesActivas: { value: number; isPositive: boolean }
    equiposFueraServicio: { value: number; isPositive: boolean }
    maquinasActivas: { value: number; isPositive: boolean }
    disponibilidad: { value: number; isPositive: boolean }
  }
  recentOrders: DashboardOrder[]
  checklist: {
    total: number
    completados: number
    pendientes: number
    detalle: DashboardChecklistItem[]
  }
  statusOverview: {
    completadasHoy: number
    enProgreso: number
    pendientes: number
  }
}

const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-home"],
    queryFn: () => apiRequest<DashboardHomeResponse>("/dashboard/home"),
  })

  const dashboardData = useMemo<DashboardHomeResponse>(
    () =>
      data ?? {
        stats: {
          ordenesActivas: 0,
          equiposFueraServicio: 0,
          maquinasActivas: 0,
          disponibilidad: 0,
          checklist: { completados: 0, total: 0, porcentaje: 0 },
        },
        trends: {
          ordenesActivas: { value: 0, isPositive: true },
          equiposFueraServicio: { value: 0, isPositive: false },
          maquinasActivas: { value: 0, isPositive: true },
          disponibilidad: { value: 0, isPositive: true },
        },
        recentOrders: [],
        checklist: { total: 0, completados: 0, pendientes: 0, detalle: [] },
        statusOverview: { completadasHoy: 0, enProgreso: 0, pendientes: 0 },
      },
    [data]
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completada": return "bg-success text-success-foreground"
      case "En Progreso": return "bg-warning text-warning-foreground"
      case "Pausada": return "bg-muted text-muted-foreground"
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

  const pctChecklist = dashboardData.checklist.total
    ? Math.round((dashboardData.checklist.completados / dashboardData.checklist.total) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header con logotipo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logoObras} alt="Obras y Armados Estructurales" className="w-14 h-14 object-contain" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Panel de control — Obras y Armados Estructurales</p>
          </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Órdenes Activas"
          value={dashboardData.stats.ordenesActivas}
          icon={ClipboardList}
          description="Órdenes en progreso"
          trend={dashboardData.trends.ordenesActivas}
        />
        <StatCard
          title="Equipos Fuera de Servicio"
          value={dashboardData.stats.equiposFueraServicio}
          icon={AlertTriangle}
          description="Requieren mantenimiento"
          trend={dashboardData.trends.equiposFueraServicio}
        />
        <StatCard
          title="Máquinas Activas"
          value={dashboardData.stats.maquinasActivas}
          icon={Truck}
          description="En operación"
          trend={dashboardData.trends.maquinasActivas}
        />
        <StatCard
          title="Disponibilidad"
          value={`${dashboardData.stats.disponibilidad}%`}
          icon={CheckCircle}
          description="Promedio mensual"
          trend={dashboardData.trends.disponibilidad}
        />
        <StatCard
          title="Checklist Hoy"
          value={`${dashboardData.checklist.completados}/${dashboardData.checklist.total}`}
          icon={ClipboardList}
          description={`${pctChecklist}% completado`}
          trend={{ value: pctChecklist, isPositive: pctChecklist >= 70 }}
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
              {isLoading ? (
                <div className="text-sm text-muted-foreground p-4">Cargando órdenes recientes...</div>
              ) : isError ? (
                <div className="text-sm text-destructive p-4">No se pudieron cargar las órdenes recientes.</div>
              ) : dashboardData.recentOrders.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4">No hay órdenes recientes.</div>
              ) : (
                dashboardData.recentOrders.map((order) => (
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
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Checklist del Día */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Checklist del Día
            </CardTitle>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-semibold text-foreground">{pctChecklist}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted">
                <div
                  className="h-2.5 rounded-full bg-primary transition-all"
                  style={{ width: `${pctChecklist}%` }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="text-sm text-muted-foreground p-2">Cargando checklist...</div>
            ) : isError ? (
              <div className="text-sm text-destructive p-2">No se pudo cargar el checklist.</div>
            ) : dashboardData.checklist.detalle.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2">No hay máquinas para mostrar.</div>
            ) : (
              dashboardData.checklist.detalle.map((v) => (
                <div key={`${v.placa}-${v.nombre}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{v.nombre}</p>
                    <p className="text-xs text-muted-foreground">{v.placa}</p>
                  </div>
                  <Badge className={v.completado ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                    {v.completado ? "Completado" : "Pendiente"}
                  </Badge>
                </div>
              ))
            )}
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
            <div className="text-4xl font-bold text-success mb-2">{dashboardData.statusOverview.completadasHoy}</div>
            <p className="text-sm text-muted-foreground">Órdenes finalizadas</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-center text-warning">En Progreso</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-warning mb-2">{dashboardData.statusOverview.enProgreso}</div>
            <p className="text-sm text-muted-foreground">Órdenes activas</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-center text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-muted-foreground mb-2">{dashboardData.statusOverview.pendientes}</div>
            <p className="text-sm text-muted-foreground">Esperando asignación</p>
          </CardContent>
        </Card>
      </div>

      <NuevaOrdenModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}

export default Dashboard