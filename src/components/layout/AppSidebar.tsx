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
  { title: "Inventario", url: "/inventario", icon: Package },
  { title: "Proyectos", url: "/proyectos", icon: FolderOpen },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Maquinarias", url: "/maquinarias", icon: Truck },
  { title: "Asignaciones", url: "/asignaciones", icon: GitBranch },
  { title: "Trabajadores", url: "/trabajadores", icon: UserCheck },
  { title: "Proveedores", url: "/proveedores", icon: Building },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-blue-600 text-white font-medium shadow-lg" 
      : "text-gray-900 hover:bg-gray-100 hover:text-gray-900"

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
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto py-2">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/configuracion" className={getNavCls}>
                    <Settings className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">Configuración</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}