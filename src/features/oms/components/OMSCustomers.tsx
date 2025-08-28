import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  Eye,
  Edit,
  Star,
  TrendingUp
} from "lucide-react";

// Mock data for customers
const mockCustomers = [
  {
    id: "1",
    nome: "João Silva",
    email: "joao@email.com",
    telefone: "(11) 99999-9999",
    cidade: "São Paulo",
    uf: "SP",
    totalPedidos: 15,
    totalGasto: 12500,
    ultimoPedido: "2024-01-15",
    status: "VIP"
  },
  {
    id: "2", 
    nome: "Maria Oliveira",
    email: "maria@email.com",
    telefone: "(21) 88888-8888",
    cidade: "Rio de Janeiro", 
    uf: "RJ",
    totalPedidos: 8,
    totalGasto: 6800,
    ultimoPedido: "2024-01-10",
    status: "Regular"
  },
  {
    id: "3",
    nome: "Pedro Santos",
    email: "pedro@email.com", 
    telefone: "(31) 77777-7777",
    cidade: "Belo Horizonte",
    uf: "MG",
    totalPedidos: 22,
    totalGasto: 18900,
    ultimoPedido: "2024-01-12",
    status: "Premium"
  }
];

export function OMSCustomers() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VIP': return 'bg-purple-500';
      case 'Premium': return 'bg-gold-500';
      case 'Regular': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seu relacionamento com clientes
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <User className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold">892</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">R$ 387</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">LTV Médio</p>
                <p className="text-2xl font-bold">R$ 2,430</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Buscar por nome, email, telefone..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCustomers.map((customer) => (
              <div key={customer.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{customer.nome}</span>
                        <Badge variant="outline" className={getStatusColor(customer.status)}>
                          {customer.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {customer.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {customer.telefone}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {customer.cidade}, {customer.uf}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Pedidos</p>
                      <p className="font-medium">{customer.totalPedidos}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Gasto</p>
                      <p className="font-medium">R$ {customer.totalGasto.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Último Pedido</p>
                      <p className="font-medium">
                        {new Date(customer.ultimoPedido).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}