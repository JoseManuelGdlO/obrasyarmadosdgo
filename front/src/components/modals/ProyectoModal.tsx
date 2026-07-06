import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ProyectoFormData = {
  clienteId: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  fechaInicio: string;
  fechaFin: string;
  fechaModificatoria: string;
  estado: "planeado" | "en_progreso" | "pausado" | "completado";
  presupuesto: string;
  progreso: string;
  precioEstimado: string;
  cantidadContrato: string;
  modificacionContrato: string;
  responsable: string;
};

const defaultForm: ProyectoFormData = {
  clienteId: "",
  nombre: "",
  descripcion: "",
  ubicacion: "",
  fechaInicio: "",
  fechaFin: "",
  fechaModificatoria: "",
  estado: "planeado",
  presupuesto: "0",
  progreso: "0",
  precioEstimado: "0",
  cantidadContrato: "0",
  modificacionContrato: "0",
  responsable: "",
};

type ClienteOption = { id: string; nombre: string };

interface ProyectoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProyectoFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<ProyectoFormData> | null;
  clientes: ClienteOption[];
}

export default function ProyectoModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  clientes,
}: ProyectoModalProps) {
  const [form, setForm] = useState<ProyectoFormData>(defaultForm);
  const isEdit = useMemo(() => Boolean(initialData), [initialData]);

  const totalContrato = useMemo(() => {
    const cantidad = Number(form.cantidadContrato || 0);
    const modificacion = Number(form.modificacionContrato || 0);
    return cantidad + modificacion;
  }, [form.cantidadContrato, form.modificacionContrato]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  useEffect(() => {
    if (open) {
      setForm({ ...defaultForm, ...(initialData || {}) });
    }
  }, [open, initialData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Proyecto" : "Nuevo Proyecto"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={form.clienteId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, clienteId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre del Proyecto</Label>
              <Input
                value={form.nombre}
                onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input
                value={form.ubicacion}
                onChange={(event) => setForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Input
                value={form.responsable}
                onChange={(event) => setForm((prev) => ({ ...prev, responsable: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha inicio</Label>
              <Input
                type="date"
                value={form.fechaInicio}
                onChange={(event) => setForm((prev) => ({ ...prev, fechaInicio: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha fin (término)</Label>
              <Input
                type="date"
                value={form.fechaFin}
                onChange={(event) => setForm((prev) => ({ ...prev, fechaFin: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha modificatoria</Label>
              <Input
                type="date"
                value={form.fechaModificatoria}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fechaModificatoria: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Cantidad contrato</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.cantidadContrato}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, cantidadContrato: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Modificación contrato</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.modificacionContrato}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, modificacionContrato: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Total contrato</Label>
              <Input value={formatCurrency(totalContrato)} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={form.estado}
                onValueChange={(value: ProyectoFormData["estado"]) =>
                  setForm((prev) => ({ ...prev, estado: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planeado">Pendiente</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="pausado">Suspendido</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Presupuesto</Label>
              <Input
                type="number"
                min="0"
                value={form.presupuesto}
                onChange={(event) => setForm((prev) => ({ ...prev, presupuesto: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Progreso (%)</Label>
              <Input
                type="number"
                min="0"
                step={1}
                value={form.progreso}
                onChange={(event) => setForm((prev) => ({ ...prev, progreso: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Precio estimado</Label>
              <Input
                type="number"
                min="0"
                step={1}
                value={form.precioEstimado}
                onChange={(event) => setForm((prev) => ({ ...prev, precioEstimado: event.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={form.descripcion}
              onChange={(event) => setForm((prev) => ({ ...prev, descripcion: event.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear proyecto"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
