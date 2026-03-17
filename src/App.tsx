import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
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
import Nomenclaturas from "./pages/Nomenclaturas";
import Checklist from "./pages/Checklist";
import Login from "./pages/Login";
import ChecklistPublico from "./pages/ChecklistPublico";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/checklist-publico" element={<ChecklistPublico />} />
          <Route path="*" element={
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/ordenes" element={<OrdenesTrabajo />} />
                <Route path="/asignaciones" element={<Asignaciones />} />
                <Route path="/trabajadores" element={<Trabajadores />} />
                <Route path="/maquinas" element={<Maquinas />} />
                <Route path="/proveedores" element={<Proveedores />} />
                <Route path="/inventario" element={<Inventario />} />
                <Route path="/proyectos" element={<Proyectos />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/gestion-usuarios" element={<GestionUsuarios />} />
                <Route path="/nomenclaturas" element={<Nomenclaturas />} />
                <Route path="/checklist" element={<Checklist />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MainLayout>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
