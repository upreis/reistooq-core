import { Bell, Search, Settings, User, Menu, Moon, Sun, Grid3X3, Flag, Plus, ChevronDown, Megaphone, LogOut } from "lucide-react";
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
import { QuickAppsModal } from "./QuickAppsModal";
import jonathanAvatar from "@/assets/jonathan-avatar.jpg";
import { useAnnouncements } from "@/contexts/AnnouncementContext";
import { useAuth } from "@/contexts/AuthContext";

export function AppHeader() {
  const { isHidden, setIsHidden, hasAnnouncements } = useAnnouncements();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };
  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
      {/* Left side - Search */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar..."
            className="pl-10 w-80"
          />
        </div>
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
        
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                4
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Nova mensagem recebida</p>
                <p className="text-xs text-muted-foreground">De João sobre atualização do projeto</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Tarefa concluída</p>
                <p className="text-xs text-muted-foreground">Fase de desenvolvimento finalizada</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Novo usuário registrado</p>
                <p className="text-xs text-muted-foreground">Bem-vindo ao time!</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Plus/Add Button */}
        <Button variant="ghost" size="icon">
          <Plus className="h-5 w-5" />
        </Button>

        {/* Announcement Expand Button - only show when hidden and has announcements */}
        {isHidden && hasAnnouncements && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsHidden(false)}
            title="Mostrar anúncios"
            className="text-primary hover:text-primary"
          >
            <Megaphone className="h-4 w-4" strokeWidth={2.5} />
          </Button>
        )}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={jonathanAvatar} alt="Jonathan Deo" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium">Jonathan Deo</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="flex items-center gap-3 p-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={jonathanAvatar} alt={user?.email || "Usuário"} />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.email || "Usuário"}</p>
                <p className="text-xs text-muted-foreground">Usuário</p>
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
    </header>
  );
}