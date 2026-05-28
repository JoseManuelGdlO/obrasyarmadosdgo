import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Truck,
  Building,
  Calendar,
  Gauge,
  QrCode,
  Printer,
  Share2,
  Download,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, badgeVariants } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { Progress } from "@/components/ui/progress";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import { apiRequest, toAbsoluteAssetUrl } from "@/lib/api";
import MaquinaModal, {
  ChecklistItemDef,
  InventarioItem,
  MaquinaFormData,
  ServicePlanDef,
} from "@/components/modals/MaquinaModal";
import { getMaquinaTipoNombre } from "@/lib/maquina";
import { buildChecklistPublicoUrl, openChecklistPrintWindow } from "@/lib/checklist-publico";

const estados = ["Operativa", "Disponible", "Mantenimiento", "Fuera de Servicio"] as const;

interface ApiChecklistItem {
  id: string;
  label: string;
  itemType: "check" | "number";
  unit?: string | null;
  orden?: number;
}

interface ApiPiezaServicio {
  id: string;
  articuloId: string;
  cantidad: number;
}

interface ApiPlanServicio {
  id: string;
  nombre: string;
  frecuenciaTipo: "km" | "hrs" | "meses";
  frecuenciaValor: string;
  piezas?: ApiPiezaServicio[];
}

interface ApiMaquina {
  id: string;
  /** API/DB: idu (ID user). En UI se etiqueta como "ID" — ver IMPLEMENTACION_MODULO_MAQUINAS.md */
  idu: string;
  nombre: string;
  claseId: string;
  tipoId: string;
  clase?: { id: string; nombre: string };
  tipoCatalogo?: { id: string; nombre: string; claseId?: string };
  marca: string;
  modelo: string;
  placas: string;
  numeroSerie: string;
  numeroEconomico?: string | null;
  estado: string;
  horometroInicial: number;
  horometroActual: number;
  horometroFinal: number;
  disponibilidad: number;
  fechaAdquisicion: string | null;
  ubicacion: string;
  ultimoMantenimiento: string | null;
  tipoCombustible?: string | null;
  pedimento?: string | null;
  pedimentoNumero?: string | null;
  factura?: string | null;
  facturaNumero?: string | null;
  facturaImporte?: number | string | null;
  costoVehiculo?: number | string | null;
  fechaFactura?: string | null;
  compradoA?: string | null;
  tarjeton?: string | null;
  tarjetonNumero?: string | null;
  contratoCompraventa?: string | null;
  seguro?: string | null;
  seguroVigencia?: string | null;
  fotoPortadaPath?: string | null;
  pedimentoArchivoPath?: string | null;
  polizaSeguroPath?: string | null;
  checklistItems?: ApiChecklistItem[];
  planesServicio?: ApiPlanServicio[];
}

const buildMaquinaPayload = (form: MaquinaFormData) => ({
  nombre: form.nombre,
  claseId: form.claseId,
  tipoId: form.tipoId,
  marca: form.marca,
  modelo: form.modelo,
  placas: form.placas,
  numeroSerie: form.numeroSerie,
  numeroEconomico: form.numeroEconomico || null,
  ubicacion: form.ubicacion,
  estado: form.estado,
  horometroInicial: Number(form.horometroInicial) || 0,
  horometroActual: Number(form.horometroActual || form.horometroInicial) || 0,
  horometroFinal: Number(form.horometroFinal) || 0,
  disponibilidad: Number(form.disponibilidad) || 0,
  fechaAdquisicion: form.fechaAdquisicion,
  tipoCombustible: form.tipoCombustible || null,
  pedimento: form.pedimento || null,
  pedimentoNumero: form.pedimentoNumero || null,
  factura: form.factura || null,
  facturaNumero: form.facturaNumero || null,
  facturaImporte: form.facturaImporte ? Number(form.facturaImporte) : null,
  costoVehiculo: form.costoVehiculo ? Number(form.costoVehiculo) : null,
  fechaFactura: form.fechaFactura || null,
  compradoA: form.compradoA || null,
  tarjeton: form.tarjeton || null,
  tarjetonNumero: form.tarjetonNumero || null,
  contratoCompraventa: form.contratoCompraventa || null,
  seguro: form.seguro || null,
  seguroVigencia: form.seguroVigencia || null,
});

const appendPayloadToFormData = (
  body: FormData,
  payload: Record<string, string | number | boolean | null>
) => {
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      body.append(key, String(value));
    }
  });
};

interface ApiArticulo {
  id: string;
  nombre: string;
  categoria: string;
}

