import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { CustomerForm } from "@/components/oms/CustomerForm";
import { useOMSCustomers } from "@/hooks/useOMSData";
import { useToast } from "@/hooks/use-toast";

export default function CustomersPage() {
  const { toast } = useToast();
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useOMSCustomers();
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.doc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCustomer = async (data: any) => {
    try {
      await createCustomer(data);
      setCustomerDialogOpen(false);
      setEditingCustomer(null);
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar cliente",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCustomer = async (data: any) => {
    try {
      await updateCustomer(editingCustomer.id, data);
      setCustomerDialogOpen(false);
      setEditingCustomer(null);
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar cliente",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        await deleteCustomer(id);
        toast({
          title: "Sucesso",
          description: "Cliente excluído com sucesso!"
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir cliente",
          variant: "destructive"
        });
      }
    }
  };

  const openEditDialog = (customer: any) => {
    setEditingCustomer(customer);
    setCustomerDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCustomer(null);
    setCustomerDialogOpen(true);
  };

  const closeDialog = () => {
    setCustomerDialogOpen(false);
    setEditingCustomer(null);
  };

  // Calcular estatísticas por tier
  const tierStats = {
    standard: customers.filter(c => c.price_tier === 'standard').length,
    premium: customers.filter(c => c.price_tier === 'premium').length,
    vip: customers.filter(c => c.price_tier === 'vip').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes OMS</h1>
          <p className="text-muted-foreground">
            Gerencie sua base de clientes B2B
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Standard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{tierStats.standard}</div>
            <p className="text-xs text-muted-foreground">100% do preço</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{tierStats.premium}</div>
            <p className="text-xs text-muted-foreground">95% do preço</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-600">{tierStats.vip}</div>
            <p className="text-xs text-muted-foreground">90% do preço</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, documento ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.doc || '-'}</TableCell>
                  <TableCell>{customer.email || '-'}</TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        customer.price_tier === 'vip' ? 'default' :
                        customer.price_tier === 'premium' ? 'secondary' : 'outline'
                      }
                    >
                      {customer.price_tier.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {customer.payment_terms === 'cash' && 'À Vista'}
                    {customer.payment_terms === '15_days' && '15 Dias'}
                    {customer.payment_terms === '30_days' && '30 Dias'}
                    {customer.payment_terms === '45_days' && '45 Dias'}
                    {customer.payment_terms === '60_days' && '60 Dias'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCustomer(customer.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Criação/Edição */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <CustomerForm
            customer={editingCustomer}
            onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
            onCancel={closeDialog}
            isLoading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}