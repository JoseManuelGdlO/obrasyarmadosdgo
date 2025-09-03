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
      ? "bg-primary text-primary-foreground font-medium shadow-lg" 
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-transparent hover:border-slate-200"

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-bold text-sidebar-foreground">MantPro</h2>
            <p className="text-xs text-sidebar-foreground/70">Gestión Industrial</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="text-sidebar-foreground/70">Gestión</SidebarGroupLabel>
          
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