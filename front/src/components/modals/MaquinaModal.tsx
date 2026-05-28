import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS } from "@/lib/permissions";
import {
  Plus,
  Truck,
  Edit,
  Wrench,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export type MaquinaEstado = "Operativa" | "Disponible" | "Mantenimiento" | "Fuera de Servicio";

export interface ChecklistItemDef {
  id: string;
  label: string;
  itemType: "check" | "number";
  unit?: string;
}

export interface ServicePiezaDef {
  articuloId: string;
  cantidad: number;
}

export interface ServicePlanDef {
  id: string;
  nombre: string;
  frecuenciaTipo: "km" | "hrs" | "meses";
  frecuenciaValor: string;
  piezas: ServicePiezaDef[];
}

export interface InventarioItem {
  id: string;
  nombre: string;
  categoria?: string;
}

export interface MaquinaFormData {
  nombre: string;
  claseId: string;
  tipoId: string;
  marca: string;
  modelo: string;
  placas: string;
  numeroSerie: string;
  ubicacion: string;
  horometroInicial: string;
  horometroActual: string;
  horometroFinal: string;
  disponibilidad: string;
  fechaAdquisicion: string;
  estado: MaquinaEstado;
  ultimoMantenimiento: string;
  tipoCombustible: string;
  pedimento: string;
  pedimentoNumero: string;
  factura: string;
  facturaNumero: string;
  facturaImporte: string;
  costoVehiculo: string;
  fechaFactura: string;
  compradoA: string;
  tarjeton: string;
  tarjetonNumero: string;
  contratoCompraventa: string;
  seguro: string;
  seguroVigencia: string;
  fotoPortadaPath: string;
  fotoPortadaFile: File | null;
  removeFotoPortada: boolean;
  pedimentoArchivoPath: string;
  pedimentoArchivoFile: File | null;
  removePedimentoArchivo: boolean;
  polizaSeguroPath: string;
  polizaSeguroFile: File | null;
  removePolizaSeguro: boolean;
  checklistItems: ChecklistItemDef[];
  planesServicio: ServicePlanDef[];
}

interface CatalogOption {
  id: string;
  nombre: string;
  activo?: boolean;
}

const estados: MaquinaEstado[] = [
  "Operativa",
  "Disponible",
  "Mantenimiento",
  "Fuera de Servicio",
];

const ADD_CLASE_VALUE = "__add_clase__";
const ADD_TIPO_VALUE = "__add_tipo__";

const defaultForm: MaquinaFormData = {
  nombre: "",
  claseId: "",
  tipoId: "",
  marca: "",
  modelo: "",
  placas: "",
  numeroSerie: "",
  ubicacion: "",
  horometroInicial: "",
  horometroActual: "",
  horometroFinal: "",
  disponibilidad: "",
  fechaAdquisicion: "",
  estado: "Operativa",
  ultimoMantenimiento: "",
  tipoCombustible: "",
  pedimento: "",
  pedimentoNumero: "",
  factura: "",
  facturaNumero: "",
  facturaImporte: "",
  costoVehiculo: "",
  fechaFactura: "",
  compradoA: "",
  tarjeton: "",
  tarjetonNumero: "",
  contratoCompraventa: "",
  seguro: "",
  seguroVigencia: "",
  fotoPortadaPath: "",
  fotoPortadaFile: null,
  removeFotoPortada: false,
  pedimentoArchivoPath: "",
  pedimentoArchivoFile: null,
  removePedimentoArchivo: false,
  polizaSeguroPath: "",
  polizaSeguroFile: null,
  removePolizaSeguro: false,
  checklistItems: [],
  planesServicio: [],
};

const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png";

const isImageDocument = (file: File | null, url: string) => {
  if (file) return file.type.startsWith("image/");
  const lower = url.toLowerCase();
  return /\.(jpe?g|png)(\?|$)/i.test(lower);
};

interface DocumentUploadBlockProps {
  label: string;
  removeLabel: string;
  path: string;
  file: File | null;
  remove: boolean;
  onFileChange: (file: File | null) => void;
  onRemoveChange: (remove: boolean) => void;
}

function DocumentUploadBlock({
  label,
  removeLabel,
  path,
  file,
  remove,
  onFileChange,
  onRemoveChange,
}: DocumentUploadBlockProps) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (remove) {
      setPreviewUrl("");
      return;
    }
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setPreviewUrl(tempUrl);
      return () => URL.revokeObjectURL(tempUrl);
    }
    setPreviewUrl(path || "");
  }, [file, path, remove]);

  const viewUrl = remove ? "" : file ? previewUrl : path;
  const hasDocument = Boolean((path || file) && !remove);
  const displayName = file?.name || (path ? path.split("/").pop() || "Documento guardado" : "");

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <Label>{label}</Label>
      <Input
        type="file"
        accept={DOCUMENT_ACCEPT}
        onChange={(e) => {
          const selected = e.target.files?.[0] || null;
          onFileChange(selected);
          e.target.value = "";
        }}
      />
      {displayName && (
        <p className="text-xs text-muted-foreground truncate">{displayName}</p>
      )}
      {hasDocument && viewUrl && (
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Ver documento
        </a>
      )}
      {hasDocument && viewUrl && isImageDocument(file, viewUrl) && (
        <img src={viewUrl} alt={label} className="h-28 w-full rounded-md border object-cover" />
      )}
      {hasDocument && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">{removeLabel}</Label>
          <button
            type="button"
            onClick={() => onRemoveChange(true)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
            aria-label={removeLabel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

interface MaquinaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MaquinaFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<MaquinaFormData> | null;
  mode?: "create" | "edit";
  inventario?: InventarioItem[];
}

export default function MaquinaModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  mode = "create",
  inventario = [],
}: MaquinaModalProps) {
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const canEditCatalog = can(PERMISSIONS.MAQUINAS_EDIT);

  const [form, setForm] = useState<MaquinaFormData>(defaultForm);
  const [previewPortadaUrl, setPreviewPortadaUrl] = useState<string>("");

  const [claseDialogOpen, setClaseDialogOpen] = useState(false);
  const [tipoDialogOpen, setTipoDialogOpen] = useState(false);
  const [claseForm, setClaseForm] = useState({ nombre: "", activo: true });
  const [tipoForm, setTipoForm] = useState({ nombre: "", claseId: "", activo: true });

  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemType, setNewItemType] = useState<"check" | "number">("check");
  const [newItemUnit, setNewItemUnit] = useState("");

  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceFreqTipo, setNewServiceFreqTipo] = useState<"km" | "hrs" | "meses">("km");
  const [newServiceFreqValor, setNewServiceFreqValor] = useState("");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [servicePiezaSearch, setServicePiezaSearch] = useState("");

  const isEdit = useMemo(() => mode === "edit", [mode]);

  const { data: clasesData } = useQuery({
    queryKey: ["maquina-clases", "activos"],
    queryFn: () => apiRequest<{ clases: CatalogOption[] }>("/maquina-clases?activo=true"),
    enabled: open,
  });

  const { data: tiposData } = useQuery({
    queryKey: ["maquina-tipos", form.claseId],
    queryFn: () =>
      apiRequest<{ tipos: CatalogOption[] }>(
        `/maquina-tipos?activo=true&claseId=${form.claseId}`
      ),
    enabled: open && Boolean(form.claseId),
  });

  const clasesActivas = clasesData?.clases || [];
  const tiposActivos = tiposData?.tipos || [];

  const invalidateCatalog = () => {
    queryClient.invalidateQueries({ queryKey: ["maquina-clases"] });
    queryClient.invalidateQueries({ queryKey: ["maquina-tipos"] });
  };

  const saveClaseMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ maquinaClase: { id: string } }>("/maquina-clases", {
        method: "POST",
        body: { nombre: claseForm.nombre.trim(), activo: claseForm.activo },
      }),
    onSuccess: (data) => {
      const newId = data.maquinaClase?.id;
      toast.success("Clase creada");
      setClaseDialogOpen(false);
      setClaseForm({ nombre: "", activo: true });
      invalidateCatalog();
      if (newId) {
        setForm((prev) => ({ ...prev, claseId: newId, tipoId: "" }));
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveTipoMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ maquinaTipo: { id: string } }>("/maquina-tipos", {
        method: "POST",
        body: {
          nombre: tipoForm.nombre.trim(),
          claseId: tipoForm.claseId,
          activo: tipoForm.activo,
        },
      }),
    onSuccess: (data) => {
      const newId = data.maquinaTipo?.id;
      toast.success("Tipo creado");
      setTipoDialogOpen(false);
      setTipoForm({ nombre: "", claseId: "", activo: true });
      invalidateCatalog();
      if (newId) {
        setForm((prev) => ({ ...prev, tipoId: newId }));
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openNewClase = () => {
    setClaseForm({ nombre: "", activo: true });
    setClaseDialogOpen(true);
  };

  const openNewTipo = () => {
    setTipoForm({ nombre: "", claseId: form.claseId, activo: true });
    setTipoDialogOpen(true);
  };

  useEffect(() => {
    if (open) {
      setForm({
        ...defaultForm,
        ...(initialData || {}),
        fotoPortadaFile: null,
        removeFotoPortada: false,
        pedimentoArchivoFile: null,
        removePedimentoArchivo: false,
        polizaSeguroFile: null,
        removePolizaSeguro: false,
        checklistItems: initialData?.checklistItems || [],
        planesServicio: initialData?.planesServicio || [],
      });
      setPreviewPortadaUrl(initialData?.fotoPortadaPath || "");
      setNewItemLabel("");
      setNewItemUnit("");
      setNewItemType("check");
      setNewServiceName("");
      setNewServiceFreqValor("");
      setNewServiceFreqTipo("km");
      setEditingServiceId(null);
      setServicePiezaSearch("");
    }
  }, [open, initialData]);

  useEffect(() => {
    if (form.fotoPortadaFile) {
      const tempUrl = URL.createObjectURL(form.fotoPortadaFile);
      setPreviewPortadaUrl(tempUrl);
      return () => URL.revokeObjectURL(tempUrl);
    }
    if (form.removeFotoPortada) {
      setPreviewPortadaUrl("");
      return;
    }
    setPreviewPortadaUrl(form.fotoPortadaPath || "");
  }, [form.fotoPortadaFile, form.fotoPortadaPath, form.removeFotoPortada]);

  const addChecklistItem = () => {
    if (!newItemLabel.trim()) return;
    setForm((prev) => ({
      ...prev,
      checklistItems: [
        ...prev.checklistItems,
        {
          id: crypto.randomUUID(),
          label: newItemLabel.trim(),
          itemType: newItemType,
          unit: newItemType === "number" ? newItemUnit.trim() || undefined : undefined,
        },
      ],
    }));
    setNewItemLabel("");
    setNewItemUnit("");
  };

  const removeChecklistItem = (id: string) => {
    setForm((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.filter((i) => i.id !== id),
    }));
  };

  const addServicePlan = () => {
    if (!newServiceName.trim() || !newServiceFreqValor.trim()) return;
    setForm((prev) => ({
      ...prev,
      planesServicio: [
        ...prev.planesServicio,
        {
          id: crypto.randomUUID(),
          nombre: newServiceName.trim(),
          frecuenciaTipo: newServiceFreqTipo,
          frecuenciaValor: newServiceFreqValor.trim(),
          piezas: [],
        },
      ],
    }));
    setNewServiceName("");
    setNewServiceFreqValor("");
  };

  const removeServicePlan = (id: string) => {
    setForm((prev) => ({
      ...prev,
      planesServicio: prev.planesServicio.filter((p) => p.id !== id),
    }));
    if (editingServiceId === id) setEditingServiceId(null);
  };

  const togglePiezaInService = (planId: string, articuloId: string) => {
    setForm((prev) => ({
      ...prev,
      planesServicio: prev.planesServicio.map((s) =>
        s.id === planId
          ? {
              ...s,
              piezas: s.piezas.some((p) => p.articuloId === articuloId)
                ? s.piezas.filter((p) => p.articuloId !== articuloId)
                : [...s.piezas, { articuloId, cantidad: 1 }],
            }
          : s
      ),
    }));
  };

  const updatePiezaCantidad = (planId: string, articuloId: string, cantidad: number) => {
    if (cantidad < 1) return;
    setForm((prev) => ({
      ...prev,
      planesServicio: prev.planesServicio.map((s) =>
        s.id === planId
          ? {
              ...s,
              piezas: s.piezas.map((p) => (p.articuloId === articuloId ? { ...p, cantidad } : p)),
            }
          : s
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] lg:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>
            {isEdit ? "Editar Máquina / Vehículo" : "Agregar Nueva Máquina / Vehículo"}
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Completa los datos, define el checklist diario y programa los servicios.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Datos Generales
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Nombre</Label>
                    <Input
                      placeholder="Ej: Camioneta Ford F-150"
                      value={form.nombre}
                      onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Clase</Label>
                      <Select
                        value={
                          form.claseId && form.claseId !== ADD_CLASE_VALUE
                            ? form.claseId
                            : undefined
                        }
                        onValueChange={(value) => {
                          if (value === ADD_CLASE_VALUE) {
                            openNewClase();
                            return;
                          }
                          setForm((prev) => ({ ...prev, claseId: value, tipoId: "" }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar clase" />
                        </SelectTrigger>
                        <SelectContent>
                          {clasesActivas.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nombre}
                            </SelectItem>
                          ))}
                          {canEditCatalog && (
                            <>
                              <SelectSeparator />
                              <div
                                role="button"
                                tabIndex={0}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm font-medium text-primary outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent"
                                onPointerDown={(e) => e.preventDefault()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openNewClase();
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    openNewClase();
                                  }
                                }}
                              >
                                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                  <Plus className="h-3.5 w-3.5" />
                                </span>
                                Agregar clase
                              </div>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Tipo</Label>
                      <Select
                        value={
                          form.tipoId && form.tipoId !== ADD_TIPO_VALUE
                            ? form.tipoId
                            : undefined
                        }
                        onValueChange={(value) => {
                          if (value === ADD_TIPO_VALUE) {
                            openNewTipo();
                            return;
                          }
                          setForm((prev) => ({ ...prev, tipoId: value }));
                        }}
                        disabled={!form.claseId || form.claseId === ADD_CLASE_VALUE}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposActivos.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.nombre}
                            </SelectItem>
                          ))}
                          {canEditCatalog && form.claseId && form.claseId !== ADD_CLASE_VALUE && (
                            <>
                              <SelectSeparator />
                              <div
                                role="button"
                                tabIndex={0}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm font-medium text-primary outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent"
                                onPointerDown={(e) => e.preventDefault()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openNewTipo();
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    openNewTipo();
                                  }
                                }}
                              >
                                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                  <Plus className="h-3.5 w-3.5" />
                                </span>
                                Agregar tipo
                              </div>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Marca</Label>
                      <Input
                        placeholder="Ej: Ford"
                        value={form.marca}
                        onChange={(e) => setForm((prev) => ({ ...prev, marca: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Modelo</Label>
                      <Input
                        placeholder="Ej: F-150"
                        value={form.modelo}
                        onChange={(e) => setForm((prev) => ({ ...prev, modelo: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Placas</Label>
                      <Input
                        placeholder="MX-123-ABC"
                        value={form.placas}
                        onChange={(e) => setForm((prev) => ({ ...prev, placas: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>No. Serie</Label>
                      <Input
                        placeholder="CAT123456789"
                        value={form.numeroSerie}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, numeroSerie: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Ubicación</Label>
                    <Input
                      placeholder="Ej: Obra Centro"
                      value={form.ubicacion}
                      onChange={(e) => setForm((prev) => ({ ...prev, ubicacion: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Horómetro Inicial (hrs)</Label>
                      <Input
                        type="number"
                        placeholder="1500"
                        value={form.horometroInicial}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, horometroInicial: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Horómetro Final (hrs)</Label>
                      <Input
                        type="number"
                        placeholder="8000"
                        value={form.horometroFinal}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, horometroFinal: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  {isEdit && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Horómetro Actual (hrs)</Label>
                        <Input
                          type="number"
                          placeholder="2340"
                          value={form.horometroActual}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, horometroActual: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Estado</Label>
                        <Select
                          value={form.estado}
                          onValueChange={(value) =>
                            setForm((prev) => ({ ...prev, estado: value as MaquinaEstado }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {estados.map((est) => (
                              <SelectItem key={est} value={est}>
                                {est}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Disponibilidad (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="92"
                        value={form.disponibilidad}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, disponibilidad: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fecha Adquisición</Label>
                      <Input
                        type="date"
                        value={form.fechaAdquisicion}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, fechaAdquisicion: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-3 pt-2 border-t">
                    <h4 className="text-sm font-semibold text-gray-800">Documentación</h4>
                    <div className="space-y-1">
                      <Label>Tipo de combustible</Label>
                      <Input
                        placeholder="Ej: Diésel"
                        value={form.tipoCombustible}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, tipoCombustible: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Pedimento</Label>
                        <Input
                          value={form.pedimento}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, pedimento: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>No. Pedimento</Label>
                        <Input
                          value={form.pedimentoNumero}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, pedimentoNumero: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <DocumentUploadBlock
                      label="Subir pedimento (PDF, DOC, DOCX, JPG/PNG, máx 5MB)"
                      removeLabel="Quitar pedimento"
                      path={form.pedimentoArchivoPath}
                      file={form.pedimentoArchivoFile}
                      remove={form.removePedimentoArchivo}
                      onFileChange={(file) =>
                        setForm((prev) => ({
                          ...prev,
                          pedimentoArchivoFile: file,
                          removePedimentoArchivo: false,
                        }))
                      }
                      onRemoveChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          removePedimentoArchivo: checked,
                          ...(checked ? { pedimentoArchivoFile: null } : {}),
                        }))
                      }
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Costo del vehículo</Label>
                        <Input
                          type="number"
                          step="1.00"
                          min="0"
                          placeholder="0.00"
                          value={form.costoVehiculo}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, costoVehiculo: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Fecha de factura</Label>
                        <Input
                          type="date"
                          value={form.fechaFactura}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, fechaFactura: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>A quién se le compró</Label>
                      <Input
                        placeholder="Concesionaria / vendedor"
                        value={form.compradoA}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, compradoA: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label>Factura</Label>
                        <Input
                          value={form.factura}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, factura: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>No. Factura</Label>
                        <Input
                          value={form.facturaNumero}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, facturaNumero: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Importe</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={form.facturaImporte}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, facturaImporte: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Tarjetón</Label>
                        <Input
                          value={form.tarjeton}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, tarjeton: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>No. Tarjetón</Label>
                        <Input
                          value={form.tarjetonNumero}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, tarjetonNumero: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Contrato de compraventa</Label>
                      <Input
                        value={form.contratoCompraventa}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, contratoCompraventa: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Seguro</Label>
                        <Input
                          value={form.seguro}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, seguro: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Vigencia</Label>
                        <Input
                          type="date"
                          value={form.seguroVigencia}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, seguroVigencia: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <DocumentUploadBlock
                      label="Subir póliza de seguro (PDF, DOC, DOCX, JPG/PNG, máx 5MB)"
                      removeLabel="Quitar póliza de seguro"
                      path={form.polizaSeguroPath}
                      file={form.polizaSeguroFile}
                      remove={form.removePolizaSeguro}
                      onFileChange={(file) =>
                        setForm((prev) => ({
                          ...prev,
                          polizaSeguroFile: file,
                          removePolizaSeguro: false,
                        }))
                      }
                      onRemoveChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          removePolizaSeguro: checked,
                          ...(checked ? { polizaSeguroFile: null } : {}),
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2 rounded-lg border p-3">
                    <Label>Foto de portada (JPG/PNG, máx 2MB)</Label>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setForm((prev) => ({
                          ...prev,
                          fotoPortadaFile: file,
                          removeFotoPortada: false,
                        }));
                        e.target.value = "";
                      }}
                    />
                    {previewPortadaUrl && (
                      <img
                        src={previewPortadaUrl}
                        alt="Portada de máquina"
                        className="h-28 w-full rounded-md border object-cover"
                      />
                    )}
                    {(form.fotoPortadaPath || form.fotoPortadaFile) && !form.removeFotoPortada && (
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Quitar portada</Label>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              removeFotoPortada: true,
                              fotoPortadaFile: null,
                            }))
                          }
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                          aria-label="Quitar portada"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Edit className="h-4 w-4" /> Checklist Diario
                  </h3>
                  <p className="text-xs text-gray-500">
                    Puntos de inspección diaria para esta máquina.
                  </p>

                  {form.checklistItems.length > 0 && (
                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                      {form.checklistItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-gray-50 border rounded px-2 py-1.5"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-mono text-gray-400 shrink-0">
                              {idx + 1}.
                            </span>
                            <span className="text-sm text-gray-800 truncate">{item.label}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {item.itemType === "check"
                                ? "✓"
                                : `#${item.unit ? ` ${item.unit}` : ""}`}
                            </Badge>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeChecklistItem(item.id)}
                            className="text-gray-400 hover:text-red-500 shrink-0 ml-1"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Input
                      placeholder="Nombre del punto (ej: Nivel de aceite)"
                      value={newItemLabel}
                      onChange={(e) => setNewItemLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addChecklistItem();
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Select
                        value={newItemType}
                        onValueChange={(v) => setNewItemType(v as "check" | "number")}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="check">✓ Check</SelectItem>
                          <SelectItem value="number"># Numérico</SelectItem>
                        </SelectContent>
                      </Select>
                      {newItemType === "number" && (
                        <Input
                          placeholder="Unidad"
                          value={newItemUnit}
                          onChange={(e) => setNewItemUnit(e.target.value)}
                          className="w-20"
                        />
                      )}
                      <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
                      </Button>
                    </div>
                  </div>

                  {form.checklistItems.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">
                      Sin puntos de inspección aún.
                    </p>
                  )}
                </div>

              <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Wrench className="h-4 w-4" /> Planes de Servicio
                  </h3>
                  <p className="text-xs text-gray-500">
                    Programa los mantenimientos y las piezas necesarias del inventario.
                  </p>

                  {form.planesServicio.length > 0 && (
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {form.planesServicio.map((plan) => (
                        <div key={plan.id} className="border rounded-lg bg-gray-50">
                          <div
                            className="flex items-center justify-between px-3 py-2 cursor-pointer"
                            onClick={() =>
                              setEditingServiceId(editingServiceId === plan.id ? null : plan.id)
                            }
                          >
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-gray-900">
                                {plan.nombre}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                Cada {plan.frecuenciaValor}{" "}
                                {plan.frecuenciaTipo === "km"
                                  ? "km"
                                  : plan.frecuenciaTipo === "hrs"
                                  ? "hrs"
                                  : "meses"}
                              </span>
                              {plan.piezas.length > 0 && (
                                <Badge variant="secondary" className="ml-2 text-[10px]">
                                  {plan.piezas.length} piezas
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {editingServiceId === plan.id ? (
                                <ChevronUp className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeServicePlan(plan.id);
                                }}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {editingServiceId === plan.id && (
                            <div className="border-t px-3 py-2 space-y-2">
                              <Input
                                placeholder="Buscar pieza del inventario..."
                                value={servicePiezaSearch}
                                onChange={(e) => setServicePiezaSearch(e.target.value)}
                                className="h-8 text-sm"
                              />
                              <div className="max-h-[160px] overflow-y-auto space-y-1">
                                {inventario.length === 0 && (
                                  <p className="text-xs text-gray-400 text-center py-2">
                                    No hay artículos en el inventario.
                                  </p>
                                )}
                                {inventario
                                  .filter(
                                    (inv) =>
                                      inv.nombre
                                        .toLowerCase()
                                        .includes(servicePiezaSearch.toLowerCase()) ||
                                      (inv.categoria || "")
                                        .toLowerCase()
                                        .includes(servicePiezaSearch.toLowerCase())
                                  )
                                  .map((inv) => {
                                    const pieza = plan.piezas.find((p) => p.articuloId === inv.id);
                                    const isSelected = !!pieza;
                                    return (
                                      <div
                                        key={inv.id}
                                        className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-white"
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() =>
                                            togglePiezaInService(plan.id, inv.id)
                                          }
                                        />
                                        <span className="text-xs text-gray-700 truncate flex-1">
                                          {inv.nombre}
                                        </span>
                                        {isSelected && (
                                          <Input
                                            type="number"
                                            min={1}
                                            value={pieza!.cantidad}
                                            onChange={(e) =>
                                              updatePiezaCantidad(
                                                plan.id,
                                                inv.id,
                                                parseInt(e.target.value) || 1
                                              )
                                            }
                                            className="h-6 w-14 text-xs text-center"
                                          />
                                        )}
                                        {inv.categoria && (
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] shrink-0"
                                          >
                                            {inv.categoria}
                                          </Badge>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                              {plan.piezas.length > 0 && (
                                <div className="pt-1 border-t">
                                  <p className="text-[10px] font-medium text-gray-500 mb-1">
                                    Piezas seleccionadas:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {plan.piezas.map((p) => {
                                      const inv = inventario.find((i) => i.id === p.articuloId);
                                      return inv ? (
                                        <Badge
                                          key={p.articuloId}
                                          variant="secondary"
                                          className="text-[10px] gap-1"
                                        >
                                          {inv.nombre} <span className="font-bold">×{p.cantidad}</span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              togglePiezaInService(plan.id, p.articuloId)
                                            }
                                            className="hover:text-red-500"
                                          >
                                            <X className="h-2.5 w-2.5" />
                                          </button>
                                        </Badge>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 border border-dashed rounded-lg p-3">
                    <Input
                      placeholder="Nombre del servicio (ej: Servicio Menor)"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Cada..."
                        value={newServiceFreqValor}
                        onChange={(e) => setNewServiceFreqValor(e.target.value)}
                        className="w-24"
                      />
                      <Select
                        value={newServiceFreqTipo}
                        onValueChange={(v) =>
                          setNewServiceFreqTipo(v as "km" | "hrs" | "meses")
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="km">Kilómetros</SelectItem>
                          <SelectItem value="hrs">Horas</SelectItem>
                          <SelectItem value="meses">Meses</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addServicePlan}
                        className="shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Crear
                      </Button>
                    </div>
                  </div>

                  {form.planesServicio.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">
                      Sin planes de servicio aún.
                    </p>
                  )}
                </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting
                  ? "Guardando..."
                  : isEdit
                  ? "Guardar Cambios"
                  : "Crear Máquina / Vehículo"}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={claseDialogOpen} onOpenChange={setClaseDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva clase</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveClaseMutation.mutate();
          }}
        >
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input
              value={claseForm.nombre}
              onChange={(e) => setClaseForm((p) => ({ ...p, nombre: e.target.value }))}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={claseForm.activo}
              onCheckedChange={(v) => setClaseForm((p) => ({ ...p, activo: Boolean(v) }))}
            />
            <Label>Activo</Label>
          </div>
          <Button type="submit" disabled={saveClaseMutation.isPending}>
            Guardar
          </Button>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={tipoDialogOpen} onOpenChange={setTipoDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo tipo</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveTipoMutation.mutate();
          }}
        >
          <div className="space-y-1">
            <Label>Clase</Label>
            <Select value={tipoForm.claseId} disabled>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar clase" />
              </SelectTrigger>
              <SelectContent>
                {clasesActivas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input
              value={tipoForm.nombre}
              onChange={(e) => setTipoForm((p) => ({ ...p, nombre: e.target.value }))}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={tipoForm.activo}
              onCheckedChange={(v) => setTipoForm((p) => ({ ...p, activo: Boolean(v) }))}
            />
            <Label>Activo</Label>
          </div>
          <Button type="submit" disabled={saveTipoMutation.isPending}>
            Guardar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
