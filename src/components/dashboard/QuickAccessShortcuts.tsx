import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Define the shape of a single shortcut object
interface Shortcut {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  gradient?: string;
}

// Define the props for the QuickAccessShortcuts component
interface QuickAccessShortcutsProps {
  /** The main title displayed above the shortcuts */
  title?: string;
  /** An array of shortcut objects to display (max 10) */
  shortcuts: Shortcut[];
  /** Optional custom class names */
  className?: string;
}

/**
 * A responsive component for displaying quick access shortcuts to pages.
 * Displays cards with rounded corners, icons, and gradients similar to app icons.
 */
export const QuickAccessShortcuts = ({
  title = "Acesso Rápido",
  shortcuts,
  className,
}: QuickAccessShortcutsProps) => {
  const navigate = useNavigate();
  
  // Limit to maximum 10 shortcuts
  const displayShortcuts = shortcuts.slice(0, 10);

  const handleShortcutClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h2 className="text-xl font-semibold text-foreground">
          {title}
        </h2>
      )}
      
      <div className="flex flex-wrap gap-x-2 gap-y-[1.5px]">
        {displayShortcuts.map((shortcut) => (
          <button
            key={shortcut.id}
            onClick={() => handleShortcutClick(shortcut.route)}
            className="group relative flex flex-col items-center gap-2 transition-transform duration-300 ease-in-out hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`Ir para ${shortcut.label}`}
          >
            {/* Card Icon */}
            <div 
              className={cn(
                "relative h-24 w-24 rounded-2xl transition-all duration-300",
                "shadow-md group-hover:shadow-xl group-hover:shadow-primary/20",
                shortcut.gradient || "bg-gradient-to-br from-primary to-primary/70"
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-3xl">
                  {shortcut.icon}
                </div>
              </div>
            </div>
            
            {/* Label */}
            <p className="text-sm font-medium text-foreground text-center transition-colors group-hover:text-primary">
              {shortcut.label}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
