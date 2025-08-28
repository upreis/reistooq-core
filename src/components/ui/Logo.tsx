import { useTheme } from "@/theme/ThemeProvider";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const { theme } = useTheme();
  
  const logoSrc = theme?.includes("dark")
    ? "/lovable-uploads/2ac629b1-e95b-44dd-985f-2ce75a5d0ee6.png" // Logo para dark (novo)
    : "/lovable-uploads/0b9a365e-610c-4fd7-b7bf-99b682141403.png"; // Logo para light
  
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-16 w-16"
  };

  return (
    <img 
      src={logoSrc}
      alt="REISTOQ Logo"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}