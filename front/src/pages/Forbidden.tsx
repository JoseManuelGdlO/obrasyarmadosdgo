import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Acceso denegado</h1>
        <p className="text-muted-foreground">
          Tu usuario no tiene permisos suficientes para entrar a esta pantalla.
        </p>
        <Button onClick={() => navigate("/")}>Volver al inicio</Button>
      </div>
    </div>
  );
}
