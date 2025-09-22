import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Eye, TrendingUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CotacoesTabProps {
  cotacoes: any[];
  fornecedores: any[];
  searchTerm: string;
  selectedStatus: string;
  onRefresh: () => void;
}

export const CotacoesTab: React.FC<CotacoesTabProps> = ({
  cotacoes,
  fornecedores,
  searchTerm,
  selectedStatus,
  onRefresh
}) => {
  const { toast } = useToast();

  const filteredCotacoes = cotacoes.filter(cotacao => {
    const matchesSearch = cotacao.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cotacao.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || cotacao.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'aberta': 'bg-blue-100 text-blue-700',
      'em_analise': 'bg-yellow-100 text-yellow-700',
      'finalizada': 'bg-green-100 text-green-700',
      'cancelada': 'bg-red-100 text-red-700'
    };
    
    return (
      <Badge variant="secondary" className={statusColors[status] || statusColors['aberta']}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Cotações</h2>
          <p className="text-muted-foreground">
            Gerencie cotações e compare preços de fornecedores
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Cotação
        </Button>
      </div>

      {/* Tabela de cotações */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data Abertura</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Propostas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCotacoes.map((cotacao) => (
                <TableRow key={cotacao.id}>
                  <TableCell className="font-medium">
                    {cotacao.numero}
                  </TableCell>
                  <TableCell>
                    {cotacao.descricao}
                  </TableCell>
                  <TableCell>
                    {formatDate(cotacao.data_abertura)}
                  </TableCell>
                  <TableCell>
                    {formatDate(cotacao.prazo_resposta)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {cotacao.propostas?.length || 0} propostas
                    </Badge>
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCotacoes.length === 0 && (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma cotação encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedStatus !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira cotação'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};