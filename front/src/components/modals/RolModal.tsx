import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type RolFormData = {
  nombre: string;
  descripcion: string;
  activo: boolean;
};

const defaultForm: RolFormData = {
  nombre: "",
  descripcion: "",
  activo: true,
};

interface RolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RolFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<RolFormData> | null;
}

export default function RolModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
}: RolModalProps) {
  const [form, setForm] = useState<RolFormData>(defaultForm);
  const [nombreError, setNombreError] = useState("");
  const isEdit = useMemo(() => Boolean(initialData), [initialData]);

  useEffect(() => {
    if (open) {
      setForm({ ...defaultForm, ...(initialData || {}) });
      setNombreError("");
    }
  }, [open, initialData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const nombre = form.nombre.trim();
            if (!nombre) {
              setNombreError("El nombre del rol es obligatorio.");
              return;
            }
            setNombreError("");
            onSubmit({ ...form, nombre });
          }}
        >
          <div className="space-y-2">
            <Label>Nombre del rol</Label>
            <Input
              value={form.nombre}
              onChange={(e) => {
                setNombreError("");
                setForm((prev) => ({ ...prev, nombre: e.target.value }));
              }}
              onBlur={() =>
                setForm((prev) => ({ ...prev, nombre: prev.nombre.trim() }))
              }
              placeholder="Ej: supervisor"
              required
            />
            {nombreError ? <p className="text-sm text-destructive">{nombreError}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Descripción opcional"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
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
