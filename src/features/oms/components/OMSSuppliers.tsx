import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Plus,
  Building,
  Mail,
  Phone,
  MapPin,
  Eye,
  Edit,
  Star,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package,
  Truck,
  DollarSign,
  FileText,
  Calendar
} from "lucide-react";

// Mock data for suppliers
const mockSuppliers = [
  {
    id: "1",
    nome: "Fornecedor Premium Ltda",
    cnpj: "12.345.678/0001-90",
    email: "contato@premium.com",
    telefone: "(11) 99999-9999",
    cidade: "São Paulo",
    uf: "SP",
    categoria: "Eletrônicos",
    status: "Ativo",
    rating: 4.8,
    pedidosRealizados: 45,
    tempoMedioEntrega: 3.2,
    valorTotal: 125000,
    ultimoPedido: "2024-01-15",
    confiabilidade: "Excelente"
  },
  {
    id: "2", 
    nome: "Distribuidora Nacional S.A.",
    cnpj: "98.765.432/0001-10",
    email: "vendas@nacional.com",
    telefone: "(21) 88888-8888",
    cidade: "Rio de Janeiro", 
    uf: "RJ",
    categoria: "Roupas",
    status: "Ativo",
    rating: 4.2,
    pedidosRealizados: 32,
    tempoMedioEntrega: 5.1,
    valorTotal: 89000,
    ultimoPedido: "2024-01-10",
    confiabilidade: "Boa"
  },
  {
    id: "3",
    nome: "Tech Solutions EIRELI",
    cnpj: "11.222.333/0001-44",
    email: "suporte@techsol.com", 
    telefone: "(31) 77777-7777",
    cidade: "Belo Horizonte",
    uf: "MG",
    categoria: "Software",
    status: "Pendente",
    rating: 3.9,
    pedidosRealizados: 12,
    tempoMedioEntrega: 7.5,
    valorTotal: 45000,
    ultimoPedido: "2024-01-08",
    confiabilidade: "Regular"
  }
];

const mockCotacoes = [
  {
    id: "COT-001",
    fornecedor: "Fornecedor Premium Ltda",
    produto: "Smartphone Galaxy S24",
    quantidade: 50,
    precoUnitario: 1200,
    prazoEntrega: 5,
    status: "Aguardando",
    validadeOferta: "2024-01-20"
  },
  {
    id: "COT-002", 
    fornecedor: "Distribuidora Nacional S.A.",
    produto: "Notebook Dell Inspiron",
    quantidade: 25,
    precoUnitario: 2800,
    prazoEntrega: 7,
    status: "Aprovada",
    validadeOferta: "2024-01-25"
  }
];

export function OMSSuppliers() {
  const [activeTab, setActiveTab] = useState("fornecedores");
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo': return 'bg-green-500';
      case 'pendente': return 'bg-yellow-500';
      case 'inativo': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConfiabilidadeColor = (confiabilidade: string) => {
    switch (confiabilidade.toLowerCase()) {
      case 'excelente': return 'text-green-600';
      case 'boa': return 'text-blue-600';
      case 'regular': return 'text-yellow-600';
      case 'ruim': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${
              i < fullStars 
                ? 'text-yellow-400 fill-yellow-400' 
                : i === fullStars && hasHalfStar 
                  ? 'text-yellow-400 fill-yellow-400/50'
                  : 'text-gray-300'
            }`} 
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{rating}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie fornecedores, cotações e avaliações de performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Nova Cotação
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fornecedores</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <Building className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fornecedores Ativos</p>
                <p className="text-2xl font-bold">142</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cotações Pendentes</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Economia do Mês</p>
                <p className="text-2xl font-bold">R$ 12,5k</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="cotacoes">Cotações</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="fornecedores" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Buscar por nome, CNPJ, categoria..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                    <SelectItem value="roupas">Roupas</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Suppliers List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSuppliers.map((supplier) => (
                  <div key={supplier.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Building className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{supplier.nome}</span>
                            <Badge variant="outline" className={`${getStatusColor(supplier.status)} text-white`}>
                              {supplier.status}
                            </Badge>
                            <Badge variant="secondary">{supplier.categoria}</Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <span>CNPJ: {supplier.cnpj}</span>
                            <div className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {supplier.email}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {supplier.cidade}, {supplier.uf}
                            </div>
                          </div>
                          <div className="mt-2">
                            {getRatingStars(supplier.rating)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Pedidos</p>
                          <p className="font-medium">{supplier.pedidosRealizados}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Tempo Médio</p>
                          <p className="font-medium">{supplier.tempoMedioEntrega} dias</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Comprado</p>
                          <p className="font-medium">R$ {supplier.valorTotal.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Confiabilidade</p>
                          <p className={`font-medium ${getConfiabilidadeColor(supplier.confiabilidade)}`}>
                            {supplier.confiabilidade}
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
        </TabsContent>

        <TabsContent value="cotacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cotações em Andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCotacoes.map((cotacao) => (
                  <div key={cotacao.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">#{cotacao.id}</span>
                          <Badge variant={cotacao.status === 'Aprovada' ? 'default' : 'secondary'}>
                            {cotacao.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{cotacao.fornecedor}</p>
                        <p className="font-medium">{cotacao.produto}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {cotacao.quantidade}x - R$ {cotacao.precoUnitario.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Entrega: {cotacao.prazoEntrega} dias
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Válido até: {new Date(cotacao.validadeOferta).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance dos Fornecedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSuppliers.slice(0, 3).map((supplier, index) => (
                    <div key={supplier.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{supplier.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {supplier.pedidosRealizados} pedidos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Score: {supplier.rating}</p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.tempoMedioEntrega} dias médio
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas e Recomendações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Fornecedor com atraso
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-300">
                        Tech Solutions tem 3 entregas em atraso este mês
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        Oportunidade de economia
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        Renegociar preços com Fornecedor Premium pode gerar 8% de economia
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Fornecedor recomendado
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        Distribuidora Nacional tem excelente performance este trimestre
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}