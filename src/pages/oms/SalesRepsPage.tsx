import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  User, 
  Mail, 
  Phone,
  DollarSign,
  Shield,
  AlertCircle
} from "lucide-react";
import { useOMSSalesReps } from "@/hooks/useOMSData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SalesRep {
  id: string;
  name: string;
  email: string;
  phone?: string;
  default_commission_pct?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SalesRepsPage() {
  const { salesReps, loading, refetch } = useOMSSalesReps();
  const { toast } = useToast();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRep, setSelectedRep] = useState<SalesRep | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    default_commission_pct: 5.0,
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      default_commission_pct: 5.0,
      is_active: true
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (rep: SalesRep) => {
    setSelectedRep(rep);
    setFormData({
      name: rep.name,
      email: rep.email,
      phone: rep.phone || '',
      default_commission_pct: rep.default_commission_pct || 5.0,
      is_active: rep.is_active
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('oms_sales_reps')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vendedor criado com sucesso!"
      });

      setIsCreateModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Erro ao criar vendedor:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar vendedor",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('oms_sales_reps')
        .update(formData)
        .eq('id', selectedRep.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vendedor atualizado com sucesso!"
      });

      setIsEditModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar vendedor:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar vendedor",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (repId: string) => {
    if (!confirm('Tem certeza que deseja excluir este vendedor?')) return;

    try {
      const { error } = await supabase
        .from('oms_sales_reps')
        .update({ is_active: false })
        .eq('id', repId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vendedor removido com sucesso!"
      });

      refetch();
    } catch (error) {
      console.error('Erro ao remover vendedor:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover vendedor",
        variant: "destructive"
      });
    }
  };

  const activeSalesReps = salesReps.filter(rep => rep.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Vendedores</h1>
          <p className="text-muted-foreground">
            Gerencie seus representantes comerciais
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Vendedor
        </Button>
      </div>

      {/* Info sobre Sistema de Acesso */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Sistema de Acesso para Vendedores
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Vendedores cadastrados aqui podem acessar o sistema usando o mesmo email cadastrado. 
                Eles terão acesso apenas aos próprios pedidos através da página <code>/vendor/dashboard</code>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSalesReps.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissão Média</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {activeSalesReps.length > 0 
                ? (activeSalesReps.reduce((sum, rep) => sum + (rep.default_commission_pct || 0), 0) / activeSalesReps.length).toFixed(1)
                : 0
              }%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas no Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground">Pedidos aprovados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0</div>
            <p className="text-xs text-muted-foreground">Total no mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Vendedores */}
      <Card>
        <CardHeader>
          <CardTitle>Vendedores ({activeSalesReps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando vendedores...</div>
          ) : activeSalesReps.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum vendedor cadastrado</p>
              <Button className="mt-4" onClick={handleCreate}>
                Cadastrar Primeiro Vendedor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSalesReps.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell className="font-medium">{rep.name}</TableCell>
                    <TableCell>{rep.email}</TableCell>
                    <TableCell>{rep.phone || '-'}</TableCell>
                    <TableCell>{rep.default_commission_pct || 0}%</TableCell>
                    <TableCell>
                      <Badge variant={rep.is_active ? 'default' : 'secondary'}>
                        {rep.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(rep)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(rep.id)}
                          title="Remover"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Vendedor</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Nome completo"
              />
            </div>
            
            <div>
              <Label>E-mail *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder="email@empresa.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O vendedor poderá acessar o sistema com este email
              </p>
            </div>
            
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div>
              <Label>Comissão Padrão (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.default_commission_pct}
                onChange={(e) => setFormData(prev => ({ ...prev, default_commission_pct: parseFloat(e.target.value) }))}
              />
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Criando..." : "Criar Vendedor"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Vendedor</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label>E-mail *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div>
              <Label>Comissão Padrão (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.default_commission_pct}
                onChange={(e) => setFormData(prev => ({ ...prev, default_commission_pct: parseFloat(e.target.value) }))}
              />
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}