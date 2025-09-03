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
import { Plus, Save, Trash2 } from "lucide-react"

interface NuevaOrdenModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Actividad {
  id: string
  descripcion: string
  tecnico1: string
  tecnico2: string
  servicioExterno: string
  fecha: string
  horaInicio: string
  horaFin: string
}

const NuevaOrdenModal = ({ open, onOpenChange }: NuevaOrdenModalProps) => {
  const [folioOT, setFolioOT] = useState("")
  const [maquina, setMaquina] = useState("")
  const [serie, setSerie] = useState("")
  const [ubicacion, setUbicacion] = useState("")
  const [horometro, setHorometro] = useState("")
  const [fallaDescripcion, setFallaDescripcion] = useState("")
  const [actividades, setActividades] = useState<Actividad[]>([])

  const [nuevaActividad, setNuevaActividad] = useState<Actividad>({
    id: "",
    descripcion: "",
    tecnico1: "",
    tecnico2: "",
    servicioExterno: "",
    fecha: "",
    horaInicio: "",
    horaFin: ""
  })

  const agregarActividad = () => {
    if (nuevaActividad.descripcion) {
      setActividades([...actividades, { ...nuevaActividad, id: Date.now().toString() }])
      setNuevaActividad({
        id: "",
        descripcion: "",
        tecnico1: "",
        tecnico2: "",
        servicioExterno: "",
        fecha: "",
        horaInicio: "",
        horaFin: ""
      })
    }
  }

  const eliminarActividad = (id: string) => {
    setActividades(actividades.filter(act => act.id !== id))
  }

  const generarOT = () => {
    // Aquí iría la lógica para generar la OT
    console.log("Generando OT:", {
      folioOT,
      maquina,
      serie,
      ubicacion,
      horometro,
      fallaDescripcion,
      actividades
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
              <CardTitle className="text-lg">Información de la Máquina</CardTitle>
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
                <Label htmlFor="maquina">MÁQUINA</Label>
                <Input
                  id="maquina"
                  value={maquina}
                  onChange={(e) => setMaquina(e.target.value)}
                  placeholder="TRITURADORA POWESCREEN"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serie">SERIE</Label>
                <Input
                  id="serie"
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  placeholder="XXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ubicacion">UBICACIÓN</Label>
                <Input
                  id="ubicacion"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Ubicación de la máquina"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horometro">HORÓMETRO</Label>
                <Input
                  id="horometro"
                  value={horometro}
                  onChange={(e) => setHorometro(e.target.value)}
                  placeholder="XXXXXXX"
                />
              </div>
            </CardContent>
          </Card>

          {/* Falla o descripción */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">FALLA O DESCRIPCIÓN</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={fallaDescripcion}
                onChange={(e) => setFallaDescripcion(e.target.value)}
                placeholder="EQUIPO CON FALLA ELECTRICA Y VARIASFUGAS"
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
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={nuevaActividad.descripcion}
                    onChange={(e) => setNuevaActividad({...nuevaActividad, descripcion: e.target.value})}
                    placeholder="SE REVISA CABLEADO ETC ETC ETC"
                    className="min-h-16"
                  />
                </div>
                <div className="space-y-2">
                  <Label>TÉCNICO 1</Label>
                  <Select onValueChange={(value) => setNuevaActividad({...nuevaActividad, tecnico1: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carlos">Carlos Rodríguez</SelectItem>
                      <SelectItem value="ana">Ana Martínez</SelectItem>
                      <SelectItem value="roberto">Roberto Silva</SelectItem>
                      <SelectItem value="luis">Luis Fernández</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>TÉCNICO 2</Label>
                  <Select onValueChange={(value) => setNuevaActividad({...nuevaActividad, tecnico2: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carlos">Carlos Rodríguez</SelectItem>
                      <SelectItem value="ana">Ana Martínez</SelectItem>
                      <SelectItem value="roberto">Roberto Silva</SelectItem>
                      <SelectItem value="luis">Luis Fernández</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>SERVICIO EXTERNO</Label>
                  <Select onValueChange={(value) => setNuevaActividad({...nuevaActividad, servicioExterno: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proveedor1">TecnoServ S.A.</SelectItem>
                      <SelectItem value="proveedor2">MecánicaPro LTDA</SelectItem>
                      <SelectItem value="proveedor3">HidráulicoExpert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>FECHA</Label>
                  <Input
                    type="date"
                    value={nuevaActividad.fecha}
                    onChange={(e) => setNuevaActividad({...nuevaActividad, fecha: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>HORA INIC</Label>
                  <Input
                    type="time"
                    value={nuevaActividad.horaInicio}
                    onChange={(e) => setNuevaActividad({...nuevaActividad, horaInicio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>HORA FIN</Label>
                  <Input
                    type="time"
                    value={nuevaActividad.horaFin}
                    onChange={(e) => setNuevaActividad({...nuevaActividad, horaFin: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={agregarActividad} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar MO
                  </Button>
                </div>
              </div>

              {/* Tabla de actividades */}
              {actividades.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ACTIVIDADES FECHA</TableHead>
                      <TableHead>TÉCNICO 1</TableHead>
                      <TableHead>TÉCNICO 2</TableHead>
                      <TableHead>SERVICIO EXTERNO</TableHead>
                      <TableHead>HORA INIC</TableHead>
                      <TableHead>HORA FIN</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actividades.map((actividad) => (
                      <TableRow key={actividad.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{actividad.descripcion}</p>
                            <p className="text-sm text-muted-foreground">{actividad.fecha}</p>
                          </div>
                        </TableCell>
                        <TableCell>{actividad.tecnico1}</TableCell>
                        <TableCell>{actividad.tecnico2}</TableCell>
                        <TableCell>{actividad.servicioExterno}</TableCell>
                        <TableCell>{actividad.horaInicio}</TableCell>
                        <TableCell>{actividad.horaFin}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => eliminarActividad(actividad.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
              Guardar
            </Button>
            <Button className="bg-accent text-accent-foreground">
              GENERAR OT
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NuevaOrdenModal