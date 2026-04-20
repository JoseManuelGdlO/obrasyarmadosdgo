import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardCheck, Save, CheckCircle2, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logoObras from "@/assets/logo-obras.png";

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

const trabajadores = [
  "Juan Pérez", "Carlos López", "Pedro García", "Miguel Ramírez", "Roberto Sánchez",
  "Fernando Hernández", "Luis Martínez", "José Rodríguez"
];

interface MaquinaData {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
  placas: string;
  serie: string;
}

export default function ChecklistPublico() {
  const [searchParams] = useSearchParams();
  const [maquina, setMaquina] = useState<MaquinaData | null>(null);
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [operador, setOperador] = useState("");
  const [trabajadorAsignado, setTrabajadorAsignado] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [numericValues, setNumericValues] = useState<Record<string, string>>({});
  const [observaciones, setObservaciones] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    const data = searchParams.get("data");
    if (data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(data));
        if (parsed.id && parsed.nombre) {
          setMaquina(parsed);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    } else {
      setError(true);
    }
  }, [searchParams]);

  const handleToggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkItems = checklistItems.filter((i) => i.type === "check");
  const numericItems = checklistItems.filter((i) => i.type === "number");
  const completedChecks = checkItems.filter((i) => checkedItems[i.id]).length;
  const totalChecks = checkItems.length;
  const progress = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

  const handleSubmit = () => {
    if (!operador.trim()) {
      toast.error("Por favor ingresa el nombre del operador");
      return;
    }
    console.log("Checklist público enviado:", {
      maquina,
      operador,
      trabajadorAsignado,
      numericValues,
      checkedItems,
      observaciones,
      notas,
      fecha: new Date().toISOString(),
    });
    toast.success("Checklist guardado correctamente");
    setSubmitted(true);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <ClipboardCheck className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Código QR no válido</h2>
            <p className="text-sm text-muted-foreground">
              No se pudo leer la información de la máquina. Escanea nuevamente el código QR.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
            <h2 className="text-xl font-semibold text-foreground">¡Checklist Guardado!</h2>
            <p className="text-sm text-muted-foreground">
              El checklist de <strong>{maquina?.nombre}</strong> fue registrado exitosamente.
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            <Button onClick={() => { setSubmitted(false); setCheckedItems({}); setNumericValues({}); setObservaciones(""); setNotas(""); setOperador(""); setTrabajadorAsignado(""); }}>
              Realizar otro checklist
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!maquina) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logoObras} alt="Logo" className="h-8 w-8 object-contain" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">Checklist Diario</h1>
            <p className="text-xs text-muted-foreground truncate">{maquina.nombre} · {maquina.placas}</p>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* Info máquina */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{maquina.nombre}</p>
                <p className="text-xs text-muted-foreground">{maquina.marca} {maquina.modelo} · S/N: {maquina.serie}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos generales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Datos del Operador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombre del Operador *</Label>
              <Input placeholder="Ej: Juan Pérez" value={operador} onChange={(e) => setOperador(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Trabajador Asignado</Label>
              <Select value={trabajadorAsignado} onValueChange={setTrabajadorAsignado}>
                <SelectTrigger><SelectValue placeholder="Seleccionar trabajador" /></SelectTrigger>
                <SelectContent>
                  {trabajadores.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Valores numéricos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Lecturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {numericItems.map((item) => (
                <div key={item.id} className="space-y-1">
                  <Label className="text-xs">{item.label} ({item.unit})</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={numericValues[item.id] || ""}
                    onChange={(e) => setNumericValues((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Puntos de inspección */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Puntos de Inspección</CardTitle>
              <span className="text-xs text-muted-foreground font-medium">{completedChecks}/{totalChecks} · {progress}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {checkItems.map((item, idx) => (
                <div key={item.id}>
                  <label className="flex items-center gap-3 py-2.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={!!checkedItems[item.id]}
                      onCheckedChange={() => handleToggleItem(item.id)}
                    />
                    <span className={`text-sm ${checkedItems[item.id] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item.label}
                    </span>
                  </label>
                  {idx < checkItems.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Observaciones y notas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Observaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Observaciones</Label>
              <Textarea placeholder="Reportar anomalías o fallas encontradas..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notas adicionales</Label>
              <Textarea placeholder="Notas sobre el turno, entregas, etc..." value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón fijo de guardar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-10">
        <div className="max-w-2xl mx-auto">
          <Button onClick={handleSubmit} className="w-full h-12 text-base" size="lg">
            <Save className="h-5 w-5 mr-2" />
            Guardar Checklist
          </Button>
        </div>
      </div>
    </div>
  );
}
