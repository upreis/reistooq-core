import { useLocation, useNavigate } from "react-router-dom";
import { Settings, Users, Shield, Mail, Bell, History, User } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const navItems = [
  {
    path: "/admin",
    label: "Visão Geral",
    icon: Settings,
  },
  {
    path: "/admin/usuarios",
    label: "Usuários", 
    icon: Users,
  },
  {
    path: "/admin/cargos",
    label: "Cargos",
    icon: Shield,
  },
  {
    path: "/admin/convites",
    label: "Convites",
    icon: Mail,
  },
  {
    path: "/admin/alertas",
    label: "Alertas",
    icon: Bell,
  },
  {
    path: "/admin/seguranca",
    label: "Segurança",
    icon: Shield,
  },
  {
    path: "/admin/auditoria",
    label: "Auditoria",
    icon: History,
  },
  {
    path: "/admin/perfil",
    label: "Perfil",
    icon: User,
  },
];

export function AdminNav() {
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