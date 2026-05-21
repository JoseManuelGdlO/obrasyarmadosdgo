import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { apiRequest, toAbsoluteAssetUrl } from "@/lib/api";

type ChecklistItemBackend = {
  id: string;
  maquinaId: string;
  orden: number;
  label: string;
  itemType: "check" | "number";
  unit: string | null;
};

type TrabajadorLite = { id: string; nombre: string };

type MaquinaPublic = {
  id: string;
  nombre: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  placas: string;
  numeroSerie?: string;
  estado?: string;
  fotoPortadaPath?: string | null;
};

const publicRequest = <T,>(path: string, options: Parameters<typeof apiRequest>[1] = {}) =>
  apiRequest<T>(path, { ...options, token: null });

export default function ChecklistPublico() {
  const [searchParams] = useSearchParams();
  const [maquinaIdFromQR, setMaquinaIdFromQR] = useState<string | null>(null);
  const [parseError, setParseError] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [operador, setOperador] = useState("");
  const [trabajadorId, setTrabajadorId] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [numericValues, setNumericValues] = useState<Record<string, string>>({});
  const [observaciones, setObservaciones] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    const data = searchParams.get("data");
    if (!data) {
      setParseError(true);
      return;
    }
    try {
      const parsed = JSON.parse(decodeURIComponent(data));
      if (parsed?.id) {
        setMaquinaIdFromQR(String(parsed.id));
      } else {
        setParseError(true);
      }
    } catch {
      setParseError(true);
    }
  }, [searchParams]);

  const { data: maquinaResp, isError: maquinaError, isLoading: maquinaLoading } = useQuery({
    queryKey: ["public-maquina", maquinaIdFromQR],
    queryFn: () =>
      publicRequest<{ maquina: MaquinaPublic }>(`/public/maquinas/${maquinaIdFromQR}`),
    enabled: Boolean(maquinaIdFromQR),
    retry: false,
  });

  const { data: itemsResp, isLoading: itemsLoading } = useQuery({
    queryKey: ["public-items", maquinaIdFromQR],
    queryFn: () =>
      publicRequest<{ checklistItems: ChecklistItemBackend[] }>(
        `/public/maquinas/${maquinaIdFromQR}/checklist-items`
      ),
    enabled: Boolean(maquinaIdFromQR),
  });

  const { data: trabajadoresResp } = useQuery({
    queryKey: ["public-trabajadores"],
    queryFn: () => publicRequest<{ trabajadores: TrabajadorLite[] }>("/public/trabajadores"),
  });

  const maquina = maquinaResp?.maquina || null;
  const checklistItems = useMemo(
    () => itemsResp?.checklistItems || [],
    [itemsResp?.checklistItems]
  );
  const trabajadores = trabajadoresResp?.trabajadores || [];

  const handleToggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkItems = checklistItems.filter((i) => i.itemType === "check");
  const numericItems = checklistItems.filter((i) => i.itemType === "number");
  const completedChecks = checkItems.filter((i) => checkedItems[i.id]).length;
  const totalChecks = checkItems.length;
  const progress = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

  const submitMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      publicRequest("/public/checklists-diarios", { method: "POST", body: payload }),
    onSuccess: () => {
      toast.success("Checklist guardado correctamente");
      setSubmitted(true);
    },
    onError: (err: Error) => toast.error(err.message || "Error guardando checklist"),
  });

  const handleSubmit = () => {
    if (!operador.trim()) {
      toast.error("Por favor ingresa el nombre del operador");
      return;
    }
    if (!maquina) return;
    if (checklistItems.length === 0) {
      toast.error("Esta máquina no tiene checklist configurado");
      return;
    }

    const lecturas: Record<string, number> = {};
    Object.entries(numericValues).forEach(([id, value]) => {
      if (value === "") return;
      const num = Number(value);
      if (Number.isFinite(num)) lecturas[id] = num;
    });

    const respuestas: Record<string, boolean> = {};
    checkItems.forEach((it) => {
      respuestas[it.id] = !!checkedItems[it.id];
    });

    submitMutation.mutate({
      maquinaId: maquina.id,
      fecha: new Date().toISOString().slice(0, 10),
      operador: operador.trim(),
      trabajadorId: trabajadorId || null,
      lecturas,
      respuestas,
      observaciones: observaciones.trim() || null,
      notas: notas.trim() || null,
    });
  };

  if (parseError || maquinaError) {
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
              {new Date().toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setCheckedItems({});
                setNumericValues({});
                setObservaciones("");
                setNotas("");
                setOperador("");
                setTrabajadorId("");
              }}
            >
              Realizar otro checklist
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!maquina || maquinaLoading) {
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
            <p className="text-xs text-muted-foreground truncate">
              {maquina.nombre} · {maquina.placas}
            </p>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {new Date().toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* Info máquina */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              {toAbsoluteAssetUrl(maquina.fotoPortadaPath) ? (
                <img
                  src={toAbsoluteAssetUrl(maquina.fotoPortadaPath) || ""}
                  alt={`Portada ${maquina.nombre}`}
                  className="h-12 w-16 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">{maquina.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {maquina.marca || ""} {maquina.modelo || ""}
                  {maquina.numeroSerie ? ` · S/N: ${maquina.numeroSerie}` : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {itemsLoading ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Cargando checklist...
            </CardContent>
          </Card>
        ) : checklistItems.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                Sin checklist configurado
              </p>
              <p className="text-xs text-muted-foreground">
                Esta máquina no tiene puntos de inspección configurados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Datos generales */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Datos del Operador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre del Operador *</Label>
                  <Input
                    placeholder="Ej: Juan Pérez"
                    value={operador}
                    onChange={(e) => setOperador(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Trabajador Asignado</Label>
                  <Select
                    value={trabajadorId || "none"}
                    onValueChange={(val) => setTrabajadorId(val === "none" ? "" : val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar trabajador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {trabajadores.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Valores numéricos */}
            {numericItems.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Lecturas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {numericItems.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <Label className="text-xs">
                          {item.label}
                          {item.unit ? ` (${item.unit})` : ""}
                        </Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={numericValues[item.id] || ""}
                          onChange={(e) =>
                            setNumericValues((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Puntos de inspección */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Puntos de Inspección</CardTitle>
                  <span className="text-xs text-muted-foreground font-medium">
                    {completedChecks}/{totalChecks} · {progress}%
                  </span>
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
                        <span
                          className={`text-sm ${
                            checkedItems[item.id]
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
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
                  <Textarea
                    placeholder="Reportar anomalías o fallas encontradas..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notas adicionales</Label>
                  <Textarea
                    placeholder="Notas sobre el turno, entregas, etc..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Botón fijo de guardar */}
      {checklistItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-10">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleSubmit}
              className="w-full h-12 text-base"
              size="lg"
              disabled={submitMutation.isPending}
            >
              <Save className="h-5 w-5 mr-2" />
              {submitMutation.isPending ? "Guardando..." : "Guardar Checklist"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
