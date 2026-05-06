import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type NomenclaturaFormData = {
  codigo: string;
  descripcion: string;
  categoria: string;
  activo: boolean;
};

const defaultForm: NomenclaturaFormData = {
  codigo: "",
  descripcion: "",
  categoria: "",
  activo: true,
};

interface NomenclaturaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NomenclaturaFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<NomenclaturaFormData> | null;
  categorias: string[];
}

export default function NomenclaturaModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  categorias,
}: NomenclaturaModalProps) {
  const [form, setForm] = useState<NomenclaturaFormData>(defaultForm);
  const isEdit = useMemo(() => Boolean(initialData), [initialData]);

  useEffect(() => {
    if (open) {
      setForm({ ...defaultForm, ...(initialData || {}) });
    }
  }, [open, initialData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Nomenclatura" : "Crear Nueva Nomenclatura"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              placeholder="Ej: MCU"
              value={form.codigo}
              onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Ej: MANTENIMIENTO CORRECTIVO URGENTE"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría</Label>
            <Select
              value={form.categoria}
              onValueChange={(value) => setForm((prev) => ({ ...prev, categoria: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={form.activo ? "activo" : "inactivo"}
              onValueChange={(value) => setForm((prev) => ({ ...prev, activo: value === "activo" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear Nomenclatura"}
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
