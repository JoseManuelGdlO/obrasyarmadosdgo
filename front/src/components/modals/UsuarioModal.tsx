import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type UsuarioFormData = {
  email: string;
  password: string;
  rol: string;
  status: "activo" | "suspendido";
};

const defaultForm: UsuarioFormData = {
  email: "",
  password: "",
  rol: "usuario",
  status: "activo",
};

interface UsuarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UsuarioFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<UsuarioFormData> | null;
  roles: string[];
}

export default function UsuarioModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  roles,
}: UsuarioModalProps) {
  const [form, setForm] = useState<UsuarioFormData>(defaultForm);
  const isEdit = useMemo(() => Boolean(initialData), [initialData]);

  useEffect(() => {
    if (open) {
      setForm({ ...defaultForm, ...(initialData || {}), password: "" });
    }
  }, [open, initialData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
        >
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required={!isEdit}
            />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={form.rol} onValueChange={(value: UsuarioFormData["rol"]) => setForm((prev) => ({ ...prev, rol: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={(value: UsuarioFormData["status"]) => setForm((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
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
