import React from "react";
import { Bell, Search, Settings, User, Moon, Sun, Grid3X3, Flag, Plus, ChevronDown, Megaphone, LogOut, TriangleAlert } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QuickAppsModal } from "@/components/layout/QuickAppsModal";
import { useAnnouncements } from "@/contexts/AnnouncementContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarUI } from "@/context/SidebarUIContext";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";

export default function Header() {
  const location = useLocation();
  const { isMobileSidebarOpen, setIsMobileSidebarOpen, isSidebarCollapsed, setIsSidebarCollapsed } = useSidebarUI();
  const { isHidden, setIsHidden, hasAnnouncements, isCollapsed, setIsCollapsed } = useAnnouncements();
  const { user, signOut } = useAuth();
  const { profile, displayName, fullName, initials } = useCurrentProfile();

  const handleSignOut = async () => {
    await signOut();
  };

  const isPedidosPage = location.pathname === '/pedidos';

  return (
    <header className={`sticky z-40 bg-background border-b transition-all duration-300 ${hasAnnouncements && !isCollapsed && !isHidden ? 'top-12' : 'top-0'}`}>
      <div className="flex items-center gap-2 px-4 h-14">
        {/* Desktop Sidebar Toggle */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded p-2 border ml-2"
          aria-label={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          data-testid="sidebar-desktop-toggle"
        >
          {isSidebarCollapsed ? (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </button>

        {/* Search or Breadcrumb */}
        <div className="flex items-center gap-4 flex-1">
          {isPedidosPage ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>📦</span>
              <span>/</span>
              <span className="text-primary">Vendas</span>
            </div>
          ) : (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                className="pl-10 w-80"
              />
            </div>
          )}
        </div>

        {/* Right side - Actions and user menu */}
        <div className="flex items-center gap-3">
          {/* Language/Country Flag */}
          <Button variant="ghost" size="icon">
            <Flag className="h-5 w-5" />
          </Button>
          
          {/* Quick Apps */}
          <QuickAppsModal />
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Plus/Add Button */}
          <Button variant="ghost" size="icon">
            <Plus className="h-5 w-5" />
          </Button>

          {/* Banner Expand Button - only show when collapsed and has announcements */}
          {hasAnnouncements && isCollapsed && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsCollapsed(false)}
              title="Expandir anúncios"
              className="text-amber-400 hover:text-amber-300"
            >
              <TriangleAlert className="h-4 w-4" strokeWidth={2.5} />
            </Button>
          )}

          {/* Announcement Expand Button - only show when hidden and has announcements */}
          {isHidden && hasAnnouncements && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsHidden(false)}
              title="Mostrar anúncios"
              className="text-foreground hover:text-foreground"
            >
              <Megaphone className="h-4 w-4" strokeWidth={2.5} />
            </Button>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url} alt={fullName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{profile?.cargo || 'Usuário'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="flex items-center gap-3 p-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profile?.avatar_url} alt={fullName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{fullName}</p>
                  <p className="text-xs text-muted-foreground">{profile?.cargo || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Meu Perfil</p>
                  <p className="text-xs text-muted-foreground">Configurações da conta</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Minhas Notas</p>
                  <p className="text-xs text-muted-foreground">Notas diárias</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Minhas Tarefas</p>
                  <p className="text-xs text-muted-foreground">Lista de tarefas diárias</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-3 cursor-pointer">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sair</p>
                  <p className="text-xs text-muted-foreground">Fazer logout</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}