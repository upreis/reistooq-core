// 🎯 Visualizador de Logs de Auditoria
// Interface para acompanhar atividades do sistema

import React, { useState } from 'react';
import { useAuditLogs } from '../hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Filter, Download, Search, Calendar, User, Activity } from 'lucide-react';

export const AuditLogsViewer: React.FC = () => {
  const { logs, loading, filters, setFilters, refreshLogs } = useAuditLogs();
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' || !value ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const exportLogs = () => {
    // TODO: Implement export functionality
    console.log('Export logs functionality will be implemented');
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return 'text-green-600';
      case 'update':
      case 'edit':
        return 'text-blue-600';
      case 'delete':
      case 'remove':
        return 'text-red-600';
      case 'login':
      case 'authenticate':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return <Badge variant="default">Criação</Badge>;
      case 'update':
      case 'edit':
        return <Badge variant="secondary">Edição</Badge>;
      case 'delete':
      case 'remove':
        return <Badge variant="destructive">Exclusão</Badge>;
      case 'login':
      case 'authenticate':
        return <Badge variant="outline">Autenticação</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando logs de auditoria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <History className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Logs de Auditoria</h2>
            <p className="text-muted-foreground">
              Acompanhe todas as atividades do sistema
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="outline"
            onClick={exportLogs}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={refreshLogs}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">Usuário</Label>
                <Input
                  id="user_id"
                  placeholder="ID do usuário"
                  value={filters.user_id || ''}
                  onChange={(e) => handleFilterChange('user_id', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Ação</Label>
                <Select 
                  value={filters.action || 'all'} 
                  onValueChange={(value) => handleFilterChange('action', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="create">Criação</SelectItem>
                    <SelectItem value="update">Edição</SelectItem>
                    <SelectItem value="delete">Exclusão</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Recurso</Label>
                <Select 
                  value={filters.resource_type || 'all'} 
                  onValueChange={(value) => handleFilterChange('resource_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os recursos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os recursos</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="role">Cargo</SelectItem>
                    <SelectItem value="product">Produto</SelectItem>
                    <SelectItem value="order">Pedido</SelectItem>
                    <SelectItem value="integration">Integração</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_from">Data (a partir de)</Label>
                <Input
                  id="date_from"
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs List */}
      <div className="space-y-4">
        {logs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum log encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Não há logs de auditoria para os filtros selecionados ou a funcionalidade ainda não foi implementada.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">📋 Status da Implementação</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Os logs de auditoria requerem a criação de uma tabela adicional no banco de dados.
                </p>
                <p className="text-sm text-muted-foreground">
                  Funcionalidade será implementada na próxima fase do desenvolvimento.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          logs.map(log => (
            <Card key={log.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      {getActionBadge(log.action)}
                      <span className="text-sm font-medium">{log.resource_type}</span>
                      {log.resource_id && (
                        <span className="text-xs text-muted-foreground">
                          ID: {log.resource_id}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {log.user_id && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Usuário: {log.user_id}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                      {log.ip_address && (
                        <span>IP: {log.ip_address}</span>
                      )}
                    </div>

                    {log.details && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground">
                          Ver detalhes
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Activity className={`w-4 h-4 ${getActionColor(log.action)}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination placeholder */}
      {logs.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">Página 1 de 1</span>
          <Button variant="outline" size="sm" disabled>
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};