import { useState, useCallback, useEffect } from "react";
import { Package, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, RefreshCw, Trash2, CheckSquare, Square } from "lucide-react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileAppShell } from "@/components/mobile/standard/MobileAppShell";
import { Checkbox } from "@/components/ui/checkbox";
import { StickyActionBar } from "@/components/mobile/standard/StickyActionBar";
import { cn } from "@/lib/utils";

interface ImportResult {
  total: number;
  novos: number;
  duplicados: number;
  erros: number;
  detalhesErros: Array<{ linha: number; erro: string }>;
}

interface PedidoShopee {
  id: string;
  order_id: string;
  order_status: string | null;
  data_pedido: string | null;
  data_envio: string | null;
  data_entrega: string | null;
  comprador_nome: string | null;
  comprador_telefone: string | null;
  endereco_rua: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  endereco_cep: string | null;
  sku: string | null;
  produto_nome: string | null;
  quantidade: number;
  preco_unitario: number | null;
  preco_total: number | null;
  frete: number | null;
  desconto: number | null;
  baixa_estoque_realizada: boolean;
  data_baixa_estoque: string | null;
  created_at: string;
  updated_at: string;
  dados_originais: Record<string, unknown> | null;
}

export default function PedidosShopee() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pedidos, setPedidos] = useState<PedidoShopee[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [activeTab, setActiveTab] = useState("importar");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();
  const { profile } = useCurrentProfile();
  const organizationId = profile?.organizacao_id;

  // Carregar pedidos (definido antes de ser usado)
  const loadPedidos = useCallback(async () => {
    if (!organizationId) return;

    setLoadingPedidos(true);
    try {
      const { data, error } = await supabase
        .from("pedidos_shopee")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setPedidos((data as PedidoShopee[]) || []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos.",
        variant: "destructive",
      });
    } finally {
      setLoadingPedidos(false);
    }
  }, [organizationId, toast]);

  // Seleção
  const toggleSelectMode = useCallback(() => {
    setIsSelectMode(prev => !prev);
    if (isSelectMode) {
      setSelectedIds(new Set());
    }
  }, [isSelectMode]);

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(pedidos.map(p => p.id)));
  }, [pedidos]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Excluir selecionados
  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("pedidos_shopee")
        .delete()
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Pedidos excluídos",
        description: `${selectedIds.size} pedido(s) excluído(s) com sucesso.`,
      });

      setSelectedIds(new Set());
      setIsSelectMode(false);
      loadPedidos();
    } catch (error) {
      console.error("Erro ao excluir pedidos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir os pedidos.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, toast, loadPedidos]);


  useEffect(() => {
    if (activeTab === "pedidos" && organizationId) {
      loadPedidos();
    }
  }, [activeTab, organizationId, loadPedidos]);

  const parseShopeeDate = (value: unknown): string | null => {
    if (!value) return null;
    try {
      if (typeof value === "number") {
        const date = new Date((value - 25569) * 86400 * 1000);
        return date.toISOString();
      }
      const date = new Date(String(value));
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  };

  const parseNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;
    const num = Number(String(value).replace(/[^\d.,\-]/g, "").replace(",", "."));
    return isNaN(num) ? null : num;
  };

  const processarPlanilha = async (file: File) => {
    if (!organizationId) {
      toast({
        title: "Erro",
        description: "Organização não encontrada. Por favor, recarregue a página.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

      if (rows.length < 2) {
        throw new Error("Planilha vazia ou sem dados.");
      }

      const headers = (rows[0] as unknown[]).map(h => String(h || ""));
      const dataRows = rows.slice(1) as unknown[][];

      // Mapear colunas - De/Para planilha Shopee
      const colMap = {
        // Obrigatórios
        order_id: headers.findIndex(h => /^id\s*do\s*pedido$|order.*id|número.*pedido|order_sn/i.test(h)),
        order_status: headers.findIndex(h => /^status\s*do\s*pedido$|^situa[çc][aã]o\s*do\s*pedido$|status|situação|estado/i.test(h)),
        data_pedido: headers.findIndex(h => /^data\s*de\s*cria[çc][aã]o\s*do\s*pedido$|data.*pedido|data.*compra|created|criado/i.test(h)),
        comprador_nome: headers.findIndex(h => /^nome\s*de\s*usu[aá]rio.*comprador.*$|comprador|cliente|buyer|nome.*usuario/i.test(h)),
        sku: headers.findIndex(h => /^n[uú]mero\s*de\s*refer[eê]ncia\s*sku$|^sku$|código.*produto|product.*id/i.test(h)),
        produto_nome: headers.findIndex(h => /^nome\s*do\s*produto$|produto|item|product.*name|titulo.*produto/i.test(h)),
        quantidade: headers.findIndex(h => /^quantidade$|qty|qtd|quantity/i.test(h)),
        preco_total: headers.findIndex(h => /^subtotal\s*do\s*produto$|total|valor|price|preço/i.test(h)),
        // Endereço
        endereco_rua: headers.findIndex(h => /^endere[çc]o\s*de\s*entrega$|^rua$|endereco|address|logradouro/i.test(h)),
        endereco_bairro: headers.findIndex(h => /^bairro$/i.test(h)),
        endereco_cidade: headers.findIndex(h => /^cidade$/i.test(h)),
        endereco_estado: headers.findIndex(h => /^uf$/i.test(h)),
        endereco_cep: headers.findIndex(h => /^cep$/i.test(h)),
        // Rastreamento e logística
        codigo_rastreamento: headers.findIndex(h => /^n[uú]mero\s*de\s*rastreamento$|rastreamento|tracking|rastreio/i.test(h)),
        opcao_envio: headers.findIndex(h => /^op[çc][aã]o\s*de\s*envio$|tipo.*log[ií]stico|logistic|envio/i.test(h)),
        // Custos e taxas
        valor_estimado_frete: headers.findIndex(h => /^valor\s*estimado\s*do\s*frete$|receita.*flex|frete.*estimado/i.test(h)),
        custo_envio: headers.findIndex(h => /^taxa\s*de\s*envio\s*reversa$|custo.*envio|shipping.*cost/i.test(h)),
        custo_fixo: headers.findIndex(h => /^taxa\s*de\s*servi[çc]o$|custo.*fixo|service.*fee/i.test(h)),
        taxa_marketplace: headers.findIndex(h => /^taxa\s*de\s*comiss[aã]o$|taxa.*marketplace|comiss[aã]o|commission/i.test(h)),
        // Cancelamento
        motivo_cancelamento: headers.findIndex(h => /^cancelar\s*motivo$|motivo.*cancel|cancel.*reason/i.test(h)),
      };

      // Criar registro de importação
      const { data: importacao, error: impError } = await supabase
        .from("importacoes_shopee")
        .insert({
          organization_id: organizationId,
          nome_arquivo: file.name,
          total_linhas: dataRows.length,
          status: "processando",
        })
        .select()
        .single();

      if (impError) throw impError;

      let novos = 0;
      let duplicados = 0;
      let erros = 0;
      const detalhesErros: Array<{ linha: number; erro: string }> = [];

      // 1) Monta payload (memória) – aqui é onde acontece o "de/para" (apenas leitura dos headers)
      const pedidosPayload = dataRows.map((row, i) => {
        const linhaNum = i + 2;
        const orderId = String(row[colMap.order_id] || "").trim();
        const sku = colMap.sku >= 0 ? String(row[colMap.sku] || "").trim() || null : null;
        const quantidade = colMap.quantidade >= 0 ? Number(row[colMap.quantidade]) || 1 : 1;

        if (!orderId) {
          detalhesErros.push({ linha: linhaNum, erro: "ID do pedido não encontrado" });
          erros++;
          return null;
        }

        return {
          organization_id: organizationId,
          order_id: orderId,
          order_status: colMap.order_status >= 0 ? String(row[colMap.order_status] || "") : null,
          data_pedido: colMap.data_pedido >= 0 ? parseShopeeDate(row[colMap.data_pedido]) : null,
          comprador_nome: colMap.comprador_nome >= 0 ? String(row[colMap.comprador_nome] || "") : null,
          sku,
          produto_nome: colMap.produto_nome >= 0 ? String(row[colMap.produto_nome] || "") : null,
          quantidade,
          preco_total: colMap.preco_total >= 0 ? parseNumber(row[colMap.preco_total]) : null,
          // Endereço
          endereco_rua: colMap.endereco_rua >= 0 ? String(row[colMap.endereco_rua] || "") : null,
          endereco_bairro: colMap.endereco_bairro >= 0 ? String(row[colMap.endereco_bairro] || "") : null,
          endereco_cidade: colMap.endereco_cidade >= 0 ? String(row[colMap.endereco_cidade] || "") : null,
          endereco_estado: colMap.endereco_estado >= 0 ? String(row[colMap.endereco_estado] || "") : null,
          endereco_cep: colMap.endereco_cep >= 0 ? String(row[colMap.endereco_cep] || "") : null,
          // Rastreamento e logística
          codigo_rastreamento: colMap.codigo_rastreamento >= 0 ? String(row[colMap.codigo_rastreamento] || "") : null,
          tipo_logistico: colMap.opcao_envio >= 0 ? String(row[colMap.opcao_envio] || "") : null,
          // Custos e taxas - receita_flex só preenche se "Opção de envio" for "Shopee Entrega Direta", caso contrário 0
          frete: (() => {
            const opcaoEnvio = colMap.opcao_envio >= 0 ? String(row[colMap.opcao_envio] || "") : "";
            const valorFrete = colMap.valor_estimado_frete >= 0 ? parseNumber(row[colMap.valor_estimado_frete]) : 0;
            console.log(`[DEBUG] Opção envio: "${opcaoEnvio}", Valor frete: ${valorFrete}, colMap.valor_estimado_frete: ${colMap.valor_estimado_frete}`);
            if (opcaoEnvio.toLowerCase().includes("shopee entrega direta")) {
              return valorFrete;
            }
            return 0;
          })(),
          custo_envio: colMap.custo_envio >= 0 ? parseNumber(row[colMap.custo_envio]) : null,
          custo_fixo: colMap.custo_fixo >= 0 ? parseNumber(row[colMap.custo_fixo]) : null,
          taxa_marketplace: colMap.taxa_marketplace >= 0 ? parseNumber(row[colMap.taxa_marketplace]) : null,
          // Cancelamento
          motivo_cancelamento: colMap.motivo_cancelamento >= 0 ? String(row[colMap.motivo_cancelamento] || "") : null,
          // Metadados
          importacao_id: importacao.id,
          baixa_estoque_realizada: false,
          dados_originais: JSON.parse(
            JSON.stringify(Object.fromEntries(headers.map((h, idx) => [h, (row as unknown[])[idx]])))
          ),
        } as const;
      });

      const pedidosValidos = pedidosPayload.filter(Boolean) as Array<NonNullable<(typeof pedidosPayload)[number]>>;

      // 2) Upsert em lotes (reduz de milhares de requests para poucos requests)
      const CHUNK_SIZE = 250;
      const chunks: typeof pedidosValidos[] = [];
      for (let i = 0; i < pedidosValidos.length; i += CHUNK_SIZE) {
        chunks.push(pedidosValidos.slice(i, i + CHUNK_SIZE));
      }

      for (let c = 0; c < chunks.length; c++) {
        const chunk = chunks[c];

        const { error: upsertError } = await supabase
          .from("pedidos_shopee")
          .upsert(chunk, {
            onConflict: "organization_id,order_id,sku",
            ignoreDuplicates: true,
          });

        if (upsertError) {
          detalhesErros.push({ linha: 0, erro: `Erro no lote ${c + 1}: ${upsertError.message}` });
          erros += chunk.length;
        } else {
          novos += chunk.length;
        }

        setProgress(Math.round(((c + 1) / chunks.length) * 100));
      }

      // Atualizar registro de importação
      await supabase
        .from("importacoes_shopee")
        .update({
          status: erros > 0 ? "concluido_com_erros" : "concluido",
          linhas_processadas: dataRows.length,
          linhas_erro: erros,
          pedidos_novos: novos,
          pedidos_duplicados: duplicados,
          detalhes_erros: detalhesErros.length > 0 ? detalhesErros : null,
        })
        .eq("id", importacao.id);

      setResult({
        total: dataRows.length,
        novos,
        duplicados,
        erros,
        detalhesErros,
      });

      toast({
        title: "Importação concluída",
        description: `${novos} pedidos importados.`,
      });

      loadPedidos();
    } catch (error) {
      console.error("Erro ao processar planilha:", error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        processarPlanilha(file);
      }
    },
    [organizationId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const breadcrumb = (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Package className="h-4 w-4" />
      <span>/</span>
      <span className="text-primary">Pedidos Shopee</span>
    </div>
  );

  return (
    <MobileAppShell title="Pedidos Shopee" breadcrumb={breadcrumb}>
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="importar">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="pedidos">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Pedidos ({pedidos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="importar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Importar Planilha Shopee
                </CardTitle>
                <CardDescription>
                  Arraste um arquivo Excel/CSV exportado da Shopee. Os pedidos serão importados (baixa de estoque pode ser feita manualmente depois).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                    isProcessing && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input {...getInputProps()} />
                  {isProcessing ? (
                    <div className="space-y-4">
                      <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Processando planilha...</p>
                      <Progress value={progress} className="w-full max-w-xs mx-auto" />
                      <p className="text-xs text-muted-foreground">{progress}% concluído</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm font-medium">
                        {isDragActive ? "Solte o arquivo aqui..." : "Arraste um arquivo ou clique para selecionar"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Suporta .xlsx, .xls e .csv</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.erros > 0 ? (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    Resultado da Importação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{result.total}</p>
                      <p className="text-xs text-muted-foreground">Total de linhas</p>
                    </div>
                    <div className="text-center p-3 bg-green-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{result.novos}</p>
                      <p className="text-xs text-muted-foreground">Novos pedidos</p>
                    </div>
                    <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-amber-600">{result.duplicados}</p>
                      <p className="text-xs text-muted-foreground">Duplicados</p>
                    </div>
                    <div className="text-center p-3 bg-red-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{result.erros}</p>
                      <p className="text-xs text-muted-foreground">Erros</p>
                    </div>
                  </div>

                  {result.detalhesErros.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Detalhes dos erros:</p>
                      <div className="max-h-40 overflow-y-auto bg-muted/50 rounded p-2 text-xs">
                        {result.detalhesErros.slice(0, 10).map((err, idx) => (
                          <p key={idx} className="text-red-600">
                            Linha {err.linha}: {err.erro}
                          </p>
                        ))}
                        {result.detalhesErros.length > 10 && (
                          <p className="text-muted-foreground mt-2">
                            ... e mais {result.detalhesErros.length - 10} erros
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pedidos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Pedidos Importados</CardTitle>
                  <CardDescription>Últimos 200 pedidos importados da Shopee</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isSelectMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleSelectMode}
                  >
                    {isSelectMode ? (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Sair da Seleção
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Selecionar
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadPedidos} disabled={loadingPedidos}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", loadingPedidos && "animate-spin")} />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPedidos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : pedidos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum pedido importado ainda</p>
                    <p className="text-sm">Importe uma planilha para começar</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="whitespace-nowrap">
                          {isSelectMode && (
                            <TableHead className="w-10">
                              <Checkbox
                                checked={selectedIds.size === pedidos.length && pedidos.length > 0}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    selectAll();
                                  } else {
                                    clearSelection();
                                  }
                                }}
                              />
                            </TableHead>
                          )}
                          <TableHead>ID-Único</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Número do Pedido</TableHead>
                          <TableHead>Nome Completo</TableHead>
                          <TableHead>Data do Pedido</TableHead>
                          <TableHead>Atualizado</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Título do Produto</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                          <TableHead className="text-right">Receita Flex</TableHead>
                          <TableHead className="text-right">Taxa Marketplace</TableHead>
                          <TableHead className="text-right">Custo Envio</TableHead>
                          <TableHead className="text-right">Custo Fixo Meli</TableHead>
                          <TableHead className="text-right">Valor Líquido</TableHead>
                          <TableHead>Método Pagamento</TableHead>
                          <TableHead>Status Pagamento</TableHead>
                          <TableHead>CPF/CNPJ</TableHead>
                          <TableHead>SKU Estoque</TableHead>
                          <TableHead>SKU KIT</TableHead>
                          <TableHead>Quantidade KIT</TableHead>
                          <TableHead>Total de Itens</TableHead>
                          <TableHead>Status da Baixa</TableHead>
                          <TableHead>Status Insumos</TableHead>
                          <TableHead>Marketplace</TableHead>
                          <TableHead>Local de Estoque</TableHead>
                          <TableHead>Situação do Pedido</TableHead>
                          <TableHead>Status do Envio</TableHead>
                          <TableHead>Tipo Logístico</TableHead>
                          <TableHead>Medalha</TableHead>
                          <TableHead>Reputação</TableHead>
                          <TableHead>Condição</TableHead>
                          <TableHead>Substatus do Envio</TableHead>
                          <TableHead>Código Rastreamento</TableHead>
                          <TableHead>Rastreamento</TableHead>
                          <TableHead>Rua</TableHead>
                          <TableHead>Número</TableHead>
                          <TableHead>Bairro</TableHead>
                          <TableHead>CEP</TableHead>
                          <TableHead>Cidade</TableHead>
                          <TableHead>UF</TableHead>
                          <TableHead>Data Criação ML</TableHead>
                          <TableHead>Pack ID</TableHead>
                          <TableHead>Pickup ID</TableHead>
                          <TableHead>Tags do Pedido</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pedidos.map((pedido) => {
                          const valorLiquido = (pedido.preco_total ?? 0) - (pedido.frete ?? 0) - (pedido.desconto ?? 0);
                          const isSelected = selectedIds.has(pedido.id);
                          return (
                            <TableRow 
                              key={pedido.id} 
                              className={cn(
                                "whitespace-nowrap",
                                isSelected && "bg-primary/5"
                              )}
                            >
                              {isSelectMode && (
                                <TableCell className="w-10">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSelectItem(pedido.id)}
                                  />
                                </TableCell>
                              )}
                              {/* ID-Único */}
                              <TableCell className="font-mono text-xs">{pedido.id}</TableCell>
                              {/* Empresa */}
                              <TableCell>Shopee</TableCell>
                              {/* Número do Pedido */}
                              <TableCell className="font-mono text-sm">{pedido.order_id}</TableCell>
                              {/* Nome Completo */}
                              <TableCell className="max-w-[150px] truncate">{pedido.comprador_nome ?? "-"}</TableCell>
                              {/* Data do Pedido */}
                              <TableCell className="text-sm">
                                {pedido.data_pedido
                                  ? format(new Date(pedido.data_pedido), "dd/MM/yy", { locale: ptBR })
                                  : "-"}
                              </TableCell>
                              {/* Atualizado */}
                              <TableCell className="text-sm">
                                {pedido.updated_at
                                  ? format(new Date(pedido.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })
                                  : "-"}
                              </TableCell>
                              {/* SKU */}
                              <TableCell className="font-mono text-xs">{pedido.sku ?? "-"}</TableCell>
                              {/* Quantidade */}
                              <TableCell className="text-center">{pedido.quantidade}</TableCell>
                              {/* Título do Produto */}
                              <TableCell className="max-w-[200px] truncate text-sm">{pedido.produto_nome ?? "-"}</TableCell>
                              {/* Valor Total */}
                              <TableCell className="text-right">
                                {pedido.preco_total != null ? `R$ ${pedido.preco_total.toFixed(2)}` : "-"}
                              </TableCell>
                              {/* Receita Flex */}
                              <TableCell className="text-right text-muted-foreground">-</TableCell>
                              {/* Taxa Marketplace */}
                              <TableCell className="text-right text-muted-foreground">-</TableCell>
                              {/* Custo Envio */}
                              <TableCell className="text-right">
                                {pedido.frete != null ? `R$ ${pedido.frete.toFixed(2)}` : "-"}
                              </TableCell>
                              {/* Custo Fixo Meli */}
                              <TableCell className="text-right text-muted-foreground">-</TableCell>
                              {/* Valor Líquido */}
                              <TableCell className="text-right font-medium">
                                {pedido.preco_total != null ? `R$ ${valorLiquido.toFixed(2)}` : "-"}
                              </TableCell>
                              {/* Método Pagamento */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Status Pagamento */}
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {pedido.order_status ?? "N/A"}
                                </Badge>
                              </TableCell>
                              {/* CPF/CNPJ */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* SKU Estoque */}
                              <TableCell className="font-mono text-xs">{pedido.sku ?? "-"}</TableCell>
                              {/* SKU KIT */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Quantidade KIT */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Total de Itens */}
                              <TableCell className="text-center">{pedido.quantidade}</TableCell>
                              {/* Status da Baixa */}
                              <TableCell className="text-center">
                                {pedido.baixa_estoque_realizada ? (
                                  <Badge variant="default" className="bg-green-600 text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Baixado
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Pendente</Badge>
                                )}
                              </TableCell>
                              {/* Status Insumos */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Marketplace */}
                              <TableCell>
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-xs">
                                  Shopee
                                </Badge>
                              </TableCell>
                              {/* Local de Estoque */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Situação do Pedido */}
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {pedido.order_status ?? "N/A"}
                                </Badge>
                              </TableCell>
                              {/* Status do Envio */}
                              <TableCell>
                                {pedido.data_envio ? (
                                  <Badge variant="default" className="text-xs">Enviado</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Pendente</Badge>
                                )}
                              </TableCell>
                              {/* Tipo Logístico */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Medalha */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Reputação */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Condição */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Substatus do Envio */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Código Rastreamento */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Rastreamento */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Rua */}
                              <TableCell className="max-w-[150px] truncate">{pedido.endereco_rua ?? "-"}</TableCell>
                              {/* Número */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Bairro */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* CEP */}
                              <TableCell>{pedido.endereco_cep ?? "-"}</TableCell>
                              {/* Cidade */}
                              <TableCell>{pedido.endereco_cidade ?? "-"}</TableCell>
                              {/* UF */}
                              <TableCell>{pedido.endereco_estado ?? "-"}</TableCell>
                              {/* Data Criação ML */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Pack ID */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Pickup ID */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                              {/* Tags do Pedido */}
                              <TableCell className="text-muted-foreground">-</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Barra de ações para selecionados */}
      <StickyActionBar
        selectedCount={selectedIds.size}
        totalCount={pedidos.length}
        onClearSelection={clearSelection}
        actions={[
          {
            label: "Excluir Selecionados",
            onClick: deleteSelected,
            variant: "destructive",
            icon: <Trash2 className="h-4 w-4" />,
            loading: isDeleting,
            disabled: isDeleting,
          },
        ]}
      />
    </MobileAppShell>
  );
}
