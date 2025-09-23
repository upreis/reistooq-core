import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Eye,
  Edit,
  Trash2,
  Star,
  CheckCircle,
  AlertTriangle,
  Users
} from "lucide-react";

interface FornecedoresTabProps {
  fornecedores?: any[];
  onRefresh: () => void;
}

export const FornecedoresTab: React.FC<FornecedoresTabProps> = ({
  fornecedores = [],
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFornecedores = fornecedores.filter(fornecedor =>
    fornecedor.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getStatusBadge = (ativo: boolean) => {
    return ativo ? (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Inativo
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const fornecedoresAtivos = fornecedores.filter(f => f.ativo !== false).length;
  const avaliacaoMedia = fornecedores.length > 0 
    ? fornecedores.reduce((acc, f) => acc + (f.avaliacao || 5), 0) / fornecedores.length 
    : 0;
  const valorTotalGeral = fornecedores.reduce((acc, f) => acc + (f.valor_total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar fornecedores por nome, CNPJ ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Fornecedores</p>
                <p className="text-2xl font-bold">{fornecedores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{fornecedoresAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold">{avaliacaoMedia.toFixed(1)}</p>
                  <div className="flex">
                    {renderStars(avaliacaoMedia)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Volume Total</p>
                <p className="text-2xl font-bold">{formatCurrency(valorTotalGeral)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Fornecedores
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Localização</TableHead>
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
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
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
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {fornecedor.email}
                        </div>
                      )}
                      {fornecedor.telefone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {fornecedor.telefone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(fornecedor.cidade || fornecedor.estado) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {fornecedor.cidade}{fornecedor.cidade && fornecedor.estado && ', '}{fornecedor.estado}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {fornecedor.categoria && (
                      <Badge variant="outline">{fornecedor.categoria}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderStars(fornecedor.avaliacao || 5)}
                      </div>
                      <span className="text-sm font-medium">
                        {(fornecedor.avaliacao || 5).toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(fornecedor.ativo !== false)}
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

          {filteredFornecedores.length === 0 && (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum fornecedor encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece cadastrando seu primeiro fornecedor'
                }
              </p>
              {!searchTerm && (
                <Button>
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