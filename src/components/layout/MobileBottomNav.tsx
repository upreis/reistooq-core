import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Package, ShoppingCart, QrCode, BarChart3 } from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Início",
    href: "/",
    icon: Home,
  },
  {
    label: "Estoque",
    href: "/estoque",
    icon: Package,
  },
  {
    label: "Scanner", 
    href: "/scanner",
    icon: QrCode,
  },
  {
    label: "Pedidos",
    href: "/pedidos",
    icon: ShoppingCart,
  },
  {
    label: "Mais",
    href: "/apps/notes", // página temporária, será acessível via menu hambúrguer
    icon: BarChart3,
  },
];

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <nav className="grid grid-cols-5 h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-1 py-2 text-xs transition-colors",
                isActive 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="leading-none truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}