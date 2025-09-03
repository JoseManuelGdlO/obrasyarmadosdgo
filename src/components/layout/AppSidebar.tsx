import { useState } from "react"
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

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
} from "@/components/ui/sidebar"

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Órdenes de Trabajo", url: "/ordenes", icon: ClipboardList },
  { title: "Proyectos", url: "/proyectos", icon: FolderOpen },
  { title: "Asignaciones", url: "/asignaciones", icon: GitBranch },
  { title: "Trabajadores", url: "/trabajadores", icon: UserCheck },
  { title: "Proveedores", url: "/proveedores", icon: Building },
]

const inventoryItems = [
  { title: "Inventario", url: "/inventario", icon: Package },
  { title: "Maquinarias", url: "/maquinarias", icon: Truck },
]

const accessItems = [
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Gestión Usuarios", url: "/gestion-usuarios", icon: UserCheck },
]

const configItems = [
  { title: "Nomenclaturas", url: "/nomenclaturas", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  console.log("Current path:", currentPath)
  console.log("Sidebar state:", state)

  const isActive = (path: string) => {
    const active = currentPath === path
    console.log(`Path ${path} is active:`, active)
    return active
  }
  
  const getNavCls = ({ isActive }: { isActive: boolean }) => {
    const classes = isActive 
      ? "bg-blue-600 text-white font-medium shadow-lg" 
      : "text-gray-900 hover:bg-gray-100 hover:text-gray-900"
    console.log("Nav classes:", classes, "isActive:", isActive)
    return classes
  }

  const allItems = [...mainItems, ...inventoryItems, ...accessItems, ...configItems]

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-gray-200 bg-white"
    >
      <SidebarHeader className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-orange-500 rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-bold text-gray-900">MantPro</h2>
            <p className="text-xs text-gray-600">Gestión Industrial</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 bg-white">
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="text-gray-600 font-medium">Gestión</SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink 
                    to={item.url} 
                    end 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full ${getNavCls({ isActive: isActive(item.url) })}`}
                    style={{ 
                      backgroundColor: isActive(item.url) ? '#2563eb' : 'transparent',
                      color: isActive(item.url) ? 'white' : '#111827'
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="text-gray-600 font-medium">Inventarios</SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {inventoryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink 
                    to={item.url} 
                    end 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full ${getNavCls({ isActive: isActive(item.url) })}`}
                    style={{ 
                      backgroundColor: isActive(item.url) ? '#2563eb' : 'transparent',
                      color: isActive(item.url) ? 'white' : '#111827'
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="text-gray-600 font-medium">Accesos</SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {accessItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink 
                    to={item.url} 
                    end 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full ${getNavCls({ isActive: isActive(item.url) })}`}
                    style={{ 
                      backgroundColor: isActive(item.url) ? '#2563eb' : 'transparent',
                      color: isActive(item.url) ? 'white' : '#111827'
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto py-2">
          <SidebarGroupLabel className="text-gray-600 font-medium">Configuraciones</SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink 
                    to={item.url} 
                    end 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full ${getNavCls({ isActive: isActive(item.url) })}`}
                    style={{ 
                      backgroundColor: isActive(item.url) ? '#2563eb' : 'transparent',
                      color: isActive(item.url) ? 'white' : '#111827'
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}