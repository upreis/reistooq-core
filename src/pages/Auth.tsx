import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se o usuário já está logado, redireciona para o dashboard
    if (user && !loading) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleToggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">REISTOQ</h1>
          <p className="text-muted-foreground">
            Sistema de Gestão de Estoque Inteligente
          </p>
        </div>

        <AuthForm mode={mode} onToggleMode={handleToggleMode} />
        
        {/* Features highlight */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Gerencie seu estoque com facilidade:
          </p>
          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
            <div>✓ Controle de estoque em tempo real</div>
            <div>✓ Integração com marketplaces</div>
            <div>✓ Scanner de código de barras</div>
            <div>✓ Relatórios e analytics</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;