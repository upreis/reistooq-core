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
  Phone, 
  Mail, 
  MapPin, 
  Star,
  Building2,
  User,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompras } from "@/hooks/useCompras";

interface FornecedoresTabProps {
  fornecedores: any[];
  searchTerm: string;
  selectedStatus: string;
  onRefresh: () => void;
}

export const FornecedoresTab: React.FC<FornecedoresTabProps> = ({
  fornecedores,
  searchTerm,
  selectedStatus,
  onRefresh
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    contato_principal: '',
    observacoes: '',
    categoria: '',
    avaliacao: 5,
    ativo: true
  });
  const { toast } = useToast();
  const { createFornecedor, updateFornecedor, deleteFornecedor } = useCompras();

  // Filtrar fornecedores
  const filteredFornecedores = fornecedores.filter(fornecedor => {
    const matchesSearch = fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fornecedor.cnpj.includes(searchTerm) ||
                         fornecedor.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'ativo' && fornecedor.ativo) ||
                         (selectedStatus === 'inativo' && !fornecedor.ativo);
    
    return matchesSearch && matchesStatus;
  });

  const handleSave = async () => {
    try {
      if (editingFornecedor) {
        await updateFornecedor(editingFornecedor.id, formData);
      } else {
        await createFornecedor(formData);
      }
      
      toast({
        title: editingFornecedor ? "Fornecedor atualizado" : "Fornecedor criado",
        description: "Operação realizada com sucesso!",
      });
      
      setIsModalOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o fornecedor.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (fornecedor: any) => {
    setEditingFornecedor(fornecedor);
    setFormData(fornecedor);
    setIsModalOpen(true);
  };

  const handleDelete = async (fornecedorId: string) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;
    
    try {
      await deleteFornecedor(fornecedorId);
      toast({
        title: "Fornecedor excluído",
        description: "Fornecedor removido com sucesso!",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o fornecedor.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      contato_principal: '',
      observacoes: '',
      categoria: '',
      avaliacao: 5,
      ativo: true
    });
    setEditingFornecedor(null);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de novo fornecedor */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fornecedores</h2>
          <p className="text-muted-foreground">
            Gerencie seus fornecedores e mantenha informações atualizadas
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dados básicos */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome/Razão Social *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@fornecedor.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contato_principal">Contato Principal</Label>
                  <Input
                    id="contato_principal"
                    value={formData.contato_principal}
                    onChange={(e) => setFormData({ ...formData, contato_principal: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>
              
              {/* Endereço e outros */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
                
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select 
                    value={formData.categoria} 
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="materiais">Materiais</SelectItem>
                      <SelectItem value="equipamentos">Equipamentos</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                      <SelectItem value="tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="avaliacao">Avaliação (1-5)</Label>
                  <Select 
                    value={formData.avaliacao.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, avaliacao: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Estrela</SelectItem>
                      <SelectItem value="2">2 Estrelas</SelectItem>
                      <SelectItem value="3">3 Estrelas</SelectItem>
                      <SelectItem value="4">4 Estrelas</SelectItem>
                      <SelectItem value="5">5 Estrelas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Observações - span completo */}
              <div className="md:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre o fornecedor"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingFornecedor ? 'Atualizar' : 'Criar'} Fornecedor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de fornecedores */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFornecedores.map((fornecedor) => (
                <TableRow key={fornecedor.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {fornecedor.nome}
                      </div>
                      {fornecedor.cnpj && (
                        <div className="text-sm text-muted-foreground">
                          CNPJ: {fornecedor.cnpj}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {fornecedor.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {fornecedor.email}
                        </div>
                      )}
                      {fornecedor.telefone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {fornecedor.telefone}
                        </div>
                      )}
                      {fornecedor.contato_principal && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {fornecedor.contato_principal}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {fornecedor.categoria && (
                      <Badge variant="secondary">
                        {fornecedor.categoria}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {renderStars(fornecedor.avaliacao || 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={fornecedor.ativo ? "default" : "secondary"}>
                      {fornecedor.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(fornecedor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(fornecedor.id)}
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
          
          {filteredFornecedores.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum fornecedor encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece cadastrando seu primeiro fornecedor'
                }
              </p>
              {!searchTerm && selectedStatus === 'all' && (
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Fornecedor
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};