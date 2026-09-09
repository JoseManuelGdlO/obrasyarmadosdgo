import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Search, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { apiRequest, toAbsoluteAssetUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS } from "@/lib/permissions";

type Factura = {
  id: string;
  archivoPath: string;
  nombreOriginal: string;
  mimeType: string;
};

type OrdenCompra = {
  id: string;
  fecha: string;
  proyecto: string;
  proveedor: string;
  total: number;
  facturasCount: number;
  facturas?: Factura[];
};

const formatMoney = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);

const ComprasFacturas = () => {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [ordenId, setOrdenId] = useState<string>("");

  const canFacturas = can(PERMISSIONS.COMPRAS_FACTURAS);

  const { data, isLoading } = useQuery({
    queryKey: ["compras", search],
    queryFn: () => {
      const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
      return apiRequest<{ ordenes: OrdenCompra[] }>(`/compras${q}`);
    },
  });

  const ordenes = useMemo(() => data?.ordenes || [], [data?.ordenes]);

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["compras", ordenId],
    queryFn: () => apiRequest<{ orden: OrdenCompra }>(`/compras/${ordenId}`),
    enabled: !!ordenId,
  });

  const detalle = detailData?.orden;

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append("archivo", file);
      return apiRequest(`/compras/${ordenId}/facturas`, { method: "POST", body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      toast.success("Factura subida");
    },
    onError: (err: Error) => toast.error(err.message || "Error al subir factura"),
  });

  const deleteMutation = useMutation({
    mutationFn: (facturaId: string) =>
      apiRequest(`/compras/${ordenId}/facturas/${facturaId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      toast.success("Factura eliminada");
    },
    onError: (err: Error) => toast.error(err.message || "Error al eliminar"),
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link to="/compras">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Compras
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Facturas</h1>
          <p className="text-muted-foreground">
            Adjunta PDF o imágenes a una orden de compra (fecha + proyecto + proveedor)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Seleccionar orden</CardTitle>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Filtrar lista…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={ordenId || undefined} onValueChange={setOrdenId}>
              <SelectTrigger className="w-full sm:w-[360px]">
                <SelectValue placeholder={isLoading ? "Cargando…" : "Elige una orden"} />
              </SelectTrigger>
              <SelectContent>
                {ordenes.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.fecha} · {o.proyecto} · {o.proveedor} ({formatMoney(o.total)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canFacturas && ordenId && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) uploadMutation.mutate(file);
                  }}
                />
                <Button
                  disabled={uploadMutation.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Subir factura
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!ordenId ? (
            <p className="text-sm text-muted-foreground">Selecciona una orden para ver o subir facturas.</p>
          ) : detailLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(detalle?.facturas || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      Sin facturas en esta orden.
                    </TableCell>
                  </TableRow>
                ) : (
                  (detalle?.facturas || []).map((f) => {
                    const url = toAbsoluteAssetUrl(f.archivoPath);
                    return (
                      <TableRow key={f.id}>
                        <TableCell>{f.nombreOriginal}</TableCell>
                        <TableCell>{f.mimeType}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {url && (
                              <Button size="sm" variant="ghost" asChild>
                                <a href={url} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {canFacturas && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMutation.mutate(f.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprasFacturas;
