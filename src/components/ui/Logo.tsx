import { useTheme } from "@/theme/ThemeProvider";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const { theme } = useTheme();
  
  const logoSrc = "/logo-reistoq.png"; // Novo logo da empresa
  
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