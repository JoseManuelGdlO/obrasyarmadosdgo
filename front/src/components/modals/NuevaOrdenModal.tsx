import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Save, Trash2, X, Package, Users } from "lucide-react"
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton"

interface NuevaOrdenModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Maquina {
  id: string
  nombre: string
  serie: string
  ubicacion: string
  horometro: string
}

interface Actividad {
  id: string
  descripcion: string
  tecnicos: string[]
  horaInicio: string
  horaFin: string
}

interface ItemInventario {
  id: string
  producto: string
  cantidad: number
  unidad: string
}

const NuevaOrdenModal = ({ open, onOpenChange }: NuevaOrdenModalProps) => {
  const [folioOT, setFolioOT] = useState("")
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState<Maquina | null>(null)
  const [nomenclaturaSeleccionada, setNomenclaturaSeleccionada] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [inventario, setInventario] = useState<ItemInventario[]>([])

  // Estados para proveedor externo
  const [necesitaProveedorExterno, setNecesitaProveedorExterno] = useState(false)
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("")
  const [descripcionProveedor, setDescripcionProveedor] = useState("")

  const [nuevaActividad, setNuevaActividad] = useState<Actividad>({
    id: "",
    descripcion: "",
    tecnicos: [],
    horaInicio: "",
    horaFin: ""
  })

  const [tecnicoTemp, setTecnicoTemp] = useState("")
  const [productoTemp, setProductoTemp] = useState("")
  const [cantidadTemp, setCantidadTemp] = useState("")

  // Datos de ejemplo
  const maquinasDisponibles: Maquina[] = [
    { id: "1", nombre: "TRITURADORA POWESCREEN", serie: "PWS-2024-001", ubicacion: "Sector A", horometro: "1,245" },
    { id: "2", nombre: "EXCAVADORA CAT 320", serie: "CAT-320-002", ubicacion: "Sector B", horometro: "2,180" },
    { id: "3", nombre: "BULLDOZER D6T", serie: "D6T-003", ubicacion: "Sector C", horometro: "3,500" },
  ]

  const tecnicosDisponibles = [
    { id: "carlos", nombre: "Carlos Rodríguez" },
    { id: "ana", nombre: "Ana Martínez" },
    { id: "roberto", nombre: "Roberto Silva" },
    { id: "luis", nombre: "Luis Fernández" },
  ]

  const productosInventario = [
    { id: "1", nombre: "Filtro de aceite", unidad: "pza" },
    { id: "2", nombre: "Aceite hidráulico", unidad: "lt" },
    { id: "3", nombre: "Grasa multiuso", unidad: "kg" },
    { id: "4", nombre: "Correa de transmisión", unidad: "pza" },
  ]

  const proveedoresDisponibles = [
    { id: "1", nombre: "Servicios Industriales SA" },
    { id: "2", nombre: "Mantenimiento Especializado Ltda" },
    { id: "3", nombre: "Técnicos Unidos SRL" },
    { id: "4", nombre: "Reparaciones Mineras SA" },
  ]

  const nomenclaturasDisponibles = [
    { id: "1", codigo: "MCU", descripcion: "MANTENIMIENTO CORRECTIVO URGENTE" },
    { id: "2", codigo: "MCP", descripcion: "MANTENIMIENTO CORRECTIVO PROGRAMADO" },
    { id: "3", codigo: "MPR", descripcion: "MANTENIMIENTO PREVENTIVO RUTINARIO" },
    { id: "4", codigo: "INS", descripcion: "INSPECCIÓN DE SEGURIDAD" },
    { id: "5", codigo: "REP", descripcion: "REPARACIÓN GENERAL" },
  ]

  const agregarActividad = () => {
    if (nuevaActividad.descripcion && nuevaActividad.horaInicio && nuevaActividad.horaFin) {
      setActividades([...actividades, { ...nuevaActividad, id: Date.now().toString() }])
      setNuevaActividad({
        id: "",
        descripcion: "",
        tecnicos: [],
        horaInicio: "",
        horaFin: ""
      })
    }
  }

  const eliminarActividad = (id: string) => {
    setActividades(actividades.filter(act => act.id !== id))
  }

  const agregarTecnicoAActividad = () => {
    if (tecnicoTemp && !nuevaActividad.tecnicos.includes(tecnicoTemp)) {
      setNuevaActividad({
        ...nuevaActividad,
        tecnicos: [...nuevaActividad.tecnicos, tecnicoTemp]
      })
      setTecnicoTemp("")
    }
  }

  const eliminarTecnicoDeActividad = (tecnico: string) => {
    setNuevaActividad({
      ...nuevaActividad,
      tecnicos: nuevaActividad.tecnicos.filter(t => t !== tecnico)
    })
  }

  const agregarProductoInventario = () => {
    const producto = productosInventario.find(p => p.id === productoTemp)
    if (producto && cantidadTemp && !inventario.find(i => i.producto === producto.nombre)) {
      setInventario([...inventario, {
        id: Date.now().toString(),
        producto: producto.nombre,
        cantidad: parseInt(cantidadTemp),
        unidad: producto.unidad
      }])
      setProductoTemp("")
      setCantidadTemp("")
    }
  }

  const eliminarProductoInventario = (id: string) => {
    setInventario(inventario.filter(item => item.id !== id))
  }

  const generarOT = () => {
    console.log("Generando OT:", {
      folioOT,
      nomenclatura: nomenclaturaSeleccionada,
      maquina: maquinaSeleccionada,
      descripcion,
      actividades,
      inventario,
      proveedorExterno: necesitaProveedorExterno ? {
        proveedor: proveedorSeleccionado,
        descripcion: descripcionProveedor
      } : null
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge className="bg-destructive text-destructive-foreground">HOJA 2</Badge>
            <span>FOLIO DE ORDEN DE TRABAJO</span>
            <Badge className="bg-primary text-primary-foreground ml-auto">LOGMINE</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Orden</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="folio">Folio OT</Label>
                <Input
                  id="folio"
                  value={folioOT}
                  onChange={(e) => setFolioOT(e.target.value)}
                  placeholder="OT-2024-XXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomenclatura">Tipo de Orden</Label>
                <Select onValueChange={setNomenclaturaSeleccionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nomenclatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {nomenclaturasDisponibles.map((nomenclatura) => (
                      <SelectItem key={nomenclatura.id} value={nomenclatura.id}>
                        {nomenclatura.codigo} - {nomenclatura.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="maquina">Seleccionar Máquina</Label>
                <Select onValueChange={(value) => {
                  const maquina = maquinasDisponibles.find(m => m.id === value)
                  setMaquinaSeleccionada(maquina || null)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar máquina" />
                  </SelectTrigger>
                  <SelectContent>
                    {maquinasDisponibles.map((maquina) => (
                      <SelectItem key={maquina.id} value={maquina.id}>
                        {maquina.nombre} - {maquina.serie}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {maquinaSeleccionada && (
                <>
                  <div className="space-y-2">
                    <Label>Serie</Label>
                    <Input value={maquinaSeleccionada.serie} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación</Label>
                    <Input value={maquinaSeleccionada.ubicacion} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Horómetro</Label>
                    <Input value={maquinaSeleccionada.horometro} readOnly className="bg-muted" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Descripción */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">DESCRIPCIÓN DEL PROBLEMA</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción detallada del problema o falla..."
                className="min-h-20"
              />
            </CardContent>
          </Card>

          {/* Actividades */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ACTIVIDADES</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulario para nueva actividad */}
              <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                <div className="space-y-2">
                  <Label>Descripción de la Actividad</Label>
                  <Textarea
                    value={nuevaActividad.descripcion}
                    onChange={(e) => setNuevaActividad({...nuevaActividad, descripcion: e.target.value})}
                    placeholder="Descripción de la actividad a realizar..."
                    className="min-h-16"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora Inicio</Label>
                    <Input
                      type="time"
                      value={nuevaActividad.horaInicio}
                      onChange={(e) => setNuevaActividad({...nuevaActividad, horaInicio: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Fin</Label>
                    <Input
                      type="time"
                      value={nuevaActividad.horaFin}
                      onChange={(e) => setNuevaActividad({...nuevaActividad, horaFin: e.target.value})}
                    />
                  </div>
                </div>

                {/* Técnicos */}
                <div className="space-y-2">
                  <Label>Técnicos Asignados</Label>
                  <div className="flex gap-2">
                    <Select value={tecnicoTemp} onValueChange={setTecnicoTemp}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar técnico" />
                      </SelectTrigger>
                      <SelectContent>
                        {tecnicosDisponibles.map((tecnico) => (
                          <SelectItem key={tecnico.id} value={tecnico.id}>
                            {tecnico.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={agregarTecnicoAActividad} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {nuevaActividad.tecnicos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {nuevaActividad.tecnicos.map((tecnicoId) => {
                        const tecnico = tecnicosDisponibles.find(t => t.id === tecnicoId)
                        return (
                          <Badge key={tecnicoId} variant="secondary" className="flex items-center gap-1">
                            {tecnico?.nombre}
                            <X 
                              className="w-3 h-3 cursor-pointer" 
                              onClick={() => eliminarTecnicoDeActividad(tecnicoId)}
                            />
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                <Button onClick={agregarActividad} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Actividad
                </Button>
              </div>

              {/* Lista de actividades */}
              {actividades.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Técnicos</TableHead>
                      <TableHead>Hora Inicio</TableHead>
                      <TableHead>Hora Fin</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actividades.map((actividad) => (
                      <TableRow key={actividad.id}>
                        <TableCell className="max-w-xs">
                          <p className="text-sm">{actividad.descripcion}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {actividad.tecnicos.map((tecnicoId) => {
                              const tecnico = tecnicosDisponibles.find(t => t.id === tecnicoId)
                              return (
                                <Badge key={tecnicoId} variant="outline" className="text-xs">
                                  {tecnico?.nombre}
                                </Badge>
                              )
                            })}
                          </div>
                        </TableCell>
                        <TableCell>{actividad.horaInicio}</TableCell>
                        <TableCell>{actividad.horaFin}</TableCell>
                        <TableCell>
                          <ConfirmDeleteButton
                            variant="destructive"
                            size="sm"
                            title="¿Eliminar actividad?"
                            description="Esta actividad se quitará de la orden de trabajo."
                            onConfirm={() => eliminarActividad(actividad.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </ConfirmDeleteButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Proveedor Externo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                PROVEEDOR EXTERNO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="necesita-proveedor"
                  checked={necesitaProveedorExterno}
                  onCheckedChange={(checked) => {
                    setNecesitaProveedorExterno(checked as boolean)
                    if (!checked) {
                      setProveedorSeleccionado("")
                      setDescripcionProveedor("")
                    }
                  }}
                />
                <Label htmlFor="necesita-proveedor" className="text-sm font-medium">
                  Necesita proveedor externo
                </Label>
              </div>
              
              {necesitaProveedorExterno && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label>Seleccionar Proveedor</Label>
                    <Select value={proveedorSeleccionado} onValueChange={setProveedorSeleccionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {proveedoresDisponibles.map((proveedor) => (
                          <SelectItem key={proveedor.id} value={proveedor.id}>
                            {proveedor.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción del Trabajo</Label>
                    <Textarea
                      value={descripcionProveedor}
                      onChange={(e) => setDescripcionProveedor(e.target.value)}
                      placeholder="Descripción del trabajo que realizará el proveedor externo..."
                      className="min-h-20"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                INVENTARIO NECESARIO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label>Producto</Label>
                  <Select value={productoTemp} onValueChange={setProductoTemp}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productosInventario.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id}>
                          {producto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={cantidadTemp}
                    onChange={(e) => setCantidadTemp(e.target.value)}
                    placeholder="0"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidad</Label>
                  <Input
                    value={productoTemp ? productosInventario.find(p => p.id === productoTemp)?.unidad || "" : ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={agregarProductoInventario} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              {inventario.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventario.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.producto}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>{item.unidad}</TableCell>
                        <TableCell>
                          <ConfirmDeleteButton
                            variant="destructive"
                            size="sm"
                            title="¿Eliminar producto?"
                            description="Este producto se quitará del inventario necesario de la orden."
                            onConfirm={() => eliminarProductoInventario(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </ConfirmDeleteButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={generarOT} className="bg-gradient-to-r from-primary to-accent text-white">
              <Save className="w-4 h-4 mr-2" />
              Guardar Orden de Trabajo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NuevaOrdenModal