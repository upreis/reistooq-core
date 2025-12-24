import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading) {
      setIsStuck(false);
      return;
    }

    const t = window.setTimeout(() => setIsStuck(true), 10000);
    return () => window.clearTimeout(t);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-sm w-full space-y-4">
          <div className="mx-auto animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>

          {isStuck && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Isso está demorando mais que o normal.</p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => window.location.reload()}>Recarregar</Button>
                <Button variant="outline" onClick={() => navigate("/auth", { replace: true })}>
                  Ir para login
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // O useEffect já está redirecionando
  }

  return <>{children}</>;
}
