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
  Settings,
  Shield
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import logoObras from "@/assets/logo-obras.png"
import { useAuth } from "@/lib/auth-context"
import { PERMISSIONS } from "@/lib/permissions"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
  { title: "Órdenes de Trabajo", url: "/ordenes", icon: ClipboardList, requiredPermissions: [PERMISSIONS.ORDENES_VIEW] },
  { title: "Asignaciones", url: "/asignaciones", icon: GitBranch, requiredPermissions: [PERMISSIONS.ASIGNACIONES_VIEW] },
  { title: "Checklist Diario", url: "/checklist", icon: ClipboardList },
]

const inventoryItems = [
  { title: "Inventario", url: "/inventario", icon: Package, requiredPermissions: [PERMISSIONS.ARTICULOS_VIEW] },
  {
    title: "Vehículos/Máquinas",
    url: "/maquinas",
    icon: Truck,
    requiredPermissions: [PERMISSIONS.MAQUINAS_VIEW, PERMISSIONS.MAQUINAS_READ_ASSIGNED],
  },
]

const accessItems = [
  { title: "Clientes", url: "/clientes", icon: Users, requiredPermissions: [PERMISSIONS.CLIENTES_VIEW] },
  {
    title: "Gestión Usuarios",
    url: "/gestion-usuarios",
    icon: UserCheck,
    requiredPermissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.ROLES_VIEW, PERMISSIONS.ROLE_PERMISSIONS_VIEW],
  },
  {
    title: "Roles y Permisos",
    url: "/roles-permisos",
    icon: Shield,
    requiredPermissions: [PERMISSIONS.ROLES_VIEW, PERMISSIONS.ROLE_PERMISSIONS_VIEW],
  },
]

const configItems = [
  { title: "Proyectos", url: "/proyectos", icon: FolderOpen, requiredPermissions: [PERMISSIONS.PROYECTOS_VIEW] },
  { title: "Nomenclaturas", url: "/nomenclaturas", icon: Settings, requiredPermissions: [PERMISSIONS.NOMENCLATURAS_VIEW] },
  { title: "Trabajadores", url: "/trabajadores", icon: UserCheck, requiredPermissions: [PERMISSIONS.TRABAJADORES_VIEW] },
  { title: "Proveedores", url: "/proveedores", icon: Building, requiredPermissions: [PERMISSIONS.PROVEEDORES_VIEW] },
]

type SectionProps = {
  label: string
  items: typeof mainItems
  currentPath: string
  className?: string
}

function SidebarSection({ label, items, currentPath, className }: SectionProps) {
  const { canAny } = useAuth()
  return (
    <SidebarGroup className={className ?? "py-2"}>
      <SidebarGroupLabel className="text-sidebar-foreground/50 font-semibold text-xs uppercase tracking-wider">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = currentPath === item.url
            const hasAccess = !item.requiredPermissions || canAny(item.requiredPermissions)
            const itemClassName = "flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-sm"
            const itemStyle = {
              backgroundColor: active && hasAccess ? 'hsl(38 80% 45%)' : 'transparent',
              color: active && hasAccess ? 'white' : 'hsl(30 10% 40%)',
              fontWeight: active && hasAccess ? 600 : 400,
              boxShadow: active && hasAccess ? '0 4px 12px hsl(38 80% 45% / 0.4)' : 'none',
            }

            return (
              <SidebarMenuItem key={item.title}>
                {hasAccess ? (
                  <NavLink to={item.url} end className={itemClassName} style={itemStyle}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </NavLink>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`${itemClassName} cursor-not-allowed opacity-50`} style={itemStyle}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Sin permiso</TooltipContent>
                  </Tooltip>
                )}
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