"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

type MenuItem = { 
  name: string; 
  path: string; 
  icon?: React.ReactNode;
};

interface MenuGroupProps {
  children: React.ReactNode;
  items: MenuItem[];
  groupName?: string;
}

export const MenuGroup = ({ children, items, groupName }: MenuGroupProps) => {
  const location = useLocation();
  const [isOpened, setIsOpened] = useState(() => {
    // Abrir automaticamente se algum item do grupo estiver ativo
    return items.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
  });

  // Verificar se algum item está ativo
  const hasActiveItem = items.some(item => 
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );

  return (
    <div>
      <button
        className={cn(
          "w-full flex items-center justify-between p-2 rounded-lg duration-150",
          hasActiveItem 
            ? "bg-primary/10 text-primary" 
            : "text-muted-foreground hover:bg-muted active:bg-muted/80"
        )}
        onClick={() => setIsOpened((v) => !v)}
        aria-expanded={isOpened}
        aria-controls={`submenu-${groupName}`}
      >
        <div className="flex items-center gap-x-2">{children}</div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={cn("w-5 h-5 duration-150", isOpened && "rotate-180")}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpened && (
        <ul id={`submenu-${groupName}`} className="mx-4 px-2 border-l border-border text-sm font-medium">
          {items.map((item, idx) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            
            return (
              <li key={idx}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-x-2 p-2 rounded-lg duration-150",
                    isActive 
                      ? "bg-primary text-primary-foreground font-medium" 
                      : "text-muted-foreground hover:bg-muted active:bg-muted/80"
                  )}
                >
                  {item.icon && <div>{item.icon}</div>}
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
