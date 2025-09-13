import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Filter, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RawData {
  id: number;
  created_at: string;
  data_type: string;
  order_id: string | null;
  claim_id: string | null;
  raw_json: any;
  integration_account_id: string;
  organization_id: string;
}

export default function MLRawData() {
  const [rawData, setRawData] = useState<RawData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedJson, setSelectedJson] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRawData();
  }, []);

  const fetchRawData = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('ml_api_raw_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('data_type', typeFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar dados raw:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar dados da API.',
          variant: 'destructive',
        });
        return;
      }

      setRawData(data || []);
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao carregar dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = rawData.filter(item => {
    const matchesSearch = !searchTerm || 
      item.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.claim_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(item.raw_json).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatJson = (json: any) => {
    return JSON.stringify(json, null, 2);
  };

  const getTypeColor = (type: string) => {
    return type === 'order' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Raw Data - ML</h1>
          <p className="text-muted-foreground">
            Dados brutos capturados da API do Mercado Livre
          </p>
        </div>
        <Button onClick={fetchRawData} disabled={loading}>
          {loading ? 'Carregando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por Order ID, Claim ID ou conteúdo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de dados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="claim">Claims</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{filteredData.length}</div>
            <p className="text-muted-foreground">Total de registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {filteredData.filter(item => item.data_type === 'order').length}
            </div>
            <p className="text-muted-foreground">Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {filteredData.filter(item => item.data_type === 'claim').length}
            </div>
            <p className="text-muted-foreground">Claims</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de dados */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Capturados da API</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-muted-foreground">Carregando dados...</div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-muted-foreground">
                Nenhum dado encontrado. Execute uma sincronização primeiro.
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.id}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(item.data_type)}>
                        {item.data_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{item.order_id}</TableCell>
                    <TableCell className="font-mono">{item.claim_id || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedJson(item.raw_json)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver JSON
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                          <DialogHeader>
                            <DialogTitle>
                              Dados Raw - {item.data_type.toUpperCase()} {item.order_id}
                              {item.claim_id && ` / Claim ${item.claim_id}`}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="overflow-auto max-h-[60vh]">
                            <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                              {formatJson(selectedJson)}
                            </pre>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}