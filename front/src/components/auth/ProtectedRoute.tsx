import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

type ProtectedRouteProps = {
  children: JSX.Element;
  requiredPermissions?: string[];
  requireAll?: boolean;
};

export default function ProtectedRoute({ children, requiredPermissions = [], requireAll = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, canAny, canAll } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando sesión...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions.length > 0) {
    const allowed = requireAll ? canAll(requiredPermissions) : canAny(requiredPermissions);
    if (!allowed) {
      return <Navigate to="/403" replace state={{ from: location.pathname }} />;
    }
  }

  return children;
}
