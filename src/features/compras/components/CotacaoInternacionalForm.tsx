import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, X } from "lucide-react";
import type { CotacaoInternacional, ProdutoCotacao } from "@/utils/cotacaoTypeGuards";
import { useSecureCotacoes } from "@/hooks/useSecureCotacoes";
import { useToast } from "@/hooks/use-toast";

interface CotacaoInternacionalFormProps {
  initialData?: CotacaoInternacional;
  onSubmit: (data: CotacaoInternacional) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function CotacaoInternacionalForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading
}: CotacaoInternacionalFormProps) {
  const { toast } = useToast();
  const { secureCreateCotacao, secureUpdateCotacao } = useSecureCotacoes();
  
  // Estados do formulário
  const [numero, setNumero] = useState(initialData?.numero_cotacao || '');
  const [descricao, setDescricao] = useState(initialData?.descricao || '');
  const [paisOrigem, setPaisOrigem] = useState(initialData?.pais_origem || 'China');
  const [moedaOrigem, setMoedaOrigem] = useState(initialData?.moeda_origem || 'CNY');
  const [fatorMultiplicador, setFatorMultiplicador] = useState(initialData?.fator_multiplicador || 1);
  const [dataAbertura, setDataAbertura] = useState(initialData?.data_abertura || new Date().toISOString().split('T')[0]);
  const [dataFechamento, setDataFechamento] = useState(initialData?.data_fechamento || '');
  const [containerTipo, setContainerTipo] = useState(initialData?.container_tipo || '40');
  const [status, setStatus] = useState<'rascunho' | 'aberta' | 'fechada' | 'cancelada'>(initialData?.status as any || 'rascunho');
  const [observacoes, setObservacoes] = useState(initialData?.observacoes || '');
  const [produtos, setProdutos] = useState<ProdutoCotacao[]>(initialData?.produtos || []);

  const adicionarProduto = () => {
    const novoProduto: ProdutoCotacao = {
      id: `prod-${Date.now()}`,
      sku: '',
      nome: '',
      material: '',
      package_qtd: 1,
      preco_unitario: 0,
      unidade_medida: 'PCS',
      pcs_ctn: 1,
      qtd_caixas_pedido: 1,
      peso_unitario_g: 0,
      largura_cm: 0,
      altura_cm: 0,
      comprimento_cm: 0,
      peso_total_kg: 0,
      cbm_unitario: 0,
      cbm_total: 0,
      quantidade_total: 0,
      valor_total: 0
    };
    setProdutos([...produtos, novoProduto]);
  };

  const removerProduto = (index: number) => {
    setProdutos(produtos.filter((_, i) => i !== index));
  };

  const atualizarProduto = (index: number, field: keyof ProdutoCotacao, value: any) => {
    const novosProdutos = [...produtos];
    novosProdutos[index] = {
      ...novosProdutos[index],
      [field]: value
    };

    // Recalcular valores automaticamente
    const produto = novosProdutos[index];
    produto.quantidade_total = produto.pcs_ctn * produto.qtd_caixas_pedido;
    produto.valor_total = produto.preco_unitario * produto.quantidade_total;
    produto.peso_total_kg = (produto.peso_unitario_g * produto.quantidade_total) / 1000;
    produto.cbm_unitario = (produto.largura_cm * produto.altura_cm * produto.comprimento_cm) / 1000000;
    produto.cbm_total = produto.cbm_unitario * produto.qtd_caixas_pedido;

    setProdutos(novosProdutos);
  };

  const calcularTotais = () => {
    return produtos.reduce((acc, p) => ({
      total_peso_kg: acc.total_peso_kg + (p.peso_total_kg || 0),
      total_cbm: acc.total_cbm + (p.cbm_total || 0),
      total_quantidade: acc.total_quantidade + (p.quantidade_total || 0),
      total_valor_origem: acc.total_valor_origem + (p.valor_total || 0),
    }), {
      total_peso_kg: 0,
      total_cbm: 0,
      total_quantidade: 0,
      total_valor_origem: 0,
    });
  };

  const handleSave = async () => {
    const totais = calcularTotais();
    
    const cotacaoData: CotacaoInternacional = {
      id: initialData?.id,
      numero_cotacao: numero,
      descricao,
      pais_origem: paisOrigem,
      moeda_origem: moedaOrigem,
      fator_multiplicador: fatorMultiplicador,
      data_abertura: dataAbertura,
      data_fechamento: dataFechamento || undefined,
      container_tipo: containerTipo,
      status,
      observacoes,
      produtos,
      ...totais,
      total_valor_usd: totais.total_valor_origem, // Simplificado
      total_valor_brl: totais.total_valor_origem * fatorMultiplicador
    };

    try {
      if (initialData?.id) {
        await secureUpdateCotacao(initialData.id, cotacaoData);
      } else {
        await secureCreateCotacao(cotacaoData);
      }
      onSubmit(cotacaoData);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a cotação.",
        variant: "destructive"
      });
    }
  };

  const totais = calcularTotais();

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Número da Cotação *</Label>
            <Input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="COT-INT-001"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="fechada">Fechada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Descrição *</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição da cotação"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>País de Origem</Label>
            <Select value={paisOrigem} onValueChange={setPaisOrigem}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="China">China</SelectItem>
                <SelectItem value="EUA">EUA</SelectItem>
                <SelectItem value="Índia">Índia</SelectItem>
                <SelectItem value="Alemanha">Alemanha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Moeda de Origem</Label>
            <Select value={moedaOrigem} onValueChange={setMoedaOrigem}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CNY">CNY (Yuan)</SelectItem>
                <SelectItem value="USD">USD (Dólar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="INR">INR (Rupia)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data de Abertura</Label>
            <Input
              type="date"
              value={dataAbertura}
              onChange={(e) => setDataAbertura(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Previsão de Chegada</Label>
            <Input
              type="date"
              value={dataFechamento}
              onChange={(e) => setDataFechamento(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Container</Label>
            <Select value={containerTipo} onValueChange={setContainerTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20'</SelectItem>
                <SelectItem value="40">40'</SelectItem>
                <SelectItem value="40HC">40' HC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fator Multiplicador</Label>
            <Input
              type="number"
              value={fatorMultiplicador}
              onChange={(e) => setFatorMultiplicador(parseFloat(e.target.value) || 1)}
              step="0.01"
              min="0.1"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Produtos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Produtos</CardTitle>
          <Button onClick={adicionarProduto} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>PCS/CTN</TableHead>
                  <TableHead>Caixas</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Qtd Total</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
                    </TableCell>
                  </TableRow>
                ) : (
                  produtos.map((produto, index) => (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <Input
                          value={produto.sku}
                          onChange={(e) => atualizarProduto(index, 'sku', e.target.value)}
                          placeholder="SKU"
                          className="min-w-[100px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={produto.nome}
                          onChange={(e) => atualizarProduto(index, 'nome', e.target.value)}
                          placeholder="Nome do produto"
                          className="min-w-[200px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={produto.material}
                          onChange={(e) => atualizarProduto(index, 'material', e.target.value)}
                          placeholder="Material"
                          className="min-w-[100px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={produto.pcs_ctn}
                          onChange={(e) => atualizarProduto(index, 'pcs_ctn', parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={produto.qtd_caixas_pedido}
                          onChange={(e) => atualizarProduto(index, 'qtd_caixas_pedido', parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={produto.preco_unitario}
                          onChange={(e) => atualizarProduto(index, 'preco_unitario', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {produto.quantidade_total}
                      </TableCell>
                      <TableCell className="text-right">
                        {produto.valor_total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerProduto(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totais */}
          {produtos.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Total Quantidade:</span>
                  <div className="text-lg">{totais.total_quantidade}</div>
                </div>
                <div>
                  <span className="font-semibold">Total Peso (kg):</span>
                  <div className="text-lg">{totais.total_peso_kg.toFixed(2)}</div>
                </div>
                <div>
                  <span className="font-semibold">Total CBM:</span>
                  <div className="text-lg">{totais.total_cbm.toFixed(3)}</div>
                </div>
                <div>
                  <span className="font-semibold">Total Valor ({moedaOrigem}):</span>
                  <div className="text-lg">{totais.total_valor_origem.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading || !numero || !descricao}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Salvando...' : 'Salvar Cotação'}
        </Button>
      </div>
    </div>
  );
}
