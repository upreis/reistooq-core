import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Package, ShoppingCart, QrCode, BarChart3 } from "lucide-react";

const NAV_ITEMS = [
  {
    label: "De-Para",
    href: "/de-para",
    icon: Package,
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
];

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t safe-area-bottom">
      <nav className="grid grid-cols-3 h-16 min-h-[64px]">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs transition-colors",
                "min-h-[44px] touch-manipulation",
                "active:scale-95 transition-transform duration-150",
                isActive 
                  ? "text-primary font-semibold bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 shrink-0", 
                isActive && "text-primary"
              )} />
              <span className="leading-none truncate text-center max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}