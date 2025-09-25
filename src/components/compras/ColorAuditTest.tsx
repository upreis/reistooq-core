// Teste de cores para auditoria - pode ser removido depois
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, DollarSign, AlertCircle, Eye, Edit, Trash2 } from "lucide-react";

export const ColorAuditTest: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Teste de Cores - Modo Dark/Light</h1>
      
      {/* Teste de ícones nos cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Cotações</p>
                <p className="text-2xl font-bold">25</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Finalizadas</p>
                <p className="text-2xl font-bold">17</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">R$ 125.000,00</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teste de badges de status */}
      <Card>
        <CardHeader>
          <CardTitle>Badges de Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Badge variant="default" className="gap-1">
              <Clock className="h-3 w-3" />
              Aberta
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Fechada
            </Badge>
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Cancelada
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Teste de blocos informativos */}
      <Card>
        <CardHeader>
          <CardTitle>Blocos Informativos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="text-sm text-muted-foreground">Moeda Origem</div>
              <div className="text-lg font-bold">¥ 100.00</div>
            </div>
            <div className="text-center p-4 bg-success/5 border border-success/20 rounded-lg">
              <div className="text-sm text-muted-foreground">Em Dólares</div>
              <div className="text-lg font-bold">$ 14.25</div>
            </div>
            <div className="text-center p-4 bg-warning/5 border border-warning/20 rounded-lg">
              <div className="text-sm text-muted-foreground">Em Reais</div>
              <div className="text-lg font-bold">R$ 74.10</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teste de botões de ação */}
      <Card>
        <CardHeader>
          <CardTitle>Botões de Ação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teste de validações */}
      <Card>
        <CardHeader>
          <CardTitle>Estados de Validação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>Campo obrigatório não preenchido</span>
            </div>
            <div className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-3 w-3" />
              <span>Atenção: nenhum produto adicionado</span>
            </div>
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-3 w-3" />
              <span>Formulário válido e pronto</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teste de valores financeiros */}
      <Card>
        <CardHeader>
          <CardTitle>Valores Financeiros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground">Valor em CNY</div>
                <div className="text-2xl font-bold text-primary">¥ 15,000.00</div>
                <div className="text-xs text-muted-foreground">Moeda de origem</div>
              </CardContent>
            </Card>
            <Card className="border-success/20">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground">Valor em USD</div>
                <div className="text-2xl font-bold text-success">$ 2,142.85</div>
                <div className="text-xs text-muted-foreground">Dólar americano</div>
              </CardContent>
            </Card>
            <Card className="border-warning/20">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground">Valor em BRL</div>
                <div className="text-2xl font-bold text-warning">R$ 11,142.83</div>
                <div className="text-xs text-muted-foreground">Real brasileiro</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};