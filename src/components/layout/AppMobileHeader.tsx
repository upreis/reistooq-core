import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Bell, User, Settings, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import jonathanAvatar from "@/assets/jonathan-avatar.jpg";
import { ENHANCED_NAV_ITEMS } from "@/config/enhanced-nav";

interface AppMobileHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

// Mobile Navigation Component
function MobileNavItem({ item }: { item: any }) {
  const [isOpen, setIsOpen] = useState(false);

  if (item.children) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full px-3 py-3 text-sm rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {item.icon === 'ShoppingCart' ? '🛍️' : 
                 item.icon === 'UserRound' ? '👤' : 
                 item.icon === 'Settings' ? '⚙️' : '📁'}
              </span>
              <span className="font-medium">{item.label}</span>
            </div>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="ml-6 mt-1 space-y-1">
          {item.children.map((child: any) => (
            <Link
              key={child.path || child.id}
              to={child.path || '#'}
              className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span className="text-base">
                {child.icon === 'ShoppingCart' ? '🛒' :
                 child.icon === 'FileText' ? '📄' :
                 child.icon === 'Package' ? '📦' :
                 child.icon === 'CreditCard' ? '💳' :
                 child.icon === 'PlusSquare' ? '➕' :
                 child.icon === 'Settings' ? '⚙️' :
                 child.icon === 'User' ? '👤' :
                 child.icon === 'Users' ? '👥' :
                 child.icon === 'UsersRound' ? '👫' :
                 child.icon === 'Image' ? '🖼️' :
                 child.icon === 'Zap' ? '⚡' : '📄'}
              </span>
              <span>{child.label}</span>
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link
      to={item.path || '#'}
      className="flex items-center gap-3 px-3 py-3 text-sm rounded-lg hover:bg-muted transition-colors"
    >
      <span className="text-lg">
        {item.icon === 'LayoutDashboard' ? '🏠' :
         item.icon === 'TrendingUp' ? '📊' :
         item.icon === 'ShoppingCart' ? '🛍️' :
         item.icon === 'Users' ? '👥' :
         item.icon === 'Calendar' ? '📅' :
         item.icon === 'Notebook' ? '📝' :
         item.icon === 'MessageSquare' ? '💬' :
         item.icon === 'Boxes' ? '📦' :
         item.icon === 'Receipt' ? '🛒' :
         item.icon === 'Scan' ? '📱' :
         item.icon === 'ArrowLeftRight' ? '🔄' :
         item.icon === 'Bell' ? '🚨' :
         item.icon === 'History' ? '📋' :
         item.icon === 'TestTube' ? '🔧' :
         item.icon === 'Smartphone' ? '📱' : '📄'}
      </span>
      <span className="font-medium">{item.label}</span>
      {item.badge && (
        <Badge variant={item.badge.variant as any} className="ml-auto text-xs">
          {item.badge.content}
        </Badge>
      )}
    </Link>
  );
}

export default function AppMobileHeader({ title, actions }: AppMobileHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="md:hidden sticky top-0 z-40 bg-background border-b">
      <div className="flex items-center gap-2 px-3 h-12">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu" className="shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[86vw] p-0">
            <div className="flex flex-col h-full">
              {/* Header do Menu */}
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={jonathanAvatar} alt={user?.email || "Usuário"} />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user?.email || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground">Usuário</p>
                  </div>
                </div>
              </div>

              {/* Navegação */}
              <div className="flex-1 py-4 overflow-y-auto">
                <nav className="space-y-1 px-4">
                  {ENHANCED_NAV_ITEMS.map((section) => (
                    <div key={section.id} className="mb-6">
                      <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {section.group}
                      </h3>
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <MobileNavItem key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>

              {/* Footer do Menu */}
              <div className="border-t p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tema</span>
                  <ThemeToggle />
                </div>
                
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors w-full"
                >
                  <User className="w-4 h-4" />
                  <span>Meu Perfil</span>
                </Link>
                
                <Link
                  to="/config"
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors w-full"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configurações</span>
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <h1 className="text-base font-medium truncate min-w-0 flex-1 mobile-text">
          {title}
        </h1>

        <div className="flex items-center gap-1 shrink-0">
          {actions}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>
        </div>
      </div>
    </div>
  );
}