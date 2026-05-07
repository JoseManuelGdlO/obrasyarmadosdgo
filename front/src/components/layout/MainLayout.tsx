import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { User, Bell, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { apiRequest } from "@/lib/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

interface MainLayoutProps {
  children: React.ReactNode
}

type NotificationItem = {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  isRead: boolean
  createdAt: string
}

type NotificationsResponse = {
  notifications: NotificationItem[]
  unreadCount: number
}

const formatTimestamp = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("es-MX", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiRequest<NotificationsResponse>("/notifications"),
    staleTime: 60_000,
  })

  const markOneAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest(`/notifications/${notificationId}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const notifications = notificationsQuery.data?.notifications ?? []
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0
  const isMutating = markOneAsReadMutation.isPending || markAllAsReadMutation.isPending

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex flex-col flex-1">
          {/* Header */}
          <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            </div>
            
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 min-w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] px-1 flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[360px] max-h-[420px] overflow-y-auto">
                  <DropdownMenuLabel className="flex items-center justify-between gap-2">
                    <span>Notificaciones</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={unreadCount === 0 || isMutating}
                      onClick={() => markAllAsReadMutation.mutate()}
                    >
                      Marcar todas leídas
                    </Button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {notificationsQuery.isLoading ? (
                    <div className="px-2 py-3 text-sm text-muted-foreground">Cargando notificaciones...</div>
                  ) : notificationsQuery.isError ? (
                    <div className="px-2 py-3 text-sm text-destructive">
                      No se pudieron cargar las notificaciones.
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-muted-foreground">No tienes notificaciones.</div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="items-start flex-col gap-1 py-2"
                        onSelect={() => {
                          if (!notification.isRead) {
                            markOneAsReadMutation.mutate(notification.id)
                          }
                        }}
                      >
                        <div className="w-full flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{notification.title}</span>
                          {!notification.isRead ? (
                            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-normal">
                          {notification.message}
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                          {formatTimestamp(notification.createdAt)}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user?.email || "Usuario"}</p>
                  <p className="text-xs text-muted-foreground">{user?.rol || "Sin rol"}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await logout()
                    navigate("/login")
                  }}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}