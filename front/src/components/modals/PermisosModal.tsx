import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export type PermisosFormData = {
  rol: string;
  permissions: string[];
};

const defaultForm: PermisosFormData = {
  rol: "usuario",
  permissions: [],
};

interface PermisosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PermisosFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<PermisosFormData> | null;
  availablePermissions: string[];
  roles: string[];
}

export default function PermisosModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  availablePermissions,
  roles,
}: PermisosModalProps) {
  const [form, setForm] = useState<PermisosFormData>(defaultForm);
  const isEdit = useMemo(() => Boolean(initialData), [initialData]);
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const permission of availablePermissions) {
      const [moduleName] = permission.split(".");
      if (!groups[moduleName]) groups[moduleName] = [];
      groups[moduleName].push(permission);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [availablePermissions]);

  useEffect(() => {
    if (open) {
      setForm({
        ...defaultForm,
        ...(initialData || {}),
        permissions: initialData?.permissions || [],
      });
    }
  }, [open, initialData]);

  const togglePermission = (permission: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permission]
        : prev.permissions.filter((p) => p !== permission),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Configurar Permisos" : "Asignar Permisos"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
        >
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={form.rol} onValueChange={(value: PermisosFormData["rol"]) => setForm((prev) => ({ ...prev, rol: value }))}>
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
            <Label>Permisos</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
              {groupedPermissions.map(([moduleName, permissions]) => (
                <div key={moduleName} className="space-y-2 border rounded-md p-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{moduleName}</p>
                  {permissions.map((permission) => (
                    <label key={permission} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.permissions.includes(permission)}
                        onCheckedChange={(checked) => togglePermission(permission, Boolean(checked))}
                      />
                      <span>{permission}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar permisos"}
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
