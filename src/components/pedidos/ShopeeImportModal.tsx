/**
 * 🛍️ Modal de Importação Shopee Excel
 * Componente reutilizável para importar planilhas Shopee
 * Extraído de PedidosShopee.tsx para uso na página /pedidos
 */

import { useState, useCallback, useEffect } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ImportResult {
  total: number;
  novos: number;
  atualizados: number;
  erros: number;
  detalhesErros: Array<{ linha: number; erro: string }>;
}

interface EmpresaShopee {
  id: string;
  nome: string;
  nickname?: string;
}

interface ShopeeImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export function ShopeeImportModal({ open, onOpenChange, onImportComplete }: ShopeeImportModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [empresasShopee, setEmpresasShopee] = useState<EmpresaShopee[]>([]);
  const [empresaSelecionadaUpload, setEmpresaSelecionadaUpload] = useState<string>("");
  const [showEmpresasModal, setShowEmpresasModal] = useState(false);
  const [novaEmpresa, setNovaEmpresa] = useState({ nome: "", nickname: "" });
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  const { toast } = useToast();
  const { profile } = useCurrentProfile();
  const organizationId = profile?.organizacao_id;

  // Carregar empresas Shopee
  const loadEmpresasShopee = useCallback(async () => {
    if (!organizationId) return;
    setLoadingEmpresas(true);
    try {
      const { data, error } = await supabase
        .from("empresas_shopee")
        .select("id, nome, nickname")
        .eq("organization_id", organizationId)
        .order("nome");

      if (error) throw error;
      setEmpresasShopee(data || []);
    } catch (error) {
      console.error("Erro ao carregar empresas Shopee:", error);
    } finally {
      setLoadingEmpresas(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (open && organizationId) {
      loadEmpresasShopee();
    }
  }, [open, organizationId, loadEmpresasShopee]);

  // Funções auxiliares de parsing
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

  // Processar planilha
  const processarPlanilha = async (file: File) => {
    if (!organizationId) {
      toast({
        title: "Erro",
        description: "Organização não encontrada. Por favor, recarregue a página.",
        variant: "destructive",
      });
      return;
    }

    if (!empresaSelecionadaUpload) {
      toast({
        title: "Empresa obrigatória",
        description: "Selecione uma empresa antes de importar o arquivo.",
        variant: "destructive",
      });
      return;
    }

    const empresaNome = empresasShopee.find(e => e.id === empresaSelecionadaUpload)?.nome || "";

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

      // Função para encontrar coluna com dados
      const findColumnWithData = (regex: RegExp): number => {
        const matchingIndices: number[] = [];
        headers.forEach((h, idx) => {
          if (regex.test(h)) matchingIndices.push(idx);
        });
        
        if (matchingIndices.length <= 1) {
          return matchingIndices[0] ?? -1;
        }
        
        const dataSample = rows.slice(1, Math.min(11, rows.length)) as unknown[][];
        let bestIdx = matchingIndices[0];
        let bestCount = 0;
        
        for (const idx of matchingIndices) {
          const filledCount = dataSample.filter(row => {
            const val = String(row[idx] || "").trim();
            return val !== "" && val !== "null" && val !== "undefined";
          }).length;
          if (filledCount > bestCount) {
            bestCount = filledCount;
            bestIdx = idx;
          }
        }
        return bestIdx;
      };

      // Mapeamento de colunas
      // ⚠️ Importante: headers da Shopee variam bastante entre exportações/idiomas.
      // Usamos findColumnWithData para escolher a coluna "correta" quando há duplicatas.
      const colMap = {
        order_id: headers.findIndex(h => /^id\s*do\s*pedido$|order.*id|n[uú]mero.*pedido|order_sn/i.test(h)),
        order_status: headers.findIndex(h => /^status\s*do\s*pedido$|^situa[çc][aã]o\s*do\s*pedido$|status|situa[çc][aã]o|estado/i.test(h)),
        data_pedido: headers.findIndex(h => /^data\s*de\s*cria[çc][aã]o\s*do\s*pedido$|data.*pedido|data.*compra|created|criado/i.test(h)),
        comprador_nome: headers.findIndex(h => /^nome\s*de\s*usu[aá]rio\s*\(comprador\)$|^nome\s*do\s*destinat[aá]rio$|^nome\s*completo$|buyer.*name/i.test(h)),

        // Produtos
        sku: findColumnWithData(/sku|refer[êe]ncia\s*sku|n[uú]mero\s*de\s*refer[êe]ncia\s*sku|c[oó]digo.*produto|product.*id/i),
        produto_nome: findColumnWithData(/nome\s*do\s*produto|t[ií]tulo\s*do\s*produto|t[ií]tulo\s*do\s*item|produto|item|product.*name|item.*name|descri[cç][aã]o.*produto/i),
        quantidade: headers.findIndex(h => /^quantidade$|qty|qtd|quantity/i.test(h)),
        preco_total: findColumnWithData(/subtotal\s*do\s*produto|total|valor|price|pre[çc]o|amount|total_amount/i),

        // Endereço
        endereco_rua: headers.findIndex(h => /^endere[çc]o\s*de\s*entrega$|^rua$|endereco|address|logradouro/i.test(h)),
        endereco_bairro: findColumnWithData(/^bairro$/i),
        endereco_cidade: findColumnWithData(/^cidade$/i),
        endereco_estado: findColumnWithData(/^uf$|estado/i),
        endereco_cep: findColumnWithData(/^cep$|zip/i),

        // Rastreamento e logística
        codigo_rastreamento: findColumnWithData(/n[uú]mero\s*de\s*rastreamento|rastreamento|tracking|rastreio/i),
        opcao_envio: findColumnWithData(/op[çc][aã]o\s*de\s*envio|tipo.*log[ií]stico|logistic|envio/i),

        // Custos e taxas
        valor_estimado_frete: findColumnWithData(/valor\s*estimado\s*do\s*frete|receita.*flex|frete.*estimado|shipping.*fee/i),
        custo_envio: findColumnWithData(/taxa\s*de\s*envio\s*reversa|custo\s*envio/i),
        custo_fixo: findColumnWithData(/taxa\s*de\s*servi[çc]o|custo.*fixo|service.*fee/i),
        taxa_marketplace: findColumnWithData(/taxa.*(comiss|marketplace)|comiss[aã]o|commission|sale\s*fee|sale_fee|tarifa/i),

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
      let atualizados = 0;
      let erros = 0;
      const detalhesErros: Array<{ linha: number; erro: string }> = [];

      // Montar payload
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
          endereco_rua: colMap.endereco_rua >= 0 ? String(row[colMap.endereco_rua] || "") : null,
          endereco_bairro: colMap.endereco_bairro >= 0 ? String(row[colMap.endereco_bairro] || "") : null,
          endereco_cidade: colMap.endereco_cidade >= 0 ? String(row[colMap.endereco_cidade] || "") : null,
          endereco_estado: colMap.endereco_estado >= 0 ? String(row[colMap.endereco_estado] || "") : null,
          endereco_cep: colMap.endereco_cep >= 0 ? String(row[colMap.endereco_cep] || "") : null,
          codigo_rastreamento: colMap.codigo_rastreamento >= 0 ? String(row[colMap.codigo_rastreamento] || "") : null,
          tipo_logistico: colMap.opcao_envio >= 0 ? String(row[colMap.opcao_envio] || "") : null,
          receita_flex: (() => {
            const opcaoEnvio = colMap.opcao_envio >= 0 ? String(row[colMap.opcao_envio] || "") : "";
            const valorFrete = colMap.valor_estimado_frete >= 0 ? parseNumber(row[colMap.valor_estimado_frete]) : 0;
            if (opcaoEnvio.trim().toLowerCase() === "shopee entrega direta") {
              return valorFrete;
            }
            return 0;
          })(),
          custo_envio: colMap.custo_envio >= 0 ? parseNumber(row[colMap.custo_envio]) : null,
          custo_fixo: colMap.custo_fixo >= 0 ? parseNumber(row[colMap.custo_fixo]) : null,
          taxa_marketplace: colMap.taxa_marketplace >= 0 ? parseNumber(row[colMap.taxa_marketplace]) : null,
          motivo_cancelamento: colMap.motivo_cancelamento >= 0 ? String(row[colMap.motivo_cancelamento] || "") : null,
          empresa: empresaNome,
          importacao_id: importacao.id,
          baixa_estoque_realizada: false,
          dados_originais: JSON.parse(
            JSON.stringify(Object.fromEntries(headers.map((h, idx) => [h, (row as unknown[])[idx]])))
          ),
        } as const;
      });

      const pedidosValidos = pedidosPayload.filter(Boolean) as Array<NonNullable<(typeof pedidosPayload)[number]>>;

      // 1️⃣ Buscar pedidos existentes para comparar
      const orderIds = pedidosValidos.map(p => p.order_id);
      const { data: existingOrders } = await supabase
        .from("pedidos_shopee")
        .select("id, order_id, sku, produto_nome, taxa_marketplace, data_pedido, order_status, preco_total, codigo_rastreamento")
        .eq("organization_id", organizationId)
        .in("order_id", orderIds);

      const existingMap = new Map<string, (typeof existingOrders extends (infer T)[] | null ? T : never)>();
      (existingOrders || []).forEach(o => {
        existingMap.set(`${o.order_id}|${o.sku || ''}`, o);
      });

      // 2️⃣ Separar novos de atualizações
      const novosPayload: typeof pedidosValidos = [];
      const atualizarPayload: Array<{ id: string; data: typeof pedidosValidos[0] }> = [];

      for (const pedido of pedidosValidos) {
        const key = `${pedido.order_id}|${pedido.sku || ''}`;
        const existing = existingMap.get(key);
        
        if (existing) {
          // Verificar se houve mudança em campos importantes (incluindo SKU/Título/Taxas)
          const mudou = (
            existing.data_pedido !== pedido.data_pedido ||
            existing.order_status !== pedido.order_status ||
            existing.preco_total !== pedido.preco_total ||
            existing.codigo_rastreamento !== pedido.codigo_rastreamento ||
            existing.sku !== pedido.sku ||
            existing.produto_nome !== pedido.produto_nome ||
            existing.taxa_marketplace !== pedido.taxa_marketplace
          );

          if (mudou) {
            atualizarPayload.push({ id: existing.id, data: pedido });
          }
        } else {
          novosPayload.push(pedido);
        }
      }

      // 3️⃣ Inserir novos pedidos
      if (novosPayload.length > 0) {
        const CHUNK_SIZE = 250;
        for (let i = 0; i < novosPayload.length; i += CHUNK_SIZE) {
          const chunk = novosPayload.slice(i, i + CHUNK_SIZE);
          const { error: insertError } = await supabase
            .from("pedidos_shopee")
            .insert(chunk);

          if (insertError) {
            detalhesErros.push({ linha: 0, erro: `Erro ao inserir novos: ${insertError.message}` });
            erros += chunk.length;
          } else {
            novos += chunk.length;
          }
        }
      }

      // 4️⃣ Atualizar pedidos existentes
      for (const { id, data } of atualizarPayload) {
        const { error: updateError } = await supabase
          .from("pedidos_shopee")
          .update({
            ...data,
            foi_atualizado: true,
          })
          .eq("id", id);

        if (updateError) {
          detalhesErros.push({ linha: 0, erro: `Erro ao atualizar ${data.order_id}: ${updateError.message}` });
          erros++;
        } else {
          atualizados++;
        }
      }

      setProgress(100);

      // Atualizar registro de importação
      await supabase
        .from("importacoes_shopee")
        .update({
          status: erros > 0 ? "concluido_com_erros" : "concluido",
          linhas_processadas: dataRows.length,
          linhas_erro: erros,
          pedidos_novos: novos,
          pedidos_duplicados: atualizados,
          detalhes_erros: detalhesErros.length > 0 ? detalhesErros : null,
        })
        .eq("id", importacao.id);

      setResult({
        total: dataRows.length,
        novos,
        atualizados,
        erros,
        detalhesErros,
      });

      toast({
        title: "Importação concluída",
        description: `${novos} novos, ${atualizados} atualizados.`,
      });

      onImportComplete?.();
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
    [organizationId, empresaSelecionadaUpload, empresasShopee]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: false,
    disabled: isProcessing || !empresaSelecionadaUpload,
  });

  // Salvar nova empresa
  const salvarNovaEmpresa = async () => {
    if (!novaEmpresa.nome.trim() || !organizationId) return;

    try {
      const { error } = await supabase.from("empresas_shopee").insert({
        organization_id: organizationId,
        nome: novaEmpresa.nome.trim(),
        nickname: novaEmpresa.nickname.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Empresa criada",
        description: `Empresa "${novaEmpresa.nome}" criada com sucesso.`,
      });

      setNovaEmpresa({ nome: "", nickname: "" });
      setShowEmpresasModal(false);
      loadEmpresasShopee();
    } catch (error) {
      console.error("Erro ao criar empresa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a empresa.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-orange-500" />
              Importar Pedidos Shopee
            </DialogTitle>
            <DialogDescription>
              Importe pedidos do Shopee através de uma planilha Excel (.xlsx, .xls) ou CSV.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Seletor de Empresa */}
            <div className="space-y-2">
              <Label>Empresa Shopee</Label>
              <div className="flex gap-2">
                <Select
                  value={empresaSelecionadaUpload}
                  onValueChange={setEmpresaSelecionadaUpload}
                  disabled={isProcessing}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent 
                    className="z-[9999] bg-popover border border-border shadow-lg"
                    position="popper"
                    sideOffset={4}
                  >
                    {loadingEmpresas ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Carregando empresas...
                      </div>
                    ) : empresasShopee.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Nenhuma empresa cadastrada. Clique em "+ Nova" para criar.
                      </div>
                    ) : (
                      empresasShopee.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.nome} {emp.nickname && `(${emp.nickname})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setShowEmpresasModal(true)}
                  disabled={isProcessing}
                >
                  + Nova
                </Button>
              </div>
              {!empresaSelecionadaUpload && (
                <p className="text-xs text-muted-foreground">
                  Selecione uma empresa antes de importar
                </p>
              )}
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors
                ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
                ${isProcessing || !empresaSelecionadaUpload ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"}
              `}
            >
              <input {...getInputProps()} />
              {isProcessing ? (
                <div className="space-y-2">
                  <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                  <p className="text-sm">Processando planilha...</p>
                  <Progress value={progress} className="w-full max-w-xs mx-auto" />
                  <p className="text-xs text-muted-foreground">{progress}%</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm">
                    {isDragActive
                      ? "Solte o arquivo aqui..."
                      : "Arraste uma planilha ou clique para selecionar"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: .xlsx, .xls, .csv
                  </p>
                </div>
              )}
            </div>

            {/* Resultado */}
            {result && (
              <Card className={result.erros > 0 ? "border-destructive/50" : "border-green-500/50"}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {result.erros > 0 ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    Resultado da Importação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="secondary">{result.total} total</Badge>
                    <Badge variant="default" className="bg-green-500">
                      {result.novos} novos
                    </Badge>
                    {result.atualizados > 0 && (
                      <Badge variant="default" className="bg-blue-500">
                        {result.atualizados} atualizados
                      </Badge>
                    )}
                    {result.erros > 0 && (
                      <Badge variant="destructive">{result.erros} erros</Badge>
                    )}
                  </div>
                  {result.detalhesErros.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto text-xs text-muted-foreground">
                      {result.detalhesErros.slice(0, 5).map((err, i) => (
                        <p key={i}>
                          Linha {err.linha}: {err.erro}
                        </p>
                      ))}
                      {result.detalhesErros.length > 5 && (
                        <p>...e mais {result.detalhesErros.length - 5} erros</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para criar nova empresa */}
      <Dialog open={showEmpresasModal} onOpenChange={setShowEmpresasModal}>
        <DialogContent className="z-[10000]">
          <DialogHeader>
            <DialogTitle>Nova Empresa Shopee</DialogTitle>
            <DialogDescription>
              Crie uma nova empresa para associar aos pedidos importados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Empresa *</Label>
              <Input
                value={novaEmpresa.nome}
                onChange={(e) => setNovaEmpresa(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Loja Principal Shopee"
              />
            </div>
            <div className="space-y-2">
              <Label>Apelido (opcional)</Label>
              <Input
                value={novaEmpresa.nickname}
                onChange={(e) => setNovaEmpresa(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder="Ex: LP"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEmpresasModal(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarNovaEmpresa} disabled={!novaEmpresa.nome.trim()}>
                Criar Empresa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
