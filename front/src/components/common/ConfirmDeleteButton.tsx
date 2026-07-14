import { ReactNode, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteButtonProps {
  onConfirm: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  secondTitle?: string;
  secondDescription?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
  requireDoubleConfirm?: boolean;
}

export default function ConfirmDeleteButton({
  onConfirm,
  children,
  title = "¿Eliminar registro?",
  description = "Esta acción no se puede deshacer. Confirma que deseas eliminar este elemento.",
  secondTitle = "¿Confirmas de nuevo?",
  secondDescription = "Esta es la segunda confirmación. Si continúas, el elemento se eliminará de forma permanente.",
  className,
  size = "sm",
  variant = "outline",
  disabled = false,
  requireDoubleConfirm = false,
}: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setStep(1);
  };

  const handlePrimary = () => {
    if (requireDoubleConfirm && step === 1) {
      setStep(2);
      return;
    }
    setOpen(false);
    setStep(1);
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={disabled}>
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{step === 1 ? title : secondTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {step === 1 ? description : secondDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {requireDoubleConfirm && step === 2 ? (
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Volver
            </Button>
          ) : null}
          <Button
            type="button"
            variant="destructive"
            onClick={handlePrimary}
          >
            {requireDoubleConfirm && step === 1 ? "Continuar" : "Sí, eliminar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
