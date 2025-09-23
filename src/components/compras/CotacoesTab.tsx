import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  Building, 
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface CotacoesTabProps {
  cotacoes?: any[];
  onRefresh: () => void;
}

// Mock de cotações para demonstração
const mockCotacoes = [
  {
    id: '1',
    numero_cotacao: 'COT-001',
    descricao: 'Materiais de escritório',
    data_abertura: '2024-01-15',
    data_fechamento: null,
    status: 'aberta',
    valor_estimado: 2500.00,
    fornecedores_convidados: 3,
    propostas_recebidas: 1
  },
  {
    id: '2',
    numero_cotacao: 'COT-002',
    descricao: 'Equipamentos de informática',
    data_abertura: '2024-01-10',
    data_fechamento: '2024-01-20',
    status: 'fechada',
    valor_estimado: 15000.00,
    fornecedores_convidados: 5,
    propostas_recebidas: 4
  }
];

export const CotacoesTab: React.FC<CotacoesTabProps> = ({
  cotacoes = mockCotacoes,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCotacoes = cotacoes.filter(cotacao =>
    cotacao.numero_cotacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotacao.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      aberta: { variant: "default" as const, label: "Aberta", icon: Clock },
      fechada: { variant: "secondary" as const, label: "Fechada", icon: CheckCircle },
      cancelada: { variant: "destructive" as const, label: "Cancelada", icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig.aberta;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar cotações por número ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Cotação
        </Button>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Cotações</p>
                <p className="text-2xl font-bold">{cotacoes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">
                  {cotacoes.filter(c => c.status === 'aberta').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Finalizadas</p>
                <p className="text-2xl font-bold">
                  {cotacoes.filter(c => c.status === 'fechada').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    cotacoes.reduce((total, c) => total + (c.valor_estimado || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Cotações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Cotações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cotação</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data Abertura</TableHead>
                <TableHead>Valor Estimado</TableHead>
                <TableHead>Propostas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCotacoes.map((cotacao) => (
                <TableRow key={cotacao.id}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {cotacao.numero_cotacao}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{cotacao.descricao}</p>
                      {cotacao.data_fechamento && (
                        <p className="text-sm text-muted-foreground">
                          Fechada em: {formatDate(cotacao.data_fechamento)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {formatDate(cotacao.data_abertura)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      {formatCurrency(cotacao.valor_estimado)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <p className="font-medium">
                        {cotacao.propostas_recebidas}/{cotacao.fornecedores_convidados}
                      </p>
                      <p className="text-xs text-muted-foreground">recebidas</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(cotacao.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCotacoes.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma cotação encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira cotação'
                }
              </p>
              {!searchTerm && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Cotação
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};