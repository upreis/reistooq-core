import { useLocation, useNavigate } from "react-router-dom";
import { Zap, Megaphone, Bell } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const navItems = [
  {
    path: "/configuracoes/integracoes",
    label: "Integrações",
    icon: Zap,
  },
  {
    path: "/configuracoes/anuncios", 
    label: "Avisos",
    icon: Megaphone,
  },
  {
    path: "/configuracoes/alertas", 
    label: "Alertas",
    icon: Bell,
  },
];

export function ConfiguracoesNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determina a tab ativa baseada na rota atual
  const activeTab = navItems.find(item => location.pathname === item.path)?.path || navItems[0].path;

  const handleTabChange = (value: string) => {
    navigate(value);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <ScrollArea>
        <TabsList className="mb-3 h-auto -space-x-px bg-background p-0 shadow-sm shadow-black/5 rtl:space-x-reverse">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <TabsTrigger
                key={item.path}
                value={item.path}
                className="relative overflow-hidden rounded-none border border-border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
              >
                <Icon
                  className="-ms-0.5 me-1.5 opacity-60"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {item.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Tabs>
  );
}