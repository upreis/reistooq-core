import { useState, useCallback, useEffect } from "react";
import { Package, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface ImportResult {
  total: number;
  novos: number;
  duplicados: number;
  erros: number;
  baixasRealizadas: number;
  detalhesErros: Array<{ linha: number; erro: string }>;
}

interface PedidoShopee {
  id: string;
  order_id: string;
  order_status: string | null;
  data_pedido: string | null;
  comprador_nome: string | null;
  sku: string | null;
  produto_nome: string | null;
  quantidade: number;
  preco_total: number | null;
  baixa_estoque_realizada: boolean;
  created_at: string;
}

export default function PedidosShopee() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pedidos, setPedidos] = useState<PedidoShopee[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [activeTab, setActiveTab] = useState("importar");

  const { toast } = useToast();
  const { profile } = useCurrentProfile();
  const organizationId = profile?.organizacao_id;

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

  useEffect(() => {
    if (activeTab === "pedidos" && organizationId) {
      loadPedidos();
    }
  }, [activeTab, organizationId, loadPedidos]);

  const processarBaixaEstoque = async (sku: string, quantidade: number): Promise<boolean> => {
    if (!sku || !organizationId) return false;

    try {
      // Buscar produto pelo SKU
      const { data: produto, error: prodError } = await supabase
        .from("produtos")
        .select("id, quantidade_atual, nome")
        .eq("sku_interno", sku)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (prodError || !produto) {
        console.warn(`Produto não encontrado para SKU: ${sku}`);
        return false;
      }

      // Atualizar quantidade do produto
      const novaQuantidade = Math.max(0, (produto.quantidade_atual || 0) - quantidade);
      
      const { error: updateError } = await supabase
        .from("produtos")
        .update({ quantidade_atual: novaQuantidade })
        .eq("id", produto.id);

      if (updateError) {
        console.error(`Erro ao atualizar estoque do produto ${sku}:`, updateError);
        return false;
      }

      // Registrar movimentação usando RPC ou diretamente
      console.log(`Baixa realizada: SKU ${sku}, Qtd ${quantidade}`);

      return true;
    } catch (error) {
      console.error(`Erro ao processar baixa do SKU ${sku}:`, error);
      return false;
    }
  };

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

      // Mapear colunas
      const colMap = {
        order_id: headers.findIndex(h => /order.*id|número.*pedido|pedido|order_sn/i.test(h)),
        order_status: headers.findIndex(h => /status|situação|estado/i.test(h)),
        data_pedido: headers.findIndex(h => /data.*pedido|data.*compra|created|criado/i.test(h)),
        comprador_nome: headers.findIndex(h => /comprador|cliente|buyer|nome/i.test(h)),
        sku: headers.findIndex(h => /sku|código.*produto|product.*id/i.test(h)),
        produto_nome: headers.findIndex(h => /produto|item|product.*name|nome.*produto/i.test(h)),
        quantidade: headers.findIndex(h => /quantidade|qty|qtd|quantity/i.test(h)),
        preco_total: headers.findIndex(h => /total|valor|price|preço/i.test(h)),
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
      let baixasRealizadas = 0;
      const detalhesErros: Array<{ linha: number; erro: string }> = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const linhaNum = i + 2;

        try {
          const orderId = String(row[colMap.order_id] || "").trim();
          if (!orderId) {
            detalhesErros.push({ linha: linhaNum, erro: "ID do pedido não encontrado" });
            erros++;
            continue;
          }

          const sku = colMap.sku >= 0 ? String(row[colMap.sku] || "").trim() || null : null;
          const quantidade = colMap.quantidade >= 0 ? Number(row[colMap.quantidade]) || 1 : 1;

          const { error: insertError } = await supabase
            .from("pedidos_shopee")
            .insert([{
              organization_id: organizationId,
              order_id: orderId,
              order_status: colMap.order_status >= 0 ? String(row[colMap.order_status] || "") : null,
              data_pedido: colMap.data_pedido >= 0 ? parseShopeeDate(row[colMap.data_pedido]) : null,
              comprador_nome: colMap.comprador_nome >= 0 ? String(row[colMap.comprador_nome] || "") : null,
              sku: sku,
              produto_nome: colMap.produto_nome >= 0 ? String(row[colMap.produto_nome] || "") : null,
              quantidade: quantidade,
              preco_total: colMap.preco_total >= 0 ? parseNumber(row[colMap.preco_total]) : null,
              importacao_id: importacao.id,
              baixa_estoque_realizada: false,
              dados_originais: JSON.parse(JSON.stringify(Object.fromEntries(headers.map((h, idx) => [h, row[idx]])))),
            }]);

          if (insertError) {
            if (insertError.code === "23505") {
              duplicados++;
            } else {
              detalhesErros.push({ linha: linhaNum, erro: insertError.message });
              erros++;
            }
            continue;
          }

          novos++;

          // Dar baixa automática no estoque
          if (sku) {
            const baixaOk = await processarBaixaEstoque(sku, quantidade);
            if (baixaOk) {
              baixasRealizadas++;
              await supabase
                .from("pedidos_shopee")
                .update({
                  baixa_estoque_realizada: true,
                  data_baixa_estoque: new Date().toISOString(),
                })
                .eq("organization_id", organizationId)
                .eq("order_id", orderId)
                .eq("sku", sku);
            }
          }
        } catch (rowError) {
          detalhesErros.push({ linha: linhaNum, erro: String(rowError) });
          erros++;
        }

        setProgress(Math.round(((i + 1) / dataRows.length) * 100));
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
          baixas_realizadas: baixasRealizadas,
          detalhes_erros: detalhesErros.length > 0 ? detalhesErros : null,
        })
        .eq("id", importacao.id);

      setResult({
        total: dataRows.length,
        novos,
        duplicados,
        erros,
        baixasRealizadas,
        detalhesErros,
      });

      toast({
        title: "Importação concluída",
        description: `${novos} pedidos importados, ${baixasRealizadas} baixas realizadas.`,
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
                  Arraste um arquivo Excel/CSV exportado da Shopee. Os pedidos serão importados e o estoque será dado baixa automaticamente.
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{result.total}</p>
                      <p className="text-xs text-muted-foreground">Total de linhas</p>
                    </div>
                    <div className="text-center p-3 bg-green-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{result.novos}</p>
                      <p className="text-xs text-muted-foreground">Novos pedidos</p>
                    </div>
                    <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{result.baixasRealizadas}</p>
                      <p className="text-xs text-muted-foreground">Baixas estoque</p>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pedidos Importados</CardTitle>
                  <CardDescription>Últimos 200 pedidos importados da Shopee</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadPedidos} disabled={loadingPedidos}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", loadingPedidos && "animate-spin")} />
                  Atualizar
                </Button>
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
                        <TableRow>
                          <TableHead>Pedido</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Comprador</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-center">Qtd</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-center">Baixa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pedidos.map((pedido) => (
                          <TableRow key={pedido.id}>
                            <TableCell className="font-mono text-sm">{pedido.order_id}</TableCell>
                            <TableCell className="text-sm">
                              {pedido.data_pedido
                                ? format(new Date(pedido.data_pedido), "dd/MM/yy", { locale: ptBR })
                                : "-"}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">{pedido.comprador_nome || "-"}</TableCell>
                            <TableCell className="font-mono text-xs">{pedido.sku || "-"}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm">{pedido.produto_nome || "-"}</TableCell>
                            <TableCell className="text-center">{pedido.quantidade}</TableCell>
                            <TableCell className="text-right">
                              {pedido.preco_total ? `R$ ${pedido.preco_total.toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {pedido.baixa_estoque_realizada ? (
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Sim
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Não</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileAppShell>
  );
}
