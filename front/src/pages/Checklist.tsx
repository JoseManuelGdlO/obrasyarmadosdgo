import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, ClipboardCheck, Truck, Calendar, User, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiRequest, toAbsoluteAssetUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type MaquinaBackend = {
  id: string;
  nombre: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  placas: string;
  numeroSerie?: string;
  estado: string;
  fotoPortadaPath?: string | null;
};

type ChecklistItemBackend = {
  id: string;
  maquinaId: string;
  orden: number;
  label: string;
  itemType: "check" | "number";
  unit: string | null;
};

type TrabajadorLite = {
  id: string;
  nombre: string;
};

type ChecklistDiarioBackend = {
  id: string;
  maquinaId: string;
  fecha: string;
  operador: string;
  trabajadorId: string | null;
  trabajadorNombre: string | null;
  lecturas: Record<string, number> | null;
  respuestas: Record<string, boolean> | null;
  itemsSnapshot:
    | Array<{ id: string; label: string; itemType: "check" | "number"; unit: string | null; orden: number }>
    | null;
  itemsTotal: number;
  itemsOk: number;
  observaciones: string | null;
  notas: string | null;
  source: "interno" | "publico";
  createdAt: string;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "Operativa":
      return "bg-green-100 text-green-800";
    case "Disponible":
      return "bg-blue-100 text-blue-800";
    case "Mantenimiento":
      return "bg-yellow-100 text-yellow-800";
    case "Fuera de Servicio":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function Checklist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaquina, setSelectedMaquina] = useState<MaquinaBackend | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [numericValues, setNumericValues] = useState<Record<string, string>>({});
  const [operador, setOperador] = useState("");
  const [trabajadorId, setTrabajadorId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [notas, setNotas] = useState("");

  const today = useMemo(() => todayISO(), []);

  const { data: maquinasData } = useQuery({
    queryKey: ["checklist-maquinas"],
    queryFn: () => apiRequest<{ maquinas: MaquinaBackend[] }>("/maquinas"),
  });

  const { data: trabajadoresData } = useQuery({
    queryKey: ["checklist-trabajadores"],
    queryFn: () => apiRequest<{ trabajadores: TrabajadorLite[] }>("/trabajadores"),
  });

  const { data: hoyData } = useQuery({
    queryKey: ["checklists-hoy", today],
    queryFn: () =>
      apiRequest<{ checklistsDiarios: ChecklistDiarioBackend[] }>(
        `/checklists-diarios?fechaDesde=${today}&fechaHasta=${today}`
      ),
  });

  const maquinaId = selectedMaquina?.id;

  const { data: itemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: ["maquina-checklist-items", maquinaId],
    queryFn: () =>
      apiRequest<{ checklistItems: ChecklistItemBackend[] }>(
        `/maquinas/${maquinaId}/checklist-items`
      ),
    enabled: Boolean(maquinaId && isModalOpen),
  });

  const { data: historialData } = useQuery({
    queryKey: ["maquina-checklist-historial", maquinaId],
    queryFn: () =>
      apiRequest<{ checklistsDiarios: ChecklistDiarioBackend[] }>(
        `/checklists-diarios?maquinaId=${maquinaId}`
      ),
    enabled: Boolean(maquinaId && isModalOpen),
  });

  const maquinas = useMemo(() => maquinasData?.maquinas || [], [maquinasData?.maquinas]);
  const trabajadores = useMemo(
    () => trabajadoresData?.trabajadores || [],
    [trabajadoresData?.trabajadores]
  );
  const checklistItems = useMemo(
    () => itemsData?.checklistItems || [],
    [itemsData?.checklistItems]
  );
  const historial = useMemo(
    () => (historialData?.checklistsDiarios || []).slice(0, 10),
    [historialData?.checklistsDiarios]
  );

  const completedTodayIds = useMemo(() => {
    const set = new Set<string>();
    (hoyData?.checklistsDiarios || []).forEach((c) => set.add(c.maquinaId));
    return set;
  }, [hoyData?.checklistsDiarios]);

  const filteredMaquinas = maquinas.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.nombre.toLowerCase().includes(term) ||
      (m.placas || "").toLowerCase().includes(term) ||
      (m.tipo || "").toLowerCase().includes(term)
    );
  });

  const checkItems = checklistItems.filter((i) => i.itemType === "check");
  const numericItems = checklistItems.filter((i) => i.itemType === "number");
  const totalChecks = checkItems.length;
  const completedChecks = checkItems.filter((i) => checkedItems[i.id]).length;

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("/checklists-diarios", { method: "POST", body: payload }),
    onSuccess: () => {
      toast.success("Checklist guardado");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["checklists-hoy"] });
      if (maquinaId) {
        queryClient.invalidateQueries({
          queryKey: ["maquina-checklist-historial", maquinaId],
        });
      }
    },
    onError: (err: Error) => toast.error(err.message || "Error guardando checklist"),
  });

  const handleOpenChecklist = (maquina: MaquinaBackend) => {
    setSelectedMaquina(maquina);
    setCheckedItems({});
    setNumericValues({});
    setOperador(user?.email || "");
    setTrabajadorId("");
    setObservaciones("");
    setNotas("");
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedMaquina(null);
    }
  }, [isModalOpen]);

  const handleToggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmitChecklist = () => {
    if (!selectedMaquina) return;
    if (!operador.trim()) {
      toast.error("El nombre del operador es obligatorio");
      return;
    }
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

    createMutation.mutate({
      maquinaId: selectedMaquina.id,
      fecha: today,
      operador: operador.trim(),
      trabajadorId: trabajadorId || null,
      lecturas,
      respuestas,
      observaciones: observaciones.trim() || null,
      notas: notas.trim() || null,
    });
  };

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
          const done = completedTodayIds.has(maquina.id);
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
                    {toAbsoluteAssetUrl(maquina.fotoPortadaPath) ? (
                      <img
                        src={toAbsoluteAssetUrl(maquina.fotoPortadaPath) || ""}
                        alt={`Portada ${maquina.nombre}`}
                        className="w-12 h-10 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{maquina.nombre}</h3>
                      <p className="text-sm text-gray-500">
                        {maquina.tipo} · {maquina.placas}
                      </p>
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
        {filteredMaquinas.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No se encontraron máquinas
          </div>
        )}
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
            {selectedMaquina && toAbsoluteAssetUrl(selectedMaquina.fotoPortadaPath) && (
              <img
                src={toAbsoluteAssetUrl(selectedMaquina.fotoPortadaPath) || ""}
                alt={`Portada ${selectedMaquina.nombre}`}
                className="h-28 w-full rounded-md border object-cover"
              />
            )}
            <p className="text-sm text-gray-500">
              {selectedMaquina?.tipo} · {selectedMaquina?.placas}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6">
            {isLoadingItems ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Cargando checklist...
              </div>
            ) : checklistItems.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Esta máquina no tiene checklist configurado.
                </p>
                <p className="text-xs text-muted-foreground">
                  Configura los puntos de inspección desde la edición de la máquina.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pb-6">
                {/* Col 1: Datos generales */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Operador
                    </Label>
                    <Input
                      placeholder="Nombre del operador"
                      value={operador}
                      onChange={(e) => setOperador(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Trabajador Asignado
                    </Label>
                    <Select
                      value={trabajadorId || "none"}
                      onValueChange={(val) => setTrabajadorId(val === "none" ? "" : val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar trabajador..." />
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

                  {numericItems.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {numericItems.map((item) => (
                        <div key={item.id} className="space-y-2">
                          <Label>
                            {item.label}
                            {item.unit ? ` (${item.unit})` : ""}
                          </Label>
                          <Input
                            type="number"
                            placeholder={`Ingrese ${item.label.toLowerCase()}`}
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
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label>Observaciones</Label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background p-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Observaciones sobre el estado de la máquina..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background p-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Notas adicionales..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                    />
                  </div>
                </div>

                {/* Col 2: Puntos de inspección */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Puntos de Inspección</h3>
                    <span className="text-sm text-muted-foreground">
                      {completedChecks}/{totalChecks} revisados
                    </span>
                  </div>
                  <div className="space-y-1">
                    {checkItems.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={!!checkedItems[item.id]}
                          onCheckedChange={() => handleToggleItem(item.id)}
                        />
                        <span className="text-sm text-foreground">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Botón guardar */}
            {checklistItems.length > 0 && (
              <div className="pb-4">
                <Button
                  className="w-full"
                  onClick={handleSubmitChecklist}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Guardando..." : "Guardar Checklist"}
                </Button>
              </div>
            )}

            <Separator />

            {/* Historial */}
            <div className="pb-6 pt-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Historial de Checklist
              </h3>
              {historial.length > 0 ? (
                <div className="space-y-3">
                  {historial.map((registro) => {
                    const lecturas = registro.lecturas || {};
                    const lecturasEntries = Object.entries(lecturas);
                    return (
                      <div key={registro.id} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-foreground">
                            {registro.fecha}
                          </span>
                          <Badge
                            className={
                              registro.itemsTotal > 0 && registro.itemsOk === registro.itemsTotal
                                ? "bg-success text-success-foreground"
                                : "bg-warning text-warning-foreground"
                            }
                          >
                            {registro.itemsOk}/{registro.itemsTotal} OK
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Operador:</span> {registro.operador}
                        </p>
                        {registro.trabajadorNombre && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Asignado a:</span>{" "}
                            {registro.trabajadorNombre}
                          </p>
                        )}
                        {lecturasEntries.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {lecturasEntries
                              .map(([id, val]) => {
                                const snap = registro.itemsSnapshot?.find((s) => s.id === id);
                                const label = snap?.label || id;
                                const unit = snap?.unit ? ` ${snap.unit}` : "";
                                return `${label}: ${Number(val).toLocaleString()}${unit}`;
                              })
                              .join(" · ")}
                          </p>
                        )}
                        {registro.observaciones && (
                          <p className="text-sm text-warning mt-1 italic">
                            <span className="font-medium">Obs:</span> {registro.observaciones}
                          </p>
                        )}
                        {registro.notas && (
                          <p className="text-sm text-primary mt-1 italic">
                            <span className="font-medium">Notas:</span> {registro.notas}
                          </p>
                        )}
                      </div>
                    );
                  })}
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