const toDateInput = (value: string | null | undefined) => {
  if (!value) return "";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
};

const validatePortadaFile = (file: File | null) => {
  if (!file) return null;
  const maxSize = 2 * 1024 * 1024;
  const allowedTypes = new Set(["image/jpeg", "image/png"]);
  if (!allowedTypes.has(file.type)) {
    return "La portada debe ser JPG o PNG.";
  }
  if (file.size > maxSize) {
    return "La portada no puede superar 2MB.";
  }
  return null;
};

const DOCUMENT_ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

const validateDocumentFile = (file: File | null, label: string) => {
  if (!file) return null;
  const maxSize = 5 * 1024 * 1024;
  if (!DOCUMENT_ALLOWED_TYPES.has(file.type)) {
    return `${label}: solo se permite PDF, DOC, DOCX, JPG o PNG.`;
  }
  if (file.size > maxSize) {
    return `${label}: el archivo no puede superar 5MB.`;
  }
  return null;
};

const appendMaquinaFilesToFormData = (body: FormData, form: MaquinaFormData) => {
  if (form.fotoPortadaFile) {
    body.append("fotoPortada", form.fotoPortadaFile);
  }
  if (form.pedimentoArchivoFile) {
    body.append("archivoPedimento", form.pedimentoArchivoFile);
  }
  if (form.polizaSeguroFile) {
    body.append("archivoPolizaSeguro", form.polizaSeguroFile);
  }
};

