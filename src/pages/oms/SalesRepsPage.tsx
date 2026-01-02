import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  User, 
  DollarSign,
  Shield
} from "lucide-react";
import { useOMSSalesReps } from "@/hooks/useOMSData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SalesRepForm } from "@/components/oms/SalesRepForm";

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

  const handleFormSubmitCreate = async (data: any) => {
    setSubmitting(true);

    try {
      // Get current user's organization_id
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.organizacao_id) throw new Error('Organização não encontrada');

      const { error } = await supabase
        .from('oms_sales_reps')
        .insert([{ ...data, organization_id: profile.organizacao_id }]);

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

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    handleFormSubmitCreate(formData);
  };

  const handleFormSubmitEdit = async (data: any) => {
    if (!selectedRep) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('oms_sales_reps')
        .update(data)
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

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleFormSubmitEdit(formData);
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
          <h1 className="text-xl font-bold">Vendedores</h1>
          <p className="text-xs text-muted-foreground">
            Gerencie seus representantes comerciais
          </p>
        </div>
        <Button onClick={handleCreate} className="h-7 px-2.5 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Novo Vendedor
        </Button>
      </div>


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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Novo Vendedor</DialogTitle>
          </DialogHeader>
          <SalesRepForm
            onSubmit={handleFormSubmitCreate}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar Vendedor</DialogTitle>
          </DialogHeader>
          <SalesRepForm
            salesRep={selectedRep}
            onSubmit={handleFormSubmitEdit}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={submitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}