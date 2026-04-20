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
  Package,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Truck
} from "lucide-react"

const Inventario = () => {
  const inventario = [
    {
      id: "INV-001",
      nombre: "Filtro hidráulico de alta presión",
      categoria: "Filtros",
      stock: 15,
      stockMinimo: 10,
      precio: 45.50,
      proveedor: "Caterpillar Inc.",
      ubicacion: "A-1-3",
      estado: "Disponible"
    },
    {
      id: "INV-002", 
      nombre: "Aceite hidráulico ISO 46",
      categoria: "Lubricantes",
      stock: 3,
      stockMinimo: 5,
      precio: 89.99,
      proveedor: "Shell Colombia",
      ubicacion: "B-2-1",
      estado: "Stock Bajo"
    },
    {
      id: "INV-003",
      nombre: "Bomba de combustible eléctrica",
      categoria: "Componentes",
      stock: 8,
      stockMinimo: 3,
      precio: 320.00,
      proveedor: "Bosch Automotive",
      ubicacion: "C-1-5",
      estado: "Disponible"
    },
    {
      id: "INV-004",
      nombre: "Kit de sellos y empaques",
      categoria: "Repuestos",
      stock: 0,
      stockMinimo: 8,
      precio: 125.75,
      proveedor: "Komatsu Parts",
      ubicacion: "D-3-2",
      estado: "Agotado"
    },
    {
      id: "INV-005",
      nombre: "Sensor de temperatura",
      categoria: "Electrónicos",
      stock: 12,
      stockMinimo: 5,
      precio: 78.30,
      proveedor: "Siemens AG",
      ubicacion: "E-1-4",
      estado: "Disponible"
    },
    {
      id: "INV-006",
      nombre: "Correa de transmisión",
      categoria: "Correas",
      stock: 2,
      stockMinimo: 6,
      precio: 95.25,
      proveedor: "Gates Corporation",
      ubicacion: "F-2-3",
      estado: "Stock Bajo"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disponible": return "bg-success text-success-foreground"
      case "Stock Bajo": return "bg-warning text-warning-foreground"
      case "Agotado": return "bg-destructive text-destructive-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case "Filtros": return Package
      case "Lubricantes": return Package
      case "Componentes": return Wrench
      case "Repuestos": return Wrench
      case "Electrónicos": return CheckCircle
      case "Correas": return Package
      default: return Package
    }
  }

  const disponibles = inventario.filter(item => item.estado === "Disponible").length
  const stockBajo = inventario.filter(item => item.estado === "Stock Bajo").length
  const agotados = inventario.filter(item => item.estado === "Agotado").length
  const valorTotal = inventario.reduce((total, item) => total + (item.stock * item.precio), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventario</h1>
          <p className="text-muted-foreground">Gestión de repuestos y suministros</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Artículo
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Artículos Disponibles"
          value={disponibles}
          icon={Package}
          description="En stock"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Stock Bajo"
          value={stockBajo}
          icon={AlertTriangle}
          description="Requieren reposición"
          trend={{ value: -2, isPositive: false }}
        />
        <StatCard
          title="Agotados"
          value={agotados}
          icon={Truck}
          description="Sin existencias"
          trend={{ value: 1, isPositive: false }}
        />
        <StatCard
          title="Valor Total"
          value={`$${valorTotal.toLocaleString()}`}
          icon={CheckCircle}
          description="Inventario total"
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, código, categoría..." 
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

      {/* Inventory Table */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Lista de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Artículo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Stock Min</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventario.map((item) => {
                const IconComponent = getCategoryIcon(item.categoria)
                return (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-primary">{item.nombre}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <IconComponent className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground">{item.categoria}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="font-medium">{item.stock} uds</span>
                        <div className="w-20 bg-muted rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full transition-all ${
                              item.stock > item.stockMinimo 
                                ? 'bg-success' 
                                : item.stock > 0 
                                  ? 'bg-warning' 
                                  : 'bg-destructive'
                            }`}
                            style={{ width: `${Math.min((item.stock / (item.stockMinimo * 2)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{item.stockMinimo} uds</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${item.precio}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{item.ubicacion}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{item.proveedor}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.estado)}>
                        {item.estado}
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
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default Inventario