export default function Maquinas() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaquinaId, setEditingMaquinaId] = useState<string | null>(null);
  const [qrMaquina, setQrMaquina] = useState<ApiMaquina | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const { data: maquinasData, isLoading: isLoadingMaquinas } = useQuery({
    queryKey: ["maquinas"],
    queryFn: () =>
      apiRequest<{ maquinas: ApiMaquina[] }>("/maquinas?include=checklist,planes"),
  });

  const { data: articulosData } = useQuery({
    queryKey: ["articulos"],
    queryFn: () => apiRequest<{ articulos: ApiArticulo[] }>("/articulos"),
  });

  const { data: tiposCatalogData } = useQuery({
    queryKey: ["maquina-tipos", "filtro"],
    queryFn: () =>
      apiRequest<{ tipos: Array<{ id: string; nombre: string }> }>("/maquina-tipos?activo=true"),
  });

  const tiposCatalogo = tiposCatalogData?.tipos || [];

  const maquinas = maquinasData?.maquinas || [];
  const articulos: InventarioItem[] = (articulosData?.articulos || []).map((a) => ({
    id: a.id,
    nombre: a.nombre,
    categoria: a.categoria,
  }));

  const createMaquinaMutation = useMutation({
    mutationFn: async (form: MaquinaFormData) => {
      const payload = buildMaquinaPayload(form);
      const portadaError = validatePortadaFile(form.fotoPortadaFile);
      if (portadaError) throw new Error(portadaError);
      const pedimentoError = validateDocumentFile(
        form.pedimentoArchivoFile,
        "Pedimento"
      );
      if (pedimentoError) throw new Error(pedimentoError);
      const polizaError = validateDocumentFile(form.polizaSeguroFile, "Póliza de seguro");
      if (polizaError) throw new Error(polizaError);
      const body = new FormData();
      appendPayloadToFormData(body, payload);
      appendMaquinaFilesToFormData(body, form);
      const created = await apiRequest<{ maquina: { id: string } }>("/maquinas", {
        method: "POST",
        body,
      });
      const maquinaId = created.maquina.id;

      for (let i = 0; i < form.checklistItems.length; i++) {
        const item = form.checklistItems[i];
        await apiRequest(`/maquinas/${maquinaId}/checklist-items`, {
          method: "POST",
          body: {
            label: item.label,
            itemType: item.itemType,
            unit: item.unit ?? null,
            orden: i,
          },
        });
      }

      for (const plan of form.planesServicio) {
        const planResp = await apiRequest<{ planServicio: { id: string } }>(
          `/maquinas/${maquinaId}/planes-servicio`,
          {
            method: "POST",
            body: {
              nombre: plan.nombre,
              frecuenciaTipo: plan.frecuenciaTipo,
              frecuenciaValor: plan.frecuenciaValor,
            },
          }
        );
        const planId = planResp.planServicio.id;
        for (const pieza of plan.piezas) {
          await apiRequest(`/planes-servicio/${planId}/piezas`, {
            method: "POST",
            body: {
              articuloId: pieza.articuloId,
              cantidad: pieza.cantidad,
            },
          });
        }
      }

      return created.maquina;
    },
    onSuccess: () => {
      toast.success("Máquina creada correctamente");
      setIsDialogOpen(false);
      setEditingMaquinaId(null);
      queryClient.invalidateQueries({ queryKey: ["maquinas"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al crear la máquina");
    },
  });

  const updateMaquinaMutation = useMutation({
    mutationFn: async ({
      id,
      form,
      existing,
    }: {
      id: string;
      form: MaquinaFormData;
      existing: ApiMaquina | null;
    }) => {
      const payload = {
        ...buildMaquinaPayload(form),
        removeFotoPortada: form.removeFotoPortada,
        removePedimentoArchivo: form.removePedimentoArchivo,
        removePolizaSeguro: form.removePolizaSeguro,
      };
      const portadaError = validatePortadaFile(form.fotoPortadaFile);
      if (portadaError) throw new Error(portadaError);
      const pedimentoError = validateDocumentFile(
        form.pedimentoArchivoFile,
        "Pedimento"
      );
      if (pedimentoError) throw new Error(pedimentoError);
      const polizaError = validateDocumentFile(form.polizaSeguroFile, "Póliza de seguro");
      if (polizaError) throw new Error(polizaError);
      const body = new FormData();
      appendPayloadToFormData(body, payload);
      appendMaquinaFilesToFormData(body, form);
      await apiRequest(`/maquinas/${id}`, { method: "PATCH", body });

      // Reemplazo completo de checklist en edición para simplificar sincronización.
      const currentChecklist = existing?.checklistItems || [];
      for (const item of currentChecklist) {
        await apiRequest(`/maquinas/${id}/checklist-items/${item.id}`, { method: "DELETE" });
      }
      for (let i = 0; i < form.checklistItems.length; i++) {
        const item = form.checklistItems[i];
        await apiRequest(`/maquinas/${id}/checklist-items`, {
          method: "POST",
          body: {
            label: item.label,
            itemType: item.itemType,
            unit: item.unit ?? null,
            orden: i,
          },
        });
      }

      // Reemplazo completo de planes de servicio (piezas incluidas).
      const currentPlanes = existing?.planesServicio || [];
      for (const plan of currentPlanes) {
        await apiRequest(`/maquinas/${id}/planes-servicio/${plan.id}`, { method: "DELETE" });
      }
      for (const plan of form.planesServicio) {
        const planResp = await apiRequest<{ planServicio: { id: string } }>(
          `/maquinas/${id}/planes-servicio`,
          {
            method: "POST",
            body: {
              nombre: plan.nombre,
              frecuenciaTipo: plan.frecuenciaTipo,
              frecuenciaValor: plan.frecuenciaValor,
            },
          }
        );
        const planId = planResp.planServicio.id;
        for (const pieza of plan.piezas) {
          await apiRequest(`/planes-servicio/${planId}/piezas`, {
            method: "POST",
            body: {
              articuloId: pieza.articuloId,
              cantidad: pieza.cantidad,
            },
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Máquina actualizada correctamente");
      setIsDialogOpen(false);
      setEditingMaquinaId(null);
      queryClient.invalidateQueries({ queryKey: ["maquinas"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al actualizar la máquina");
    },
  });

  const deleteMaquinaMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/maquinas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Máquina eliminada correctamente");
      queryClient.invalidateQueries({ queryKey: ["maquinas"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al eliminar la máquina");
    },
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: (typeof estados)[number] }) =>
      apiRequest(`/maquinas/${id}`, { method: "PATCH", body: { estado } }),
    onSuccess: () => {
      toast.success("Estado actualizado");
      queryClient.invalidateQueries({ queryKey: ["maquinas"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al actualizar el estado");
    },
  });

  const editingMaquina = useMemo(
    () => maquinas.find((m) => m.id === editingMaquinaId) || null,
    [maquinas, editingMaquinaId]
  );

  const initialData: Partial<MaquinaFormData> | null = useMemo(() => {
    if (!editingMaquina) return null;
    const checklistItems: ChecklistItemDef[] = (editingMaquina.checklistItems || []).map((c) => ({
      id: c.id,
      label: c.label,
      itemType: c.itemType,
      unit: c.unit ?? undefined,
    }));
    const planesServicio: ServicePlanDef[] = (editingMaquina.planesServicio || []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      frecuenciaTipo: p.frecuenciaTipo,
      frecuenciaValor: String(p.frecuenciaValor),
      piezas: (p.piezas || []).map((pi) => ({
        articuloId: pi.articuloId,
        cantidad: pi.cantidad,
      })),
    }));
    return {
      nombre: editingMaquina.nombre || "",
      claseId: editingMaquina.claseId || editingMaquina.clase?.id || "",
      tipoId: editingMaquina.tipoId || editingMaquina.tipoCatalogo?.id || "",
      marca: editingMaquina.marca || "",
      modelo: editingMaquina.modelo || "",
      placas: editingMaquina.placas || "",
      numeroSerie: editingMaquina.numeroSerie || "",
      numeroEconomico: editingMaquina.numeroEconomico || "",
      ubicacion: editingMaquina.ubicacion || "",
      horometroInicial: String(editingMaquina.horometroInicial ?? ""),
      horometroActual: String(editingMaquina.horometroActual ?? ""),
      horometroFinal: String(editingMaquina.horometroFinal ?? ""),
      disponibilidad: String(editingMaquina.disponibilidad ?? ""),
      fechaAdquisicion: toDateInput(editingMaquina.fechaAdquisicion),
      estado: (editingMaquina.estado as MaquinaFormData["estado"]) || "Operativa",
      ultimoMantenimiento: toDateInput(editingMaquina.ultimoMantenimiento),
      tipoCombustible: editingMaquina.tipoCombustible || "",
      pedimento: editingMaquina.pedimento || "",
      pedimentoNumero: editingMaquina.pedimentoNumero || "",
      factura: editingMaquina.factura || "",
      facturaNumero: editingMaquina.facturaNumero || "",
      facturaImporte:
        editingMaquina.facturaImporte != null ? String(editingMaquina.facturaImporte) : "",
      costoVehiculo:
        editingMaquina.costoVehiculo != null ? String(editingMaquina.costoVehiculo) : "",
      fechaFactura: toDateInput(editingMaquina.fechaFactura),
      compradoA: editingMaquina.compradoA || "",
      tarjeton: editingMaquina.tarjeton || "",
      tarjetonNumero: editingMaquina.tarjetonNumero || "",
      contratoCompraventa: editingMaquina.contratoCompraventa || "",
      seguro: editingMaquina.seguro || "",
      seguroVigencia: toDateInput(editingMaquina.seguroVigencia),
      fotoPortadaPath: toAbsoluteAssetUrl(editingMaquina.fotoPortadaPath) || "",
      pedimentoArchivoPath:
        toAbsoluteAssetUrl(editingMaquina.pedimentoArchivoPath) || "",
      polizaSeguroPath: toAbsoluteAssetUrl(editingMaquina.polizaSeguroPath) || "",
      checklistItems,
      planesServicio,
    };
  }, [editingMaquina]);

  const filteredMaquinas = maquinas.filter((maquina) => {
    const tipoNombre = getMaquinaTipoNombre(maquina);
    const matchesSearch =
      !searchTerm ||
      maquina.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tipoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.placas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (maquina.idu || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = !selectedTipo || maquina.tipoId === selectedTipo;
    const matchesEstado = !selectedEstado || maquina.estado === selectedEstado;
    return matchesSearch && matchesTipo && matchesEstado;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "Operativa":
        return "bg-green-600";
      case "Disponible":
        return "bg-blue-600";
      case "Mantenimiento":
        return "bg-yellow-600";
      case "Fuera de Servicio":
        return "bg-red-600";
      default:
        return "bg-gray-400";
    }
  };

  const getDisponibilidadEtiqueta = (maquina: ApiMaquina) => {
    if (maquina.estado === "Mantenimiento") return "Mantenimiento";
    if (maquina.estado === "Fuera de Servicio") return "No disponible";
    const valor = Number(maquina.disponibilidad) || 0;
    if (valor >= 90) return "Activa";
    if (valor >= 75) return "Disponible";
    if (valor >= 50) return "Regular";
    return "No disponible";
  };

  const getDisponibilidadEtiquetaColor = (etiqueta: string) => {
    switch (etiqueta) {
      case "Activa":
        return "text-green-600";
      case "Disponible":
        return "text-blue-600";
      case "Regular":
        return "text-yellow-600";
      case "Mantenimiento":
        return "text-yellow-600";
      case "No disponible":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getPromedioDisponibilidadEtiqueta = (promedio: number) => {
    if (promedio >= 90) return "Activa";
    if (promedio >= 75) return "Disponible";
    if (promedio >= 50) return "Regular";
    return "No disponible";
  };

  const calcularVidaUtil = (inicial: number, actual: number, final: number) => {
    if (final <= inicial) return 0;
    const progreso = ((actual - inicial) / (final - inicial)) * 100;
    return Math.min(Math.max(progreso, 0), 100);
  };

  const totalMaquinas = maquinas.length;
  const maquinasOperativas = maquinas.filter((m) => m.estado === "Operativa").length;
  const maquinasDisponibles = maquinas.filter((m) => m.estado === "Disponible").length;
  const promedioDisponibilidad =
    maquinas.length > 0
      ? Math.round(maquinas.reduce((sum, m) => sum + (m.disponibilidad || 0), 0) / maquinas.length)
      : 0;

  const handleSave = (form: MaquinaFormData) => {
    if (editingMaquinaId) {
      updateMaquinaMutation.mutate({ id: editingMaquinaId, form, existing: editingMaquina });
    } else {
      createMaquinaMutation.mutate(form);
    }
  };

  const handleOpenCreate = () => {
    setEditingMaquinaId(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    setEditingMaquinaId(id);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Máquinas / Vehículos</h1>
          <p className="text-gray-600 mt-1">
            Inventario de máquinas y vehículos de la compañía
          </p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleOpenCreate}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Máquina
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Máquinas"
          value={totalMaquinas}
          icon={Truck}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Operativas"
          value={maquinasOperativas}
          icon={Gauge}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Disponibles"
          value={maquinasDisponibles}
          icon={Calendar}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Disponibilidad Promedio"
          value={getPromedioDisponibilidadEtiqueta(promedioDisponibilidad)}
          icon={Building}
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, tipo, placas o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-36">
              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposCatalogo.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-32">
              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Inventario de Máquinas ({filteredMaquinas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Máquina</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Horómetro</TableHead>
                <TableHead>Vida Útil</TableHead>
                <TableHead>Disponibilidad</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaquinas.map((maquina) => {
                const vidaUtil = calcularVidaUtil(
                  maquina.horometroInicial,
                  maquina.horometroActual,
                  maquina.horometroFinal
                );
                const disponibilidadEtiqueta = getDisponibilidadEtiqueta(maquina);

                return (
                  <TableRow key={maquina.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-start gap-3">
                        {toAbsoluteAssetUrl(maquina.fotoPortadaPath) ? (
                          <img
                            src={toAbsoluteAssetUrl(maquina.fotoPortadaPath) || ""}
                            alt={`Portada ${maquina.nombre}`}
                            className="h-12 w-16 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="h-12 w-16 rounded-md border bg-muted flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="font-medium">{maquina.nombre}</div>
                          <div className="text-sm text-gray-600">
                            {maquina.marca} {maquina.modelo}
                          </div>
                          <div className="text-xs text-gray-500">
                            Placas: {maquina.placas}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-sm tracking-wide">
                        {maquina.idu}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            disabled={
                              updateEstadoMutation.isPending &&
                              updateEstadoMutation.variables?.id === maquina.id
                            }
                            className={cn(
                              badgeVariants(),
                              getStatusColor(maquina.estado),
                              "cursor-pointer border-transparent hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                            )}
                          >
                            {maquina.estado}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {estados.map((estado) => (
                            <DropdownMenuItem
                              key={estado}
                              onClick={() => {
                                if (estado !== maquina.estado) {
                                  updateEstadoMutation.mutate({ id: maquina.id, estado });
                                }
                              }}
                            >
                              <span
                                className={cn(
                                  "mr-2 h-2 w-2 shrink-0 rounded-full",
                                  getStatusDotColor(estado)
                                )}
                              />
                              {estado}
                              {maquina.estado === estado && (
                                <Check className="ml-auto h-4 w-4 text-primary" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {Number(maquina.horometroActual).toLocaleString()} hrs
                        </div>
                        <div className="text-xs text-gray-600">
                          Inicial: {Number(maquina.horometroInicial).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">
                          Final: {Number(maquina.horometroFinal).toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Progress value={vidaUtil} className="flex-1 h-2" />
                          <span className="text-xs text-gray-600 min-w-[35px]">
                            {Math.round(vidaUtil)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.max(
                            maquina.horometroFinal - maquina.horometroActual,
                            0
                          ).toLocaleString()}{" "}
                          hrs restantes
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div
                          className={`text-sm font-semibold ${getDisponibilidadEtiquetaColor(
                            disponibilidadEtiqueta
                          )}`}
                        >
                          {disponibilidadEtiqueta}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">{maquina.ubicacion}</div>
                        {maquina.ultimoMantenimiento && (
                          <div className="text-xs text-gray-500">
                            Últ. mant:{" "}
                            {new Date(maquina.ultimoMantenimiento).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleOpenEdit(maquina.id)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <ConfirmDeleteButton
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="¿Eliminar máquina?"
                          description="Esta acción eliminará la máquina, su checklist y planes de servicio."
                          onConfirm={() => deleteMaquinaMutation.mutate(maquina.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </ConfirmDeleteButton>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setQrMaquina(maquina)}
                        >
                          <QrCode className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {!isLoadingMaquinas && filteredMaquinas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron máquinas que coincidan con los filtros
            </div>
          )}
          {isLoadingMaquinas && (
            <div className="text-center py-8 text-gray-500">Cargando máquinas...</div>
          )}
        </CardContent>
      </Card>

      <MaquinaModal
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingMaquinaId(null);
        }}
        mode={editingMaquinaId ? "edit" : "create"}
        inventario={articulos}
        initialData={initialData}
        isSubmitting={createMaquinaMutation.isPending || updateMaquinaMutation.isPending}
        onSubmit={handleSave}
      />

      <Dialog open={!!qrMaquina} onOpenChange={(open) => !open && setQrMaquina(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Código QR - {qrMaquina?.nombre}
            </DialogTitle>
          </DialogHeader>
          {qrMaquina && (
            <div className="space-y-4">
              <div
                ref={qrRef}
                className="flex flex-col items-center gap-3 p-6 bg-background rounded-lg border"
              >
                <QRCodeSVG
                  value={buildChecklistPublicoUrl(qrMaquina)}
                  size={200}
                  level="H"
                  includeMargin
                />
                <p className="text-sm font-medium text-foreground">{qrMaquina.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {qrMaquina.marca} {qrMaquina.modelo} · {qrMaquina.placas}
                </p>
                <p className="text-xs text-muted-foreground">S/N: {qrMaquina.numeroSerie}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    const svg = qrRef.current?.querySelector("svg");
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    canvas.width = 300;
                    canvas.height = 300;
                    const ctx = canvas.getContext("2d");
                    const img = new Image();
                    img.onload = () => {
                      ctx?.drawImage(img, 0, 0, 300, 300);
                      const a = document.createElement("a");
                      a.download = `QR-${qrMaquina.nombre}.png`;
                      a.href = canvas.toDataURL("image/png");
                      a.click();
                    };
                    img.src =
                      "data:image/svg+xml;base64," +
                      btoa(unescape(encodeURIComponent(svgData)));
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const printWindow = window.open("", "_blank");
                    if (!printWindow || !qrRef.current) return;
                    printWindow.document.write(`
                      <html><head><title>QR ${qrMaquina.nombre}</title>
                      <style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;font-family:sans-serif;}
                      .container{text-align:center;}</style></head>
                      <body><div class="container">${qrRef.current.innerHTML}</div>
                      <script>window.print();window.close();</script></body></html>
                    `);
                    printWindow.document.close();
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir QR
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!openChecklistPrintWindow(qrMaquina)) {
                      toast.error("No se pudo abrir la ventana de impresión");
                    }
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir checklist
                </Button>
                {typeof navigator !== "undefined" && navigator.share && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const svg = qrRef.current?.querySelector("svg");
                      if (!svg) return;
                      const svgData = new XMLSerializer().serializeToString(svg);
                      const canvas = document.createElement("canvas");
                      canvas.width = 300;
                      canvas.height = 300;
                      const ctx = canvas.getContext("2d");
                      const img = new Image();
                      img.onload = async () => {
                        ctx?.drawImage(img, 0, 0, 300, 300);
                        canvas.toBlob(async (blob) => {
                          if (!blob) return;
                          const file = new File([blob], `QR-${qrMaquina.nombre}.png`, {
                            type: "image/png",
                          });
                          try {
                            await navigator.share({
                              title: `QR ${qrMaquina.nombre}`,
                              files: [file],
                            });
                          } catch {
                            // Compartir cancelado por el usuario.
                          }
                        });
                      };
                      img.src =
                        "data:image/svg+xml;base64," +
                        btoa(unescape(encodeURIComponent(svgData)));
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                <Input
                  readOnly
                  value={buildChecklistPublicoUrl(qrMaquina)}
                  className="text-xs bg-background"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(buildChecklistPublicoUrl(qrMaquina));
                    toast.success("Link copiado al portapapeles");
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
