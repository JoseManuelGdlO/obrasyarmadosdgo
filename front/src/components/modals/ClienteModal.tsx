import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ClienteFormData = {
  nombre: string;
  tipoIndustria: string;
  pais: string;
  ciudad: string;
  encargadoNombre: string;
  telefono: string;
  estado: "activo" | "en_configuracion" | "suspendido" | "inactivo";
};

const defaultForm: ClienteFormData = {
  nombre: "",
  tipoIndustria: "",
  pais: "",
  ciudad: "",
  encargadoNombre: "",
  telefono: "",
  estado: "activo",
};

interface ClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClienteFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<ClienteFormData> | null;
}

export default function ClienteModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
}: ClienteModalProps) {
  const [form, setForm] = useState<ClienteFormData>(defaultForm);
  const isEdit = useMemo(() => Boolean(initialData), [initialData]);

  useEffect(() => {
    if (open) {
      setForm({ ...defaultForm, ...(initialData || {}) });
    }
  }, [open, initialData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
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
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo industria</Label>
              <Input
                value={form.tipoIndustria}
                onChange={(e) => setForm((prev) => ({ ...prev, tipoIndustria: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <Input value={form.pais} onChange={(e) => setForm((prev) => ({ ...prev, pais: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input value={form.ciudad} onChange={(e) => setForm((prev) => ({ ...prev, ciudad: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Nombre del encargado</Label>
              <Input
                value={form.encargadoNombre}
                onChange={(e) => setForm((prev) => ({ ...prev, encargadoNombre: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={form.telefono}
                onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(value: ClienteFormData["estado"]) => setForm((prev) => ({ ...prev, estado: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="en_configuracion">En Configuración</SelectItem>
                  <SelectItem value="suspendido">Suspendido</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cliente"}
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
