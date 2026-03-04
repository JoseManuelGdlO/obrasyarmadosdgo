import { 
  ClipboardList, 
  Package, 
  FolderOpen, 
  Users, 
  Truck, 
  GitBranch, 
  UserCheck, 
  Building,
  LayoutDashboard,
  Settings
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import logoObras from "@/assets/logo-obras.png"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Órdenes de Trabajo", url: "/ordenes", icon: ClipboardList },
  { title: "Asignaciones", url: "/asignaciones", icon: GitBranch },
  { title: "Checklist Diario", url: "/checklist", icon: ClipboardList },
  { title: "Trabajadores", url: "/trabajadores", icon: UserCheck },
  { title: "Proveedores", url: "/proveedores", icon: Building },
]

const inventoryItems = [
  { title: "Inventario", url: "/inventario", icon: Package },
  { title: "Vehículos/Máquinas", url: "/maquinas", icon: Truck },
]

const accessItems = [
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Gestión Usuarios", url: "/gestion-usuarios", icon: UserCheck },
]

const configItems = [
  { title: "Proyectos", url: "/proyectos", icon: FolderOpen },
  { title: "Nomenclaturas", url: "/nomenclaturas", icon: Settings },
]

type SectionProps = {
  label: string
  items: typeof mainItems
  currentPath: string
  className?: string
}

function SidebarSection({ label, items, currentPath, className }: SectionProps) {
  return (
    <SidebarGroup className={className ?? "py-2"}>
      <SidebarGroupLabel className="text-sidebar-foreground/50 font-semibold text-xs uppercase tracking-wider">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = currentPath === item.url
            return (
              <SidebarMenuItem key={item.title}>
                <NavLink
                  to={item.url}
                  end
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-sm"
                  style={{
                    backgroundColor: active ? 'hsl(38 80% 45%)' : 'transparent',
                    color: active ? 'white' : 'hsl(30 10% 40%)',
                    fontWeight: active ? 600 : 400,
                    boxShadow: active ? '0 4px 12px hsl(38 80% 45% / 0.4)' : 'none',
                  }}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                </NavLink>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <img
            src={logoObras}
            alt="Obras y Armados Estructurales"
            className="w-10 h-10 object-contain rounded bg-white p-0.5"
          />
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-base font-bold text-sidebar-foreground leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              OBRAS
            </h2>
            <p className="text-[10px] text-sidebar-foreground/60 tracking-wide">
              Y ARMADOS ESTRUCTURALES
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarSection label="Gestión" items={mainItems} currentPath={currentPath} />
        <SidebarSection label="Inventarios" items={inventoryItems} currentPath={currentPath} />
        <SidebarSection label="Accesos" items={accessItems} currentPath={currentPath} />
        <SidebarSection label="Configuración" items={configItems} currentPath={currentPath} className="mt-auto py-2" />
      </SidebarContent>
    </Sidebar>
  )
}