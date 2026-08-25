import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CuentaContableFormData = {
  numero: string;
  nombre: string;
  activa: boolean;
};

const defaultForm: CuentaContableFormData = {
  numero: "",
  nombre: "",
  activa: true,
};

interface CuentaContableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CuentaContableFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<CuentaContableFormData> | null;
}

export default function CuentaContableModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
}: CuentaContableModalProps) {
  const [form, setForm] = useState<CuentaContableFormData>(defaultForm);
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
          <DialogTitle>{isEdit ? "Editar cuenta contable" : "Crear cuenta contable"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="numero">Número de cuenta</Label>
            <Input
              id="numero"
              inputMode="numeric"
              placeholder="Ej: 00123"
              value={form.numero}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, numero: e.target.value.replace(/\D/g, "") }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre (opcional)</Label>
            <Input
              id="nombre"
              placeholder="Ej: Proveedores varios"
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={form.activa ? "activo" : "inactivo"}
              onValueChange={(value) => setForm((prev) => ({ ...prev, activa: value === "activo" }))}
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
              {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cuenta"}
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
