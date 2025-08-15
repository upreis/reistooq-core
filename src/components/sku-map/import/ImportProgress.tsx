import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export function ImportProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          
          <div>
            <div className="text-lg font-medium mb-2">Importando dados...</div>
            <div className="text-sm text-muted-foreground">
              Por favor, aguarde enquanto processamos seus dados.
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {Math.round(progress)}% concluído
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}