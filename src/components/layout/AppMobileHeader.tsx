import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Bell, LogOut, Package, QrCode, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import jonathanAvatar from "@/assets/jonathan-avatar.jpg";
import { Logo } from "@/components/ui/Logo";
import { UserProfileSidebar } from "./UserProfileSidebar";

interface AppMobileHeaderProps {
  title: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}


export default function AppMobileHeader({ title, actions, breadcrumb }: AppMobileHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Itens de navegação simplificados
  const navItems = [
    { 
      id: 'depara', 
      label: 'De-Para', 
      path: '/de-para', 
      icon: ArrowLeftRight 
    },
    { 
      id: 'estoque', 
      label: 'Estoque', 
      path: '/estoque', 
      icon: Package 
    },
    { 
      id: 'scanner', 
      label: 'Scanner', 
      path: '/scanner', 
      icon: QrCode 
    },
  ];

  return (
    <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b safe-area-top">
      <div className="flex items-center gap-2 px-3 h-12 min-h-[48px]">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Menu" 
              className="shrink-0 h-10 w-10 touch-manipulation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[86vw] p-0">
            <UserProfileSidebar
              user={{
                name: user?.email?.split('@')[0] || 'Usuário',
                email: user?.email || 'usuario@email.com',
                avatarUrl: jonathanAvatar
              }}
              navItems={navItems}
              logoutItem={{
                icon: LogOut,
                label: 'Sair',
                onClick: handleSignOut
              }}
            />
          </SheetContent>
        </Sheet>

        {/* Logo REISTOQ */}
        <Logo size="sm" className="h-8 w-8" />

        <div className="min-w-0 flex-1">
          {breadcrumb || (
            <h1 className="text-base font-semibold truncate text-foreground">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {actions}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-10 w-10 touch-manipulation"
          >
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              3
            </Badge>
          </Button>
        </div>
      </div>
    </div>
  );
}