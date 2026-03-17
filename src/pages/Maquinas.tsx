import { useState, useRef } from "react";
import { Plus, Search, Filter, Edit, Trash2, Truck, Building, Calendar, Gauge, X, Wrench, ChevronDown, ChevronUp, QrCode, Printer, Share2, Download } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

// Inventario disponible (conectado al módulo de inventario)
const inventarioDisponible = [
  { id: "INV-001", nombre: "Filtro hidráulico de alta presión", categoria: "Filtros" },
  { id: "INV-002", nombre: "Aceite hidráulico ISO 46", categoria: "Lubricantes" },
  { id: "INV-003", nombre: "Bomba de combustible eléctrica", categoria: "Componentes" },
  { id: "INV-004", nombre: "Kit de sellos y empaques", categoria: "Repuestos" },
  { id: "INV-005", nombre: "Sensor de temperatura", categoria: "Electrónicos" },
  { id: "INV-006", nombre: "Correa de transmisión", categoria: "Correas" },
  { id: "INV-007", nombre: "Filtro de aceite motor", categoria: "Filtros" },
  { id: "INV-008", nombre: "Filtro de aire primario", categoria: "Filtros" },
  { id: "INV-009", nombre: "Filtro de combustible", categoria: "Filtros" },
  { id: "INV-010", nombre: "Aceite de motor 15W-40", categoria: "Lubricantes" },
  { id: "INV-011", nombre: "Grasa multiusos EP2", categoria: "Lubricantes" },
  { id: "INV-012", nombre: "Pastillas de freno", categoria: "Repuestos" },
  { id: "INV-013", nombre: "Banda de alternador", categoria: "Correas" },
  { id: "INV-014", nombre: "Refrigerante anticongelante", categoria: "Lubricantes" },
];

// Datos de ejemplo - Máquinas por cliente
const maquinas = [
  {
    id: 1,
    nombre: "Excavadora CAT 320",
    tipo: "Excavadora",
    marca: "Caterpillar",
    modelo: "320 GC",
    placas: "MX-123-ABC",
    numeroSerie: "CAT123456789",
    cliente: "Constructora ABC",
    estado: "Operativa",
    horometroInicial: 1500,
    horometroActual: 2340,
    horometroFinal: 8000,
    disponibilidad: 92,
    fechaAdquisicion: "2022-03-15",
    ubicacion: "Obra Centro",
    ultimoMantenimiento: "2024-02-15"
  },
  {
    id: 2,
    nombre: "Grúa Tower Crane 50",
    tipo: "Grúa",
    marca: "Liebherr",
    modelo: "150 EC-B",
    placas: "MX-456-DEF",
    numeroSerie: "LIE987654321",
    cliente: "Constructora ABC",
    estado: "Operativa",
    horometroInicial: 800,
    horometroActual: 1650,
    horometroFinal: 6000,
    disponibilidad: 88,
    fechaAdquisicion: "2023-01-20",
    ubicacion: "Obra Centro",
    ultimoMantenimiento: "2024-01-30"
  },
  {
    id: 3,
    nombre: "Bulldozer D6",
    tipo: "Bulldozer",
    marca: "Caterpillar", 
    modelo: "D6T",
    placas: "MX-789-GHI",
    numeroSerie: "CAT456789123",
    cliente: "Constructora ABC",
    estado: "Mantenimiento",
    horometroInicial: 2200,
    horometroActual: 3890,
    horometroFinal: 10000,
    disponibilidad: 75,
    fechaAdquisicion: "2021-11-10",
    ubicacion: "Taller Principal",
    ultimoMantenimiento: "2024-03-01"
  },
  {
    id: 4,
    nombre: "Pavimentadora P385",
    tipo: "Pavimentadora",
    marca: "Volvo",
    modelo: "P6820D",
    placas: "MX-101-JKL",
    numeroSerie: "VOL789123456",
    cliente: "Municipalidad",
    estado: "Operativa",
    horometroInicial: 900,
    horometroActual: 1456,
    horometroFinal: 7000,
    disponibilidad: 95,
    fechaAdquisicion: "2023-06-05",
    ubicacion: "Carretera Norte",
    ultimoMantenimiento: "2024-02-20"
  },
  {
    id: 5,
    nombre: "Compactadora CS-533",
    tipo: "Compactadora",
    marca: "Caterpillar",
    modelo: "CS-533E",
    placas: "MX-202-MNO",
    numeroSerie: "CAT654321987",
    cliente: "Municipalidad",
    estado: "Operativa",
    horometroInicial: 600,
    horometroActual: 1234,
    horometroFinal: 5500,
    disponibilidad: 90,
    fechaAdquisicion: "2023-08-12",
    ubicacion: "Carretera Norte",
    ultimoMantenimiento: "2024-02-10"
  },
  {
    id: 6,
    nombre: "Montacargas FL-200",
    tipo: "Montacargas",
    marca: "Toyota",
    modelo: "8FD25",
    placas: "MX-303-PQR",
    numeroSerie: "TOY321654987",
    cliente: "Industrias DEF",
    estado: "Disponible",
    horometroInicial: 300,
    horometroActual: 890,
    horometroFinal: 4000,
    disponibilidad: 98,
    fechaAdquisicion: "2023-12-01",
    ubicacion: "Almacén Central",
    ultimoMantenimiento: "2024-01-15"
  }
];

const clientes = ["Constructora ABC", "Municipalidad", "Industrias DEF", "Inmobiliaria XYZ"];
const clienteActual = "Constructora ABC"; // En producción esto vendría del contexto de autenticación
const tiposMaquina = ["Excavadora", "Grúa", "Bulldozer", "Pavimentadora", "Compactadora", "Montacargas", "Camión", "Retroexcavadora"];
const marcas = ["Caterpillar", "Liebherr", "Volvo", "Toyota", "JCB", "Komatsu", "John Deere"];
const estados = ["Operativa", "Disponible", "Mantenimiento", "Fuera de Servicio"];

interface ServicePiezaDef {
  invId: string;
  cantidad: number;
}

interface ServicePlanDef {
  id: string;
  nombre: string;
  frecuenciaTipo: "km" | "hrs" | "meses";
  frecuenciaValor: string;
  piezas: ServicePiezaDef[];
}

interface ChecklistItemDef {
  id: string;
  label: string;
  type: "check" | "number";
  unit?: string;
}

export default function Maquinas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qrMaquina, setQrMaquina] = useState<typeof maquinas[0] | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "",
    marca: "",
    modelo: "",
    placas: "",
    numeroSerie: "",
    cliente: clienteActual,
    horometroInicial: "",
    horometroFinal: "",
    disponibilidad: "",
    fechaAdquisicion: "",
    ubicacion: "",
  });

  const [checklistItems, setChecklistItems] = useState<ChecklistItemDef[]>([]);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemType, setNewItemType] = useState<"check" | "number">("check");
  const [newItemUnit, setNewItemUnit] = useState("");

  // Service plans state
  const [servicePlans, setServicePlans] = useState<ServicePlanDef[]>([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceFreqTipo, setNewServiceFreqTipo] = useState<"km" | "hrs" | "meses">("km");
  const [newServiceFreqValor, setNewServiceFreqValor] = useState("");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [servicePiezaSearch, setServicePiezaSearch] = useState("");

  const addChecklistItem = () => {
    if (!newItemLabel.trim()) return;
    setChecklistItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: newItemLabel.trim(),
        type: newItemType,
        unit: newItemType === "number" ? newItemUnit.trim() || undefined : undefined,
      },
    ]);
    setNewItemLabel("");
    setNewItemUnit("");
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addServicePlan = () => {
    if (!newServiceName.trim() || !newServiceFreqValor.trim()) return;
    setServicePlans((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nombre: newServiceName.trim(),
        frecuenciaTipo: newServiceFreqTipo,
        frecuenciaValor: newServiceFreqValor.trim(),
        piezas: [],
      },
    ]);
    setNewServiceName("");
    setNewServiceFreqValor("");
  };

  const removeServicePlan = (id: string) => {
    setServicePlans((prev) => prev.filter((s) => s.id !== id));
    if (editingServiceId === id) setEditingServiceId(null);
  };

  const togglePiezaInService = (serviceId: string, invId: string) => {
    setServicePlans((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              piezas: s.piezas.some((p) => p.invId === invId)
                ? s.piezas.filter((p) => p.invId !== invId)
                : [...s.piezas, { invId, cantidad: 1 }],
            }
          : s
      )
    );
  };

  const updatePiezaCantidad = (serviceId: string, invId: string, cantidad: number) => {
    if (cantidad < 1) return;
    setServicePlans((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              piezas: s.piezas.map((p) => (p.invId === invId ? { ...p, cantidad } : p)),
            }
          : s
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Crear máquina:", formData, "Checklist:", checklistItems, "Servicios:", servicePlans);
    setIsDialogOpen(false);
    setFormData({
      nombre: "",
      tipo: "",
      marca: "",
      modelo: "",
      placas: "",
      numeroSerie: "",
      cliente: clienteActual,
      horometroInicial: "",
      horometroFinal: "",
      disponibilidad: "",
      fechaAdquisicion: "",
      ubicacion: "",
    });
    setChecklistItems([]);
    setServicePlans([]);
  };

  // Filtrar solo las máquinas del cliente actual
  const maquinasDelCliente = maquinas.filter(m => m.cliente === clienteActual);
  
  const filteredMaquinas = maquinasDelCliente.filter((maquina) => {
    const matchesSearch = 
      maquina.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.placas.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = !selectedTipo || maquina.tipo === selectedTipo;
    const matchesEstado = !selectedEstado || maquina.estado === selectedEstado;
    return matchesSearch && matchesTipo && matchesEstado;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Operativa": return "bg-green-100 text-green-800";
      case "Disponible": return "bg-blue-100 text-blue-800";
      case "Mantenimiento": return "bg-yellow-100 text-yellow-800";
      case "Fuera de Servicio": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDisponibilidadColor = (disponibilidad: number) => {
    if (disponibilidad >= 90) return "text-green-600";
    if (disponibilidad >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const calcularVidaUtil = (inicial: number, actual: number, final: number) => {
    const progreso = ((actual - inicial) / (final - inicial)) * 100;
    return Math.min(Math.max(progreso, 0), 100);
  };

  // Estadísticas basadas en las máquinas del cliente actual
  const totalMaquinas = maquinasDelCliente.length;
  const maquinasOperativas = maquinasDelCliente.filter(m => m.estado === "Operativa").length;
  const maquinasDisponibles = maquinasDelCliente.filter(m => m.estado === "Disponible").length;
  const promedioDisponibilidad = maquinasDelCliente.length > 0 
    ? Math.round(maquinasDelCliente.reduce((sum, m) => sum + m.disponibilidad, 0) / maquinasDelCliente.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Máquinas</h1>
          <p className="text-gray-600 mt-1">
            Inventario de máquinas de {clienteActual}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Máquina
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Agregar Nueva Máquina / Vehículo</DialogTitle>
              <p className="text-sm text-gray-500">Completa los datos, define el checklist diario y programa los servicios.</p>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* ═══ COLUMNA LAYOUT: Datos + Checklist + Servicios ═══ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── COL 1: Datos Generales ── */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Truck className="h-4 w-4" /> Datos Generales
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Nombre</Label>
                      <Input placeholder="Ej: Camioneta Ford F-150" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Tipo</Label>
                      <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                        <SelectContent>
                          {tiposMaquina.map((tipo) => (<SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Marca</Label>
                        <Input placeholder="Ej: Ford" value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} required />
                      </div>
                      <div className="space-y-1">
                        <Label>Modelo</Label>
                        <Input placeholder="Ej: F-150" value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Placas</Label>
                        <Input placeholder="MX-123-ABC" value={formData.placas} onChange={(e) => setFormData({ ...formData, placas: e.target.value })} required />
                      </div>
                      <div className="space-y-1">
                        <Label>No. Serie</Label>
                        <Input placeholder="CAT123456789" value={formData.numeroSerie} onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })} required />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Ubicación</Label>
                      <Input placeholder="Ej: Obra Centro" value={formData.ubicacion} onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Horómetro Inicial (hrs)</Label>
                        <Input type="number" placeholder="1500" value={formData.horometroInicial} onChange={(e) => setFormData({ ...formData, horometroInicial: e.target.value })} required />
                      </div>
                      <div className="space-y-1">
                        <Label>Horómetro Final (hrs)</Label>
                        <Input type="number" placeholder="8000" value={formData.horometroFinal} onChange={(e) => setFormData({ ...formData, horometroFinal: e.target.value })} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Disponibilidad (%)</Label>
                        <Input type="number" min="0" max="100" placeholder="92" value={formData.disponibilidad} onChange={(e) => setFormData({ ...formData, disponibilidad: e.target.value })} required />
                      </div>
                      <div className="space-y-1">
                        <Label>Fecha Adquisición</Label>
                        <Input type="date" value={formData.fechaAdquisicion} onChange={(e) => setFormData({ ...formData, fechaAdquisicion: e.target.value })} required />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── COL 2: Checklist Diario ── */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Edit className="h-4 w-4" /> Checklist Diario
                  </h3>
                  <p className="text-xs text-gray-500">Puntos de inspección diaria para esta máquina.</p>

                  {checklistItems.length > 0 && (
                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                      {checklistItems.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-50 border rounded px-2 py-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-mono text-gray-400 shrink-0">{idx + 1}.</span>
                            <span className="text-sm text-gray-800 truncate">{item.label}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {item.type === "check" ? "✓" : `#${item.unit ? ` ${item.unit}` : ""}`}
                            </Badge>
                          </div>
                          <button type="button" onClick={() => removeChecklistItem(item.id)} className="text-gray-400 hover:text-red-500 shrink-0 ml-1">
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
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChecklistItem(); } }}
                    />
                    <div className="flex gap-2">
                      <Select value={newItemType} onValueChange={(v) => setNewItemType(v as "check" | "number")}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="check">✓ Check</SelectItem>
                          <SelectItem value="number"># Numérico</SelectItem>
                        </SelectContent>
                      </Select>
                      {newItemType === "number" && (
                        <Input placeholder="Unidad" value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)} className="w-20" />
                      )}
                      <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
                      </Button>
                    </div>
                  </div>

                  {checklistItems.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">
                      Sin puntos de inspección aún.
                    </p>
                  )}
                </div>

                {/* ── COL 3: Planes de Servicio ── */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Wrench className="h-4 w-4" /> Planes de Servicio
                  </h3>
                  <p className="text-xs text-gray-500">Programa los mantenimientos y las piezas necesarias del inventario.</p>

                  {/* Lista de servicios creados */}
                  {servicePlans.length > 0 && (
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {servicePlans.map((plan) => (
                        <div key={plan.id} className="border rounded-lg bg-gray-50">
                          <div
                            className="flex items-center justify-between px-3 py-2 cursor-pointer"
                            onClick={() => setEditingServiceId(editingServiceId === plan.id ? null : plan.id)}
                          >
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-gray-900">{plan.nombre}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                Cada {plan.frecuenciaValor} {plan.frecuenciaTipo === "km" ? "km" : plan.frecuenciaTipo === "hrs" ? "hrs" : "meses"}
                              </span>
                              {plan.piezas.length > 0 && (
                                <Badge variant="secondary" className="ml-2 text-[10px]">{plan.piezas.length} piezas</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {editingServiceId === plan.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                              <button type="button" onClick={(e) => { e.stopPropagation(); removeServicePlan(plan.id); }} className="text-gray-400 hover:text-red-500">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Panel expandido: selección de piezas */}
                          {editingServiceId === plan.id && (
                            <div className="border-t px-3 py-2 space-y-2">
                              <Input
                                placeholder="Buscar pieza del inventario..."
                                value={servicePiezaSearch}
                                onChange={(e) => setServicePiezaSearch(e.target.value)}
                                className="h-8 text-sm"
                              />
                              <div className="max-h-[160px] overflow-y-auto space-y-1">
                                {inventarioDisponible
                                  .filter((inv) =>
                                    inv.nombre.toLowerCase().includes(servicePiezaSearch.toLowerCase()) ||
                                    inv.categoria.toLowerCase().includes(servicePiezaSearch.toLowerCase())
                                  )
                                  .map((inv) => {
                                    const pieza = plan.piezas.find((p) => p.invId === inv.id);
                                    const isSelected = !!pieza;
                                    return (
                                      <div key={inv.id} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-white">
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() => togglePiezaInService(plan.id, inv.id)}
                                        />
                                        <span className="text-xs text-gray-700 truncate flex-1">{inv.nombre}</span>
                                        {isSelected && (
                                          <Input
                                            type="number"
                                            min={1}
                                            value={pieza!.cantidad}
                                            onChange={(e) => updatePiezaCantidad(plan.id, inv.id, parseInt(e.target.value) || 1)}
                                            className="h-6 w-14 text-xs text-center"
                                          />
                                        )}
                                        <Badge variant="outline" className="text-[9px] shrink-0">{inv.categoria}</Badge>
                                      </div>
                                    );
                                  })}
                              </div>
                              {plan.piezas.length > 0 && (
                                <div className="pt-1 border-t">
                                  <p className="text-[10px] font-medium text-gray-500 mb-1">Piezas seleccionadas:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {plan.piezas.map((p) => {
                                      const inv = inventarioDisponible.find((i) => i.id === p.invId);
                                      return inv ? (
                                        <Badge key={p.invId} variant="secondary" className="text-[10px] gap-1">
                                          {inv.nombre} <span className="font-bold">×{p.cantidad}</span>
                                          <button type="button" onClick={() => togglePiezaInService(plan.id, p.invId)} className="hover:text-red-500">
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

                  {/* Agregar nuevo servicio */}
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
                      <Select value={newServiceFreqTipo} onValueChange={(v) => setNewServiceFreqTipo(v as "km" | "hrs" | "meses")}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="km">Kilómetros</SelectItem>
                          <SelectItem value="hrs">Horas</SelectItem>
                          <SelectItem value="meses">Meses</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="sm" onClick={addServicePlan} className="shrink-0">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Crear
                      </Button>
                    </div>
                  </div>

                  {servicePlans.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">
                      Sin planes de servicio aún.
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Crear Máquina / Vehículo
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Máquinas"
          value={totalMaquinas}
          icon={Truck}
          trend={{ value: 2, isPositive: true }}
        />
        <StatCard
          title="Operativas"
          value={maquinasOperativas}
          icon={Gauge}
          trend={{ value: 1, isPositive: true }}
        />
        <StatCard
          title="Disponibles"
          value={maquinasDisponibles}
          icon={Calendar}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Disponibilidad Promedio"
          value={`${promedioDisponibilidad}%`}
          icon={Building}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, tipo o placas..."
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
                  {tiposMaquina.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
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

      {/* Tabla de Máquinas */}
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
                const vidaUtil = calcularVidaUtil(maquina.horometroInicial, maquina.horometroActual, maquina.horometroFinal);
                
                return (
                  <TableRow key={maquina.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{maquina.nombre}</div>
                        <div className="text-sm text-gray-600">
                          {maquina.marca} {maquina.modelo}
                        </div>
                        <div className="text-xs text-gray-500">
                          Placas: {maquina.placas}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(maquina.estado)}>
                        {maquina.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {maquina.horometroActual.toLocaleString()} hrs
                        </div>
                        <div className="text-xs text-gray-600">
                          Inicial: {maquina.horometroInicial.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">
                          Final: {maquina.horometroFinal.toLocaleString()}
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
                          {(maquina.horometroFinal - maquina.horometroActual).toLocaleString()} hrs restantes
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getDisponibilidadColor(maquina.disponibilidad)}`}>
                          {maquina.disponibilidad}%
                        </div>
                        <div className="text-xs text-gray-500">
                          disponible
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">
                          {maquina.ubicacion}
                        </div>
                        <div className="text-xs text-gray-500">
                          Últ. mant: {new Date(maquina.ultimoMantenimiento).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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
          
          {filteredMaquinas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron máquinas que coincidan con los filtros
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal QR */}
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
              <div ref={qrRef} className="flex flex-col items-center gap-3 p-6 bg-background rounded-lg border">
                <QRCodeSVG
                  value={JSON.stringify({
                    id: qrMaquina.id,
                    nombre: qrMaquina.nombre,
                    marca: qrMaquina.marca,
                    modelo: qrMaquina.modelo,
                    placas: qrMaquina.placas,
                    serie: qrMaquina.numeroSerie,
                  })}
                  size={200}
                  level="H"
                  includeMargin
                />
                <p className="text-sm font-medium text-foreground">{qrMaquina.nombre}</p>
                <p className="text-xs text-muted-foreground">{qrMaquina.marca} {qrMaquina.modelo} · {qrMaquina.placas}</p>
                <p className="text-xs text-muted-foreground">S/N: {qrMaquina.numeroSerie}</p>
              </div>
              <div className="flex gap-2 justify-center">
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
                    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
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
                      <script>window.print();window.close();<\/script></body></html>
                    `);
                    printWindow.document.close();
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                {navigator.share && (
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
                          const file = new File([blob], `QR-${qrMaquina.nombre}.png`, { type: "image/png" });
                          try {
                            await navigator.share({ title: `QR ${qrMaquina.nombre}`, files: [file] });
                          } catch {}
                        });
                      };
                      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}