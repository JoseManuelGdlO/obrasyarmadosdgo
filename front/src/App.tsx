import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import OrdenesTrabajo from "./pages/OrdenesTrabajo";
import Asignaciones from "./pages/Asignaciones";
import Trabajadores from "./pages/Trabajadores";
import Maquinas from "./pages/Maquinas";
import Proveedores from "./pages/Proveedores";
import Inventario from "./pages/Inventario";
import Proyectos from "./pages/Proyectos";
import Clientes from "./pages/Clientes";
import GestionUsuarios from "./pages/GestionUsuarios";
import RolesPermisos from "./pages/RolesPermisos";
import Nomenclaturas from "./pages/Nomenclaturas";
import Checklist from "./pages/Checklist";
import Forbidden from "./pages/Forbidden";
import Login from "./pages/Login";
import ChecklistPublico from "./pages/ChecklistPublico";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./lib/auth-context";
import { PERMISSIONS } from "./lib/permissions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/checklist-publico" element={<ChecklistPublico />} />
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route
                        path="/403"
                        element={<Forbidden />}
                      />
                      <Route
                        path="/ordenes"
                        element={
                          <ProtectedRoute requiredPermissions={[PERMISSIONS.ORDENES_VIEW]}>
                            <OrdenesTrabajo />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/asignaciones"
                        element={
                          <ProtectedRoute requiredPermissions={[PERMISSIONS.ASIGNACIONES_VIEW]}>
                            <Asignaciones />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/trabajadores"
                        element={
                          <ProtectedRoute requiredPermissions={[PERMISSIONS.TRABAJADORES_VIEW]}>
                            <Trabajadores />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/maquinas"
                        element={
                          <ProtectedRoute
                            requiredPermissions={[PERMISSIONS.MAQUINAS_VIEW, PERMISSIONS.MAQUINAS_READ_ASSIGNED]}
                          >
                            <Maquinas />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/proveedores"
                        element={
                          <ProtectedRoute requiredPermissions={[PERMISSIONS.PROVEEDORES_VIEW]}>
                            <Proveedores />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/inventario"
                        element={
                          <ProtectedRoute requiredPermissions={[PERMISSIONS.ARTICULOS_VIEW]}>
                            <Inventario />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/proyectos"
                        element={
                          <ProtectedRoute requiredPermissions={[PERMISSIONS.PROYECTOS_VIEW]}>
                            <Proyectos />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/clientes"
                        element={
                          <ProtectedRoute requiredPermissions={[PERMISSIONS.CLIENTES_VIEW]}>
                            <Clientes />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/gestion-usuarios"
                        element={
                          <ProtectedRoute
                            requiredPermissions={[
                              PERMISSIONS.USERS_VIEW,
                              PERMISSIONS.ROLES_VIEW,
                              PERMISSIONS.ROLE_PERMISSIONS_VIEW,
                            ]}
                          >
                            <GestionUsuarios />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/roles-permisos"
                        element={
                          <ProtectedRoute
                            requiredPermissions={[PERMISSIONS.ROLES_VIEW, PERMISSIONS.ROLE_PERMISSIONS_VIEW]}
                          >
                            <RolesPermisos />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/nomenclaturas"
                        element={
                          <ProtectedRoute requiredPermissions={[PERMISSIONS.NOMENCLATURAS_VIEW]}>
                            <Nomenclaturas />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/checklist" element={<Checklist />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
