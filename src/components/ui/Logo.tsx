import { useTheme } from "@/theme/ThemeProvider";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const { theme } = useTheme();
  
  const logoSrc = theme?.includes("dark")
    ? "/lovable-uploads/b09fad5b-efd5-4af4-b334-6a715c818a37.png" // Logo para dark
    : "/lovable-uploads/0b9a365e-610c-4fd7-b7bf-99b682141403.png"; // Logo para light
  
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <img 
      src={logoSrc}
      alt="REISTOQ Logo"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}