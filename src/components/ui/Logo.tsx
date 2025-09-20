import { useTheme } from "@/theme/ThemeProvider";
import logoLight from "@/assets/logo-light.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const { theme } = useTheme();
  
  // Logo para dark mode (atual) e light mode (novo)
  const logoSrc = theme === "materialm-light" ? logoLight : "/logo-reistoq.png";
  
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-12 w-12", 
    lg: "h-20 w-20"
  };

  return (
    <div className="flex items-center justify-center">
      <img 
        src={logoSrc}
        alt="REISTOQ Logo"
        className={`${sizeClasses[size]} object-contain ${className}`}
      />
    </div>
  );
}