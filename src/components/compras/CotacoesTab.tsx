import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Send,
  Clock,
  CheckCircle,
  TrendingUp,
  Building2,
  Calendar,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompras } from "@/hooks/useCompras";

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
  const { createCotacao, loading } = useCompras();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCotacao, setEditingCotacao] = useState(null);
  const [formData, setFormData] = useState({
    numero_cotacao: '',
    descricao: '',
    data_abertura: new Date().toISOString().split('T')[0],
    data_fechamento: '',
    status: 'aberta',
    observacoes: ''
  });

  const filteredCotacoes = cotacoes.filter(cotacao => {
    const matchesSearch = cotacao.numero_cotacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cotacao.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || cotacao.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleSave = async () => {
    try {
      // Gerar número automaticamente se não informado
      if (!formData.numero_cotacao) {
        const nextNumber = `COT-${new Date().getFullYear()}-${String(cotacoes.length + 1).padStart(3, '0')}`;
        formData.numero_cotacao = nextNumber;
      }

      await createCotacao(formData);
      
      toast({
        title: editingCotacao ? "Cotação atualizada" : "Cotação criada",
        description: "Operação realizada com sucesso!",
      });
      
      setIsModalOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a cotação.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      numero_cotacao: '',
      descricao: '',
      data_abertura: new Date().toISOString().split('T')[0],
      data_fechamento: '',
      status: 'aberta',
      observacoes: ''
    });
    setEditingCotacao(null);
  };

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
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Cotação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCotacao ? 'Editar Cotação' : 'Nova Cotação'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero_cotacao">Número da Cotação</Label>
                <Input
                  id="numero_cotacao"
                  value={formData.numero_cotacao}
                  onChange={(e) => setFormData({ ...formData, numero_cotacao: e.target.value })}
                  placeholder="Deixe vazio para gerar automaticamente"
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberta">Aberta</SelectItem>
                    <SelectItem value="enviada">Enviada</SelectItem>
                    <SelectItem value="respondida">Respondida</SelectItem>
                    <SelectItem value="fechada">Fechada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="data_abertura">Data de Abertura</Label>
                <Input
                  id="data_abertura"
                  type="date"
                  value={formData.data_abertura}
                  onChange={(e) => setFormData({ ...formData, data_abertura: e.target.value })}
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
              
              <div className="md:col-span-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição da cotação"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre a cotação"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading || !formData.descricao}>
                {loading ? 'Salvando...' : (editingCotacao ? 'Atualizar' : 'Criar')} Cotação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de cotações */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cotação</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedores</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCotacoes.map((cotacao) => (
                <TableRow key={cotacao.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        {cotacao.numero_cotacao}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Aberta: {formatDate(cotacao.data_abertura)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="font-medium truncate">{cotacao.descricao}</div>
                      {cotacao.observacoes && (
                        <div className="text-sm text-muted-foreground truncate">
                          {cotacao.observacoes}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {cotacao.fornecedores_count || 0} fornecedores
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Início: {formatDate(cotacao.data_abertura)}</div>
                      {cotacao.data_fechamento && (
                        <div className="text-muted-foreground">
                          Fim: {formatDate(cotacao.data_fechamento)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(cotacao.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Implementar visualização detalhada
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCotacao(cotacao);
                          setFormData(cotacao);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir esta cotação?')) {
                            // Implementar exclusão
                          }
                        }}
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