import { useState } from "react";
import { Search, ClipboardCheck, Truck, Calendar, User, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const maquinas = [
  { id: 1, nombre: "Excavadora CAT 320", tipo: "Excavadora", placas: "MX-123-ABC", estado: "Operativa" },
  { id: 2, nombre: "Grúa Tower Crane 50", tipo: "Grúa", placas: "MX-456-DEF", estado: "Operativa" },
  { id: 3, nombre: "Bulldozer D6", tipo: "Bulldozer", placas: "MX-789-GHI", estado: "Mantenimiento" },
  { id: 4, nombre: "Pavimentadora P385", tipo: "Pavimentadora", placas: "MX-101-JKL", estado: "Operativa" },
  { id: 5, nombre: "Compactadora CS-533", tipo: "Compactadora", placas: "MX-202-MNO", estado: "Operativa" },
  { id: 6, nombre: "Montacargas FL-200", tipo: "Montacargas", placas: "MX-303-PQR", estado: "Disponible" },
];

const checklistItems = [
  { id: "kilometraje", label: "Kilometraje", type: "number" as const, unit: "km" },
  { id: "horometro", label: "Horómetro", type: "number" as const, unit: "hrs" },
  { id: "nivelAceite", label: "Nivel de aceite del motor", type: "check" as const },
  { id: "nivelRefrigerante", label: "Nivel de refrigerante", type: "check" as const },
  { id: "nivelHidraulico", label: "Nivel de aceite hidráulico", type: "check" as const },
  { id: "nivelCombustible", label: "Nivel de combustible", type: "check" as const },
  { id: "presionLlantas", label: "Presión de llantas / orugas", type: "check" as const },
  { id: "estadoLlantas", label: "Estado de llantas / orugas", type: "check" as const },
  { id: "luces", label: "Luces de trabajo y señalización", type: "check" as const },
  { id: "espejos", label: "Espejos retrovisores", type: "check" as const },
  { id: "alarmaReversa", label: "Alarma de reversa", type: "check" as const },
  { id: "cinturonSeguridad", label: "Cinturón de seguridad", type: "check" as const },
  { id: "extintor", label: "Extintor presente y vigente", type: "check" as const },
  { id: "frenos", label: "Frenos de servicio y estacionamiento", type: "check" as const },
  { id: "direccion", label: "Sistema de dirección", type: "check" as const },
  { id: "fugasAceite", label: "Sin fugas de aceite", type: "check" as const },
  { id: "fugasRefrigerante", label: "Sin fugas de refrigerante", type: "check" as const },
  { id: "estadoMangueras", label: "Estado de mangueras hidráulicas", type: "check" as const },
  { id: "limpiezaCabina", label: "Limpieza general de cabina", type: "check" as const },
  { id: "instrumentos", label: "Instrumentos del tablero funcionando", type: "check" as const },
];

// Historial de ejemplo
const historialChecklist = [
  {
    id: 1, maquinaId: 1, fecha: "2026-03-04", operador: "Juan Pérez", trabajadorAsignado: "Roberto Sánchez",
    kilometraje: 12450, horometro: 2340, itemsOk: 18, itemsTotal: 18, observaciones: "Todo en orden", notas: "Se entregó limpia y con tanque lleno"
  },
  {
    id: 2, maquinaId: 1, fecha: "2026-03-03", operador: "Carlos López", trabajadorAsignado: "Juan Pérez",
    kilometraje: 12380, horometro: 2332, itemsOk: 17, itemsTotal: 18, observaciones: "Fuga menor de aceite reportada", notas: ""
  },
  {
    id: 3, maquinaId: 1, fecha: "2026-03-02", operador: "Juan Pérez", trabajadorAsignado: "Carlos López",
    kilometraje: 12310, horometro: 2324, itemsOk: 18, itemsTotal: 18, observaciones: "", notas: "Cambio de turno sin novedad"
  },
  {
    id: 4, maquinaId: 1, fecha: "2026-03-01", operador: "Miguel Ramírez", trabajadorAsignado: "Pedro García",
    kilometraje: 12240, horometro: 2316, itemsOk: 16, itemsTotal: 18, observaciones: "Presión de llantas baja, luces traseras con falla", notas: "Se reportó a mantenimiento"
  },
  {
    id: 5, maquinaId: 2, fecha: "2026-03-04", operador: "Pedro García", trabajadorAsignado: "Miguel Ramírez",
    kilometraje: 8900, horometro: 1650, itemsOk: 18, itemsTotal: 18, observaciones: "", notas: ""
  },
  {
    id: 6, maquinaId: 2, fecha: "2026-03-03", operador: "Pedro García", trabajadorAsignado: "Roberto Sánchez",
    kilometraje: 8840, horometro: 1642, itemsOk: 17, itemsTotal: 18, observaciones: "Extintor próximo a vencer", notas: "Solicitar reemplazo de extintor"
  },
];

export default function Checklist() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaquina, setSelectedMaquina] = useState<typeof maquinas[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [numericValues, setNumericValues] = useState<Record<string, string>>({});
  const [operador, setOperador] = useState("");
  const [trabajadorAsignado, setTrabajadorAsignado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [notas, setNotas] = useState("");

  const filteredMaquinas = maquinas.filter((m) =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.placas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenChecklist = (maquina: typeof maquinas[0]) => {
    setSelectedMaquina(maquina);
    setCheckedItems({});
    setNumericValues({});
    setOperador("");
    setTrabajadorAsignado("");
    setObservaciones("");
    setNotas("");
    setIsModalOpen(true);
  };

  const handleToggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmitChecklist = () => {
    console.log("Checklist enviado:", {
      maquina: selectedMaquina?.nombre,
      operador,
      trabajadorAsignado,
      numericValues,
      checkedItems,
      observaciones,
      notas,
    });
    setIsModalOpen(false);
  };

  const getHistorial = (maquinaId: number) =>
    historialChecklist.filter((h) => h.maquinaId === maquinaId);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Operativa": return "bg-green-100 text-green-800";
      case "Disponible": return "bg-blue-100 text-blue-800";
      case "Mantenimiento": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const hasChecklistToday = (maquinaId: number) =>
    historialChecklist.some((h) => h.maquinaId === maquinaId && h.fecha === todayStr);

  const totalChecks = checklistItems.filter((i) => i.type === "check").length;
  const completedChecks = checklistItems.filter((i) => i.type === "check" && checkedItems[i.id]).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Checklist Diario</h1>
        <p className="text-gray-600 mt-1">Inspección diaria de vehículos y máquinas</p>
      </div>

      {/* Buscar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar máquina por nombre, tipo o placas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de máquinas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaquinas.map((maquina) => {
          const done = hasChecklistToday(maquina.id);
          return (
            <Card
              key={maquina.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
              style={{ borderLeftColor: done ? "#16a34a" : "#d97706" }}
              onClick={() => handleOpenChecklist(maquina)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{maquina.nombre}</h3>
                      <p className="text-sm text-gray-500">{maquina.tipo} · {maquina.placas}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge className={getEstadoColor(maquina.estado)}>{maquina.estado}</Badge>
                  {done ? (
                    <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                      <ClipboardCheck className="h-3.5 w-3.5" /> Completado hoy
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600">Pendiente hoy</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de Checklist */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              Checklist — {selectedMaquina?.nombre}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              {selectedMaquina?.tipo} · {selectedMaquina?.placas}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pb-6">
              {/* Col 1: Datos generales */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Operador
                  </Label>
                  <Input placeholder="Nombre del operador" value={operador} onChange={(e) => setOperador(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Trabajador Asignado
                  </Label>
                  <Select value={trabajadorAsignado || undefined} onValueChange={(val) => setTrabajadorAsignado(val === "none" ? "" : val)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar trabajador..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      <SelectItem value="Juan Pérez">Juan Pérez</SelectItem>
                      <SelectItem value="Carlos López">Carlos López</SelectItem>
                      <SelectItem value="Roberto Sánchez">Roberto Sánchez</SelectItem>
                      <SelectItem value="Pedro García">Pedro García</SelectItem>
                      <SelectItem value="Miguel Ramírez">Miguel Ramírez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {checklistItems.filter((item) => item.type === "number").map((item) => (
                    <div key={item.id} className="space-y-2">
                      <Label>{item.label} ({item.unit})</Label>
                      <Input type="number" placeholder={`Ingrese ${item.label.toLowerCase()}`} value={numericValues[item.id] || ""} onChange={(e) => setNumericValues((prev) => ({ ...prev, [item.id]: e.target.value }))} />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <textarea className="w-full rounded-md border border-input bg-background p-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Observaciones sobre el estado de la máquina..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <textarea className="w-full rounded-md border border-input bg-background p-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Notas adicionales..." value={notas} onChange={(e) => setNotas(e.target.value)} />
                </div>
              </div>

              {/* Col 2: Puntos de inspección */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Puntos de Inspección</h3>
                  <span className="text-sm text-muted-foreground">{completedChecks}/{totalChecks} revisados</span>
                </div>
                <div className="space-y-1">
                  {checklistItems.filter((item) => item.type === "check").map((item) => (
                    <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <Checkbox checked={!!checkedItems[item.id]} onCheckedChange={() => handleToggleItem(item.id)} />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Botón guardar */}
            <div className="pb-4">
              <Button className="w-full" onClick={handleSubmitChecklist}>Guardar Checklist</Button>
            </div>

            <Separator />

            {/* Historial */}
            <div className="pb-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Historial de Checklist
              </h3>
              {selectedMaquina && getHistorial(selectedMaquina.id).length > 0 ? (
                <div className="space-y-3">
                  {getHistorial(selectedMaquina.id).map((registro) => (
                    <div key={registro.id} className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-foreground">{registro.fecha}</span>
                        <Badge className={registro.itemsOk === registro.itemsTotal ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                          {registro.itemsOk}/{registro.itemsTotal} OK
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground"><span className="font-medium">Operador:</span> {registro.operador}</p>
                      <p className="text-sm text-muted-foreground"><span className="font-medium">Asignado a:</span> {registro.trabajadorAsignado}</p>
                      <p className="text-sm text-muted-foreground">Km: {registro.kilometraje.toLocaleString()} · Hrs: {registro.horometro.toLocaleString()}</p>
                      {registro.observaciones && <p className="text-sm text-warning mt-1 italic"><span className="font-medium">Obs:</span> {registro.observaciones}</p>}
                      {registro.notas && <p className="text-sm text-primary mt-1 italic"><span className="font-medium">Notas:</span> {registro.notas}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin registros previos.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
