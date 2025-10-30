import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowDown, 
  ArrowUp, 
  Clock, 
  Search,
  User,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MovimentacaoObservacoesModal } from "./MovimentacaoObservacoesModal";

type MovimentacaoRow = {
  id: string;
  organization_id: string;
  produto_id: string | null;
  sku_produto: string;
  nome_produto: string;
  tipo_movimentacao: string;
  quantidade: number;
  quantidade_anterior: number;
  quantidade_nova: number;
  origem_movimentacao: string;
  pagina_origem: string | null;
  referencia_id: string | null;
  referencia_tipo: string | null;
  usuario_id: string | null;
  usuario_nome: string | null;
  usuario_email: string | null;
  observacoes: string | null;
  metadados: Record<string, any> | null;
  created_at: string;
};

export function MovimentacoesHistorico() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("all");
  const [origemFiltro, setOrigemFiltro] = useState("all");
  const [observacoesModalOpen, setObservacoesModalOpen] = useState(false);
  const [selectedMovimentacao, setSelectedMovimentacao] = useState<MovimentacaoRow | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        let query = supabase
          .from('movimentacoes_estoque')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (tipoFiltro !== "all") {
          query = query.eq('tipo_movimentacao', tipoFiltro);
        }

        if (origemFiltro !== "all") {
          query = query.eq('origem_movimentacao', origemFiltro);
        }

        if (searchTerm) {
          query = query.or(`sku_produto.ilike.%${searchTerm}%,nome_produto.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Erro ao carregar movimentações:', error);
          setMovimentacoes([]);
        } else if (data) {
          setMovimentacoes(data as unknown as MovimentacaoRow[]);
        } else {
          setMovimentacoes([]);
        }
      } catch (error) {
        console.error('Erro ao carregar movimentações:', error);
        setMovimentacoes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tipoFiltro, origemFiltro, searchTerm]);

  const handleOpenObservacoes = (movimentacao: MovimentacaoRow) => {
    setSelectedMovimentacao(movimentacao);
    setObservacoesModalOpen(true);
  };

  const handleSaveObservacoes = async () => {
    // Recarregar dados após salvar
    const { data } = await supabase
      .from('movimentacoes_estoque')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (data) {
      setMovimentacoes(data as unknown as MovimentacaoRow[]);
    }
  };

  const getOrigemLabel = (origem: string): string => {
    const labels: Record<string, string> = {
      'venda': 'Venda',
      'compra': 'Compra',
      'ajuste_manual': 'Ajuste Manual',
      'devolucao': 'Devolução',
      'composicao': 'Composição',
      'importacao': 'Importação',
      'inventario': 'Inventário',
      'transferencia': 'Transferência',
      'producao': 'Produção',
      'perda': 'Perda',
    };
    return labels[origem] || origem;
  };

  const getPaginaLabel = (pagina: string | null): string => {
    if (!pagina) return '-';
    const labels: Record<string, string> = {
      '/estoque': 'Estoque',
      '/pedidos': 'Pedidos',
      '/compras': 'Compras',
      '/producao': 'Produção',
      '/devolucoes': 'Devoluções',
    };
    return labels[pagina] || pagina;
  };

  const uniqueOrigens = Array.from(new Set(movimentacoes.map(m => m.origem_movimentacao)));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Histórico de Movimentações
            </CardTitle>
            <CardDescription>
              Registro completo de todas as movimentações de estoque
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por SKU ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de movimentação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={origemFiltro} onValueChange={setOrigemFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as origens</SelectItem>
              {uniqueOrigens.map(origem => (
                <SelectItem key={origem} value={origem}>
                  {getOrigemLabel(origem)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd Anterior</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Qtd Nova</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Página</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead className="text-center">Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : movimentacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    Nenhuma movimentação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                movimentacoes.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(mov.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={mov.tipo_movimentacao === 'entrada' ? 'default' : 'destructive'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {mov.tipo_movimentacao === 'entrada' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                        {mov.tipo_movimentacao === 'entrada' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{mov.sku_produto}</TableCell>
                    <TableCell className="max-w-xs truncate">{mov.nome_produto}</TableCell>
                    <TableCell className="text-right">{mov.quantidade_anterior}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {mov.tipo_movimentacao === 'entrada' ? '+' : '-'}{mov.quantidade}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{mov.quantidade_nova}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getOrigemLabel(mov.origem_movimentacao)}</Badge>
                    </TableCell>
                    <TableCell>{getPaginaLabel(mov.pagina_origem)}</TableCell>
                    <TableCell>
                      {mov.usuario_nome ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{mov.usuario_nome}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sistema</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant={mov.observacoes?.trim() ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleOpenObservacoes(mov)}
                        className="h-8 w-8 p-0"
                        title={mov.observacoes?.trim() ? 'Ver/Editar observações' : 'Adicionar observações'}
                      >
                        <FileText className={`h-4 w-4 ${mov.observacoes?.trim() ? '' : 'text-muted-foreground'}`} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {movimentacoes.length > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            Mostrando {movimentacoes.length} movimentações mais recentes
          </div>
        )}
      </CardContent>

      {/* Modal de Observações */}
      {selectedMovimentacao && (
        <MovimentacaoObservacoesModal
          open={observacoesModalOpen}
          onOpenChange={setObservacoesModalOpen}
          movimentacaoId={selectedMovimentacao.id}
          skuProduto={selectedMovimentacao.sku_produto}
          nomeProduto={selectedMovimentacao.nome_produto}
          observacaoAtual={selectedMovimentacao.observacoes || ''}
          onSave={handleSaveObservacoes}
        />
      )}
    </Card>
  );
}
