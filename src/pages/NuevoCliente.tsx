import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Building,
  Users,
  Crown,
  Save,
  ArrowLeft,
  Mail,
  MapPin,
  Globe,
  Phone,
  Calendar,
  CreditCard
} from "lucide-react"

const NuevoCliente = () => {
  const planes = [
    {
      nombre: "Basic",
      precio: "$299/mes",
      usuarios: "Hasta 10 usuarios",
      proyectos: "Hasta 5 proyectos",
      caracteristicas: ["Dashboard básico", "Gestión de órdenes", "Soporte email"]
    },
    {
      nombre: "Professional", 
      precio: "$599/mes",
      usuarios: "Hasta 50 usuarios",
      proyectos: "Hasta 25 proyectos", 
      caracteristicas: ["Todas las funciones Basic", "Inventario avanzado", "Reportes", "Soporte 24/7"]
    },
    {
      nombre: "Enterprise",
      precio: "$1,199/mes", 
      usuarios: "Usuarios ilimitados",
      proyectos: "Proyectos ilimitados",
      caracteristicas: ["Todas las funciones Pro", "API personalizada", "Integraciones", "Gerente de cuenta dedicado"]
    }
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Clientes
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nuevo Cliente</h1>
          <p className="text-muted-foreground">Configuración Multi-Tenant - Crear Organización</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Cliente */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Información de la Organización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Empresa *</Label>
                  <Input id="nombre" placeholder="Ej: Constructora Horizonte S.A." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industria">Tipo de Industria *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar industria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construccion">Construcción</SelectItem>
                      <SelectItem value="mineria">Minería</SelectItem>
                      <SelectItem value="petroleo">Petróleo y Gas</SelectItem>
                      <SelectItem value="infraestructura">Infraestructura</SelectItem>
                      <SelectItem value="agroindustria">Agroindustria</SelectItem>
                      <SelectItem value="manufactura">Manufactura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pais">País *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colombia">Colombia</SelectItem>
                      <SelectItem value="mexico">México</SelectItem>
                      <SelectItem value="chile">Chile</SelectItem>
                      <SelectItem value="peru">Perú</SelectItem>
                      <SelectItem value="ecuador">Ecuador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad *</Label>
                  <Input id="ciudad" placeholder="Ej: Bogotá" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" placeholder="+57 1 234 5678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sitioWeb">Sitio Web</Label>
                  <Input id="sitioWeb" placeholder="https://empresa.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea 
                  id="descripcion" 
                  placeholder="Breve descripción de la empresa y sus servicios..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Administrador Principal */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-accent" />
                Administrador Principal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminNombre">Nombre Completo *</Label>
                  <Input id="adminNombre" placeholder="Ej: Carlos Mendoza" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email *</Label>
                  <Input id="adminEmail" type="email" placeholder="admin@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminCargo">Cargo</Label>
                  <Input id="adminCargo" placeholder="Ej: Gerente de Operaciones" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminTelefono">Teléfono</Label>
                  <Input id="adminTelefono" placeholder="+57 300 123 4567" />
                </div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Crown className="w-4 h-4 text-accent" />
                  <span>Este usuario tendrá permisos completos para gestionar su organización</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Selección de Plan */}
        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Plan de Suscripción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {planes.map((plan, index) => (
                <div 
                  key={plan.nombre} 
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    index === 1 ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{plan.nombre}</h3>
                    {index === 1 && <Badge className="bg-primary text-primary-foreground">Recomendado</Badge>}
                  </div>
                  <p className="text-2xl font-bold text-primary mb-2">{plan.precio}</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{plan.usuarios}</p>
                    <p>{plan.proyectos}</p>
                  </div>
                  <div className="mt-3 space-y-1">
                    {plan.caracteristicas.map((caracteristica, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <span>{caracteristica}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Resumen de Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan seleccionado:</span>
                <span className="font-medium">Professional</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fecha de inicio:</span>
                <span className="font-medium">Inmediato</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Período de prueba:</span>
                <span className="font-medium">14 días gratis</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-medium">Total mensual:</span>
                  <span className="text-xl font-bold text-primary">$599</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="space-y-3">
            <Button className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all">
              <Save className="w-4 h-4 mr-2" />
              Crear Cliente
            </Button>
            <Button variant="outline" className="w-full">
              Guardar como Borrador
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NuevoCliente