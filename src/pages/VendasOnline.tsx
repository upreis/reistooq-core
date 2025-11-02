/**
 * 📦 VENDAS ONLINE - Página Principal
 * Gerenciamento completo de vendas do Mercado Livre
 */

import { VendasFiltersBar } from '@/features/vendas-online/components/VendasFiltersBar';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function VendasOnline() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Vendas Online</h1>
        <p className="text-muted-foreground">
          Gerencie todas as suas vendas do Mercado Livre em um só lugar
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Vendas</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Concluídas</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Faturamento</p>
              <p className="text-2xl font-bold">R$ 0</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Filters */}
      <VendasFiltersBar />
      
      {/* Main Content */}
      <Card className="p-6">
        <Alert>
          <AlertDescription>
            🚀 <strong>FASE 1 Implementada!</strong> A estrutura base está pronta. 
            Próximo passo: integração com API do Mercado Livre (FASE 2).
          </AlertDescription>
        </Alert>
      </Card>
    </div>
  );
}
