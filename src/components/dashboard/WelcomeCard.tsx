import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, DollarSign } from "lucide-react";

export function WelcomeCard() {
  return (
    <Card className="relative overflow-hidden bg-gradient-primary text-white">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Bem-vindo ao REISTOQ</h2>
              <p className="text-white/80 mb-6">
                Gerencie seu estoque com inteligência e precisão
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm text-white/80">Vendas Hoje</span>
                </div>
                <div className="text-2xl font-bold">R$ 12.450</div>
                <div className="text-sm text-white/80">+15% vs ontem</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm text-white/80">Pedidos</span>
                </div>
                <div className="text-2xl font-bold">89</div>
                <div className="text-sm text-white/80">+8% vs ontem</div>
              </div>
            </div>

            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
              Ver Relatório Detalhado
            </Button>
          </div>
          
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
              <DollarSign className="w-16 h-16 text-white/60" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}