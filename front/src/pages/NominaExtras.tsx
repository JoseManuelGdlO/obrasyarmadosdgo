import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS } from "@/lib/permissions";

type TrabajadorLite = { id: string; nombre: string };

type Extra = {
  id: string;
  trabajadorId: string;
  fecha: string;
  monto: number;
  concepto: string;
  estadoPago: "pendiente" | "pagado";
  pagadoEn?: string | null;
  trabajador?: TrabajadorLite;
};

const formatMoney = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);

const todayISO = () => new Date().toISOString().slice(0, 10);

const NominaExtras = () => {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = can(PERMISSIONS.NOMINA_CREATE);
  const canPay = can(PERMISSIONS.NOMINA_PAY);

  const [estadoFiltro, setEstadoFiltro] = useState("all");
  const [nuevaOpen, setNuevaOpen] = useState(false);
  const [trabajadorId, setTrabajadorId] = useState("");
  const [fecha, setFecha] = useState(todayISO());
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");

  const listQs =
    estadoFiltro === "all" ? "" : `?estadoPago=${encodeURIComponent(estadoFiltro)}`;

  const { data, isLoading } = useQuery({
    queryKey: ["nomina-extras", listQs],
    queryFn: () => apiRequest<{ extras: Extra[] }>(`/nomina/extras${listQs}`),
  });

  const { data: trabajadoresData } = useQuery({
    queryKey: ["trabajadores-lite-nomina"],
    queryFn: () => apiRequest<{ trabajadores: TrabajadorLite[] }>("/trabajadores?q="),
    enabled: nuevaOpen && canCreate,
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      trabajadorId: string;
      fecha: string;
      monto: number;
      concepto: string;
    }) => apiRequest<{ extra: Extra }>("/nomina/extras", { method: "POST", body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomina-extras"] });
      toast.success("Pago extra registrado");
      setNuevaOpen(false);
      setTrabajadorId("");
      setMonto("");
      setConcepto("");
      setFecha(todayISO());
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo crear el pago extra"),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ extra: Extra }>(`/nomina/extras/${id}`, {
        method: "PATCH",
        body: { estadoPago: "pagado" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomina-extras"] });
      toast.success("Marcado como pagado");
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo marcar como pagado"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagos extras</h1>
          <p className="text-sm text-muted-foreground">Pagos fuera del periodo de nómina</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/nomina">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Nómina
            </Link>
          </Button>
          {canCreate && (
            <Button onClick={() => setNuevaOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo pago extra
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Listado</CardTitle>
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : !(data?.extras || []).length ? (
            <p className="text-sm text-muted-foreground">No hay pagos extras.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Trabajador</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.extras || []).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.fecha}</TableCell>
                    <TableCell>{e.trabajador?.nombre || "—"}</TableCell>
                    <TableCell>{e.concepto}</TableCell>
                    <TableCell className="text-right">{formatMoney(e.monto)}</TableCell>
                    <TableCell className="capitalize">{e.estadoPago}</TableCell>
                    <TableCell className="text-right">
                      {canPay && e.estadoPago === "pendiente" && (
                        <Button
                          size="sm"
                          disabled={payMutation.isPending}
                          onClick={() => payMutation.mutate(e.id)}
                        >
                          Marcar pagado
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={nuevaOpen} onOpenChange={setNuevaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo pago extra</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Trabajador</Label>
              <Select value={trabajadorId} onValueChange={setTrabajadorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar…" />
                </SelectTrigger>
                <SelectContent>
                  {(trabajadoresData?.trabajadores || []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Concepto</Label>
              <Input
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej: Anticipo, apoyo, etc."
              />
            </div>
            <Button
              className="w-full"
              disabled={createMutation.isPending}
              onClick={() => {
                const m = Number(monto);
                if (!trabajadorId) {
                  toast.error("Selecciona un trabajador");
                  return;
                }
                if (!fecha) {
                  toast.error("Indica la fecha");
                  return;
                }
                if (!Number.isFinite(m) || m <= 0) {
                  toast.error("Monto inválido");
                  return;
                }
                if (!concepto.trim()) {
                  toast.error("Indica el concepto");
                  return;
                }
                createMutation.mutate({
                  trabajadorId,
                  fecha,
                  monto: m,
                  concepto: concepto.trim(),
                });
              }}
            >
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NominaExtras;
