import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  AlertCircle,
  ShoppingCart
} from "lucide-react";
import { ProductSelectorShop } from "./ProductSelectorShop";

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
  const [showForm, setShowForm] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [formData, setFormData] = useState({
    descricao: '',
    valor_estimado: 0,
    data_fechamento: '',
    observacoes: ''
  });

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
        
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Nova Cotação
        </Button>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
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
              <Clock className="h-8 w-8 text-warning" />
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
              <CheckCircle className="h-8 w-8 text-success" />
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
              <DollarSign className="h-8 w-8 text-accent" />
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
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Cotação
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar nova cotação */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Cotação</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova cotação
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Materiais de escritório"
              />
            </div>
            
            <div>
              <Label htmlFor="valor_estimado">Valor Estimado</Label>
              <Input
                id="valor_estimado"
                type="number"
                step="0.01"
                value={formData.valor_estimado}
                onChange={(e) => setFormData({ ...formData, valor_estimado: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="data_fechamento">Data de Fechamento</Label>
              <Input
                id="data_fechamento"
                type="date"
                value={formData.data_fechamento}
                onChange={(e) => setFormData({ ...formData, data_fechamento: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais sobre a cotação..."
                rows={3}
              />
            </div>

            {/* Seletor de Produtos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Produtos para Cotação</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProductSelector(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Usar Seletor Avançado
                </Button>
              </div>
              
              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhum produto selecionado</p>
                  <Button 
                    onClick={() => setShowProductSelector(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Selecionar Produtos
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{product.nome}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>SKU: {product.sku_interno}</span>
                          <span>Qtd: {product.quantidade}</span>
                          <span>Preço: R$ {product.preco_custo.toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProducts(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-right text-sm font-medium">
                    Total: R$ {selectedProducts.reduce((sum, p) => sum + (p.preco_custo * p.quantidade), 0).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => {
                  // Aqui você pode chamar a função de criar cotação
                  console.log('Criando cotação:', formData);
                  setShowForm(false);
                  setFormData({ descricao: '', valor_estimado: 0, data_fechamento: '', observacoes: '' });
                  onRefresh();
                }}
                disabled={!formData.descricao}
              >
                Criar Cotação
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setFormData({ descricao: '', valor_estimado: 0, data_fechamento: '', observacoes: '' });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Seletor de Produtos */}
      <ProductSelectorShop
        isOpen={showProductSelector}
        onOpenChange={setShowProductSelector}
        onSelectProducts={setSelectedProducts}
        selectedProducts={selectedProducts}
      />
    </div>
  );
};