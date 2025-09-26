// src/components/compras/CotacoesInternacionaisTab.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  Building, 
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Calculator,
  Globe,
  Package,
  Ruler,
  Weight,
  RefreshCw,
  Image,
  Save,
  X,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CurrencyService } from "@/services/currencyService";
import { ProductSelector } from './ProductSelector';
import { useCotacoesInternacionais } from '@/hooks/useCotacoesInternacionais';
import { z } from 'zod';

// Esquemas de validação com zod
const produtoSchema = z.object({
  sku: z.string().trim().min(1, { message: "SKU é obrigatório" }).max(50, { message: "SKU deve ter no máximo 50 caracteres" }),
  nome: z.string().trim().min(1, { message: "Nome é obrigatório" }).max(200, { message: "Nome deve ter no máximo 200 caracteres" }),
  material: z.string().max(100, { message: "Material deve ter no máximo 100 caracteres" }),
  package_qtd: z.number().min(1, { message: "Package deve ser no mínimo 1" }),
  preco_unitario: z.number().min(0, { message: "Preço deve ser positivo" }),
  unidade_medida: z.string(),
  pcs_ctn: z.number().min(1, { message: "PCS/CTN deve ser no mínimo 1" }),
  qtd_caixas_pedido: z.number().min(1, { message: "Quantidade de caixas deve ser no mínimo 1" }),
  peso_unitario_g: z.number().min(0, { message: "Peso deve ser positivo" }),
  largura_cm: z.number().min(0, { message: "Largura deve ser positiva" }),
  altura_cm: z.number().min(0, { message: "Altura deve ser positiva" }),
  comprimento_cm: z.number().min(0, { message: "Comprimento deve ser positivo" })
});

const cotacaoSchema = z.object({
  numero_cotacao: z.string().trim().min(1, { message: "Número da cotação é obrigatório" }).max(50, { message: "Número deve ter no máximo 50 caracteres" }),
  descricao: z.string().trim().min(1, { message: "Descrição é obrigatória" }).max(500, { message: "Descrição deve ter no máximo 500 caracteres" }),
  pais_origem: z.string(),
  moeda_origem: z.string(),
  fator_multiplicador: z.number().min(0.1, { message: "Fator deve ser no mínimo 0.1" }).max(10, { message: "Fator deve ser no máximo 10" }),
  observacoes: z.string().max(1000, { message: "Observações devem ter no máximo 1000 caracteres" })
});

interface ProdutoCotacao {
  id: string;
  sku: string;
  nome: string;
  imagem?: string;
  material: string;
  package_qtd: number; // Quantidade por embalagem
  preco_unitario: number;
  unidade_medida: string;
  pcs_ctn: number; // Peças por caixa master
  qtd_caixas_pedido: number;
  peso_unitario_g: number;
  largura_cm: number;
  altura_cm: number;
  comprimento_cm: number;
  // Campos calculados
  peso_total_kg?: number;
  cbm_unitario?: number;
  cbm_total?: number;
  quantidade_total?: number;
  valor_total?: number;
}

interface CotacaoInternacional {
  id?: string;
  numero_cotacao: string;
  descricao: string;
  pais_origem: string;
  moeda_origem: string;
  fator_multiplicador: number;
  data_abertura: string;
  data_fechamento?: string;
  status: 'rascunho' | 'aberta' | 'fechada' | 'cancelada';
  observacoes: string;
  produtos: ProdutoCotacao[];
  // Totais gerais
  total_peso_kg?: number;
  total_cbm?: number;
  total_quantidade?: number;
  total_valor_origem?: number;
  total_valor_usd?: number;
  total_valor_brl?: number;
}

interface CotacoesInternacionaisTabProps {
  cotacoes?: CotacaoInternacional[];
  onRefresh: () => void;
}

// Lista completa de moedas disponíveis
const AVAILABLE_CURRENCIES = [
  { code: 'USD', name: 'Dólar Americano', flag: '🇺🇸', symbol: '$' },
  { code: 'CNY', name: 'Yuan Chinês', flag: '🇨🇳', symbol: '¥' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'JPY', name: 'Yen Japonês', flag: '🇯🇵', symbol: '¥' },
  { code: 'KRW', name: 'Won Sul-Coreano', flag: '🇰🇷', symbol: '₩' },
  { code: 'GBP', name: 'Libra Esterlina', flag: '🇬🇧', symbol: '£' },
  { code: 'CAD', name: 'Dólar Canadense', flag: '🇨🇦', symbol: 'C$' },
  { code: 'AUD', name: 'Dólar Australiano', flag: '🇦🇺', symbol: 'A$' },
  { code: 'CHF', name: 'Franco Suíço', flag: '🇨🇭', symbol: 'CHF' },
  { code: 'SEK', name: 'Coroa Sueca', flag: '🇸🇪', symbol: 'kr' },
  { code: 'NOK', name: 'Coroa Norueguesa', flag: '🇳🇴', symbol: 'kr' },
  { code: 'DKK', name: 'Coroa Dinamarquesa', flag: '🇩🇰', symbol: 'kr' },
  { code: 'PLN', name: 'Zloty Polonês', flag: '🇵🇱', symbol: 'zł' },
  { code: 'CZK', name: 'Coroa Tcheca', flag: '🇨🇿', symbol: 'Kč' },
  { code: 'HUF', name: 'Forint Húngaro', flag: '🇭🇺', symbol: 'Ft' },
  { code: 'SGD', name: 'Dólar de Singapura', flag: '🇸🇬', symbol: 'S$' },
  { code: 'HKD', name: 'Dólar de Hong Kong', flag: '🇭🇰', symbol: 'HK$' },
  { code: 'NZD', name: 'Dólar Neozelandês', flag: '🇳🇿', symbol: 'NZ$' },
  { code: 'MXN', name: 'Peso Mexicano', flag: '🇲🇽', symbol: '$' },
  { code: 'INR', name: 'Rupia Indiana', flag: '🇮🇳', symbol: '₹' },
  { code: 'RUB', name: 'Rublo Russo', flag: '🇷🇺', symbol: '₽' },
  { code: 'TRY', name: 'Lira Turca', flag: '🇹🇷', symbol: '₺' },
  { code: 'ZAR', name: 'Rand Sul-Africano', flag: '🇿🇦', symbol: 'R' },
  { code: 'THB', name: 'Baht Tailandês', flag: '🇹🇭', symbol: '฿' },
  { code: 'MYR', name: 'Ringgit Malaio', flag: '🇲🇾', symbol: 'RM' },
  { code: 'IDR', name: 'Rupia Indonésia', flag: '🇮🇩', symbol: 'Rp' },
  { code: 'PHP', name: 'Peso Filipino', flag: '🇵🇭', symbol: '₱' },
  { code: 'VND', name: 'Dong Vietnamita', flag: '🇻🇳', symbol: '₫' },
];

// Hook para cotações de moedas com API real
const useCurrencyRates = () => {
  const [rates, setRates] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const { toast } = useToast();

  const updateRates = async () => {
    try {
      setLoading(true);
      const newRates = await CurrencyService.getRealTimeRates();
      setRates(newRates);
      setLastUpdate(newRates.lastUpdate);
      
      toast({
        title: "Cotações atualizadas",
        description: "Cotações de moedas atualizadas com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao atualizar cotações:', error);
      toast({
        title: "Erro ao atualizar cotações",
        description: "Usando valores padrão. Verifique sua conexão.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Carrega cotações iniciais
  useEffect(() => {
    updateRates();
  }, []);

  return { rates, updateRates, loading, lastUpdate };
};

export const CotacoesInternacionaisTab: React.FC<CotacoesInternacionaisTabProps> = ({
  cotacoes = [],
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('basico');
  const [editingCotacao, setEditingCotacao] = useState<CotacaoInternacional | null>(null);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [selectedCotacao, setSelectedCotacao] = useState<CotacaoInternacional | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [changeDolarDivisor, setChangeDolarDivisor] = useState<string>("1");
  const [changeDolarTotalDivisor, setChangeDolarTotalDivisor] = useState<string>("1");
  
  // Estados do formulário
  const [dadosBasicos, setDadosBasicos] = useState({
    numero_cotacao: '',
    descricao: '',
    pais_origem: 'China',
    moeda_origem: 'CNY',
    fator_multiplicador: 1,
    data_abertura: new Date().toISOString().split('T')[0],
    data_fechamento: '',
    status: 'rascunho' as const,
    observacoes: ''
  });

  const [produtos, setProdutos] = useState<ProdutoCotacao[]>([]);
  const [produtoTemp, setProdutoTemp] = useState<Partial<ProdutoCotacao>>({
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
    comprimento_cm: 0
  });

  const { rates, updateRates, loading: ratesLoading, lastUpdate } = useCurrencyRates();
  const { createCotacaoInternacional, updateCotacaoInternacional, loading: saveLoading } = useCotacoesInternacionais();
  const { toast } = useToast();

  // Handler para produtos selecionados do seletor avançado
  const handleProductSelectorConfirm = (selectedProducts: any[]) => {
    const produtosAdicionados: string[] = [];
    const produtosDuplicados: string[] = [];
    
    selectedProducts.forEach(product => {
      // Verificar se já existe um produto com o mesmo SKU
      const produtoExistente = produtos.find(p => p.sku === product.sku_interno);
      
      if (produtoExistente) {
        produtosDuplicados.push(product.nome);
        return;
      }
      
      const novoProduto: ProdutoCotacao = {
        id: `${Date.now()}-${Math.random()}`,
        sku: product.sku_interno,
        nome: product.nome,
        material: '',
        package_qtd: 1,
        preco_unitario: product.preco_custo || 0,
        unidade_medida: 'PCS',
        pcs_ctn: 1,
        qtd_caixas_pedido: product.quantidade || 1,
        peso_unitario_g: 0,
        largura_cm: 0,
        altura_cm: 0,
        comprimento_cm: 0
      };
      
      try {
        produtoSchema.parse(novoProduto);
        setProdutos(prev => [...prev, novoProduto]);
        produtosAdicionados.push(product.nome);
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({
            title: "Erro de validação",
            description: `${product.nome}: ${error.issues[0].message}`,
            variant: "destructive"
          });
        }
      }
    });
    
    // Mostrar feedback dos resultados
    if (produtosAdicionados.length > 0) {
      toast({
        title: "Produtos adicionados!",
        description: `${produtosAdicionados.length} produto(s) adicionado(s) à cotação.`,
      });
    }
    
    if (produtosDuplicados.length > 0) {
      toast({
        title: "Produtos duplicados",
        description: `${produtosDuplicados.length} produto(s) já existe(m) na cotação.`,
        variant: "default"
      });
    }
  };

  // Função para calcular valores do produto
  const calcularProduto = (produto: ProdutoCotacao): ProdutoCotacao => {
    const peso_total_kg = ((produto.peso_unitario_g || 0) * (produto.pcs_ctn || 1) * (produto.qtd_caixas_pedido || 1)) / 1000;
    const cbm_unitario = ((produto.largura_cm || 0) * (produto.altura_cm || 0) * (produto.comprimento_cm || 0)) / 1000000;
    const cbm_total = cbm_unitario * (produto.qtd_caixas_pedido || 1);
    const quantidade_total = (produto.pcs_ctn || 1) * (produto.qtd_caixas_pedido || 1);
    const valor_total = (produto.preco_unitario || 0) * quantidade_total;

    return {
      ...produto,
      peso_total_kg: peso_total_kg || 0,
      cbm_unitario: cbm_unitario || 0,
      cbm_total: cbm_total || 0,
      quantidade_total: quantidade_total || 0,
      valor_total: valor_total || 0
    };
  };

  // Função para converter moedas usando API real
  const converterMoeda = (valor: number, moedaOrigem: string, fatorMultiplicador: number = 1) => {
    const valorComFator = valor * fatorMultiplicador;
    
    // Se não temos cotações ainda, usa valores padrão
    if (!rates || Object.keys(rates).length === 0) {
      return {
        valorUSD: valorComFator * (moedaOrigem === 'USD' ? 1 : 0.14),
        valorBRL: valorComFator * (moedaOrigem === 'USD' ? 5.20 : 0.14 * 5.20)
      };
    }
    
    let valorUSD = valorComFator;
    
    // Se a moeda origem é USD, não precisa converter
    if (moedaOrigem === 'USD') {
      valorUSD = valorComFator;
    } else {
      // Busca a taxa de conversão da moeda para USD
      const rateKey = `${moedaOrigem}_USD`;
      const rate = rates[rateKey];
      
      if (rate) {
        valorUSD = valorComFator * rate;
      } else {
        // Fallback: tenta buscar diretamente nas rates
        const directRate = rates[moedaOrigem];
        if (directRate) {
          valorUSD = valorComFator / directRate;
        }
      }
    }
    
    const valorBRL = valorUSD * (rates.USD_BRL || 5.20);
    
    return { valorUSD, valorBRL };
  };

  // Cálculos totais da cotação
  const totaisGerais = useMemo(() => {
    const produtosCalculados = produtos.map(calcularProduto);
    
    const total_peso_kg = produtosCalculados.reduce((sum, p) => sum + (p.peso_total_kg || 0), 0);
    const total_cbm = produtosCalculados.reduce((sum, p) => sum + (p.cbm_total || 0), 0);
    const total_quantidade = produtosCalculados.reduce((sum, p) => sum + (p.quantidade_total || 0), 0);
    const total_valor_origem = produtosCalculados.reduce((sum, p) => sum + (p.valor_total || 0), 0);
    
    const { valorUSD: total_valor_usd, valorBRL: total_valor_brl } = converterMoeda(
      total_valor_origem, 
      dadosBasicos.moeda_origem, 
      dadosBasicos.fator_multiplicador
    );

    return {
      total_peso_kg: total_peso_kg || 0,
      total_cbm: total_cbm || 0,
      total_quantidade: total_quantidade || 0,
      total_valor_origem: total_valor_origem || 0,
      total_valor_usd: total_valor_usd || 0,
      total_valor_brl: total_valor_brl || 0,
      produtos: produtosCalculados
    };
  }, [produtos, dadosBasicos.moeda_origem, dadosBasicos.fator_multiplicador, rates]);

  const adicionarProduto = () => {
    try {
      // Validação com zod
      const produtoValidado = produtoSchema.parse(produtoTemp);

      const novoProduto: ProdutoCotacao = {
        id: Date.now().toString(),
        ...produtoValidado
      };

      setProdutos([...produtos, novoProduto]);
      setProdutoTemp({
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
        comprimento_cm: 0
      });

      toast({
        title: "Produto adicionado",
        description: `${novoProduto.nome} foi adicionado à cotação`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.issues[0].message,
          variant: "destructive"
        });
      }
    }
  };

  const removerProduto = (id: string) => {
    setProdutos(produtos.filter(p => p.id !== id));
  };

  const resetForm = () => {
    setDadosBasicos({
      numero_cotacao: `COT-INT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      descricao: '',
      pais_origem: 'China',
      moeda_origem: 'CNY',
      fator_multiplicador: 1,
      data_abertura: new Date().toISOString().split('T')[0],
      data_fechamento: '',
      status: 'rascunho',
      observacoes: ''
    });
    setProdutos([]);
    setProdutoTemp({
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
      comprimento_cm: 0
    });
    setCurrentTab('basico');
    setEditingCotacao(null);
  };

  const handleSave = async () => {
    try {
      // Validação dos dados básicos
      cotacaoSchema.parse(dadosBasicos);

      if (produtos.length === 0) {
        toast({
          title: "Erro de validação",
          description: "Adicione pelo menos um produto à cotação",
          variant: "destructive"
        });
        return;
      }

      const cotacaoCompleta: CotacaoInternacional = {
        ...dadosBasicos,
        produtos,
        ...totaisGerais
      };

      console.log('Salvando cotação:', cotacaoCompleta);

      // Salvar no banco de dados
      if (editingCotacao?.id) {
        await updateCotacaoInternacional(editingCotacao.id, cotacaoCompleta);
      } else {
        await createCotacaoInternacional(cotacaoCompleta);
      }

      toast({
        title: "✅ Cotação salva com sucesso!",
        description: `Cotação ${cotacaoCompleta.numero_cotacao} foi criada na aba "Cotações Internacionais"`,
      });

      setShowModal(false);
      resetForm();
      onRefresh();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.issues[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar a cotação",
          variant: "destructive"
        });
      }
    }
  };

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    const configs = {
      BRL: { locale: 'pt-BR', currency: 'BRL' },
      USD: { locale: 'en-US', currency: 'USD' },
      CNY: { locale: 'zh-CN', currency: 'CNY' },
      EUR: { locale: 'de-DE', currency: 'EUR' },
      JPY: { locale: 'ja-JP', currency: 'JPY' }
    };
    
    const config = configs[currency as keyof typeof configs] || configs.BRL;
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency
    }).format(value);
  };

  // Funções para seleção de produtos na tabela Excel
  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && selectedCotacao?.produtos) {
      setSelectedProducts(selectedCotacao.produtos.map((p: any, index: number) => index.toString()));
    } else {
      setSelectedProducts([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho': return 'bg-gray-500';
      case 'aberta': return 'bg-blue-500';
      case 'fechada': return 'bg-green-500';
      case 'cancelada': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Helpers para conversão segura dos divisores
  const getChangeDolarDivisorValue = () => {
    const value = parseFloat(changeDolarDivisor);
    return value > 0 ? value : 1;
  };

  const getChangeDolarTotalDivisorValue = () => {
    const value = parseFloat(changeDolarTotalDivisor);
    return value > 0 ? value : 1;
  };

  // Mock data para exemplo da tabela Excel
  const mockProducts = selectedCotacao?.produtos?.length > 0 ? selectedCotacao.produtos.map((p: any, index: number) => ({
    sku: p.sku || `PL-${800 + index}`,
    imagem: "",
    imagem_fornecedor: "",
    material: p.material || "Poliéster",
    cor: "Azul Da Foto",
    nome_produto: p.nome || `Produto ${index + 1}`,
    package: `${p.package_qtd || 10}pcs/opp`,
    preco: p.preco_unitario || 5.25,
    unit: p.unidade_medida || "pc",
    pcs_ctn: p.pcs_ctn || 240,
    caixas: p.qtd_caixas_pedido || 1,
    peso_unitario_g: p.peso_unitario_g || 90,
    peso_cx_master_kg: (p.peso_unitario_g || 90) * (p.pcs_ctn || 240) / 1000,
    peso_sem_cx_master_kg: ((p.peso_unitario_g || 90) * (p.pcs_ctn || 240) / 1000) - 1,
    peso_total_cx_master_kg: (p.peso_unitario_g || 90) * (p.pcs_ctn || 240) / 1000,
    peso_total_sem_cx_master_kg: ((p.peso_unitario_g || 90) * (p.pcs_ctn || 240) / 1000) - 1,
    comprimento: p.comprimento_cm || 0,
    largura: p.largura_cm || 0,
    altura: p.altura_cm || 0,
    cbm_cubagem: p.cbm_unitario || 0.21,
    cbm_total: p.cbm_total || 0.21,
    quantidade_total: p.quantidade_total || 240,
    valor_total: p.valor_total || 1260.00,
    obs: "",
    change_dolar: (p.preco_unitario || 5.25) / getChangeDolarDivisorValue(),
    change_dolar_total: (p.valor_total || 1260.00) / getChangeDolarTotalDivisorValue(),
    multiplicador_reais: 5.44
  })) : [
    {
      sku: "PL-800",
      imagem: "",
      imagem_fornecedor: "",
      material: "Poliéster",
      cor: "Azul Da Foto",
      nome_produto: "Chapéu aeronáutica, 28*21*14cm",
      package: "10pcs/opp",
      preco: 5.25,
      unit: "pc",
      pcs_ctn: 240,
      caixas: 1,
      peso_unitario_g: 90,
      peso_cx_master_kg: 22.60,
      peso_sem_cx_master_kg: 21.60,
      peso_total_cx_master_kg: 22.60,
      peso_total_sem_cx_master_kg: 21.60,
      comprimento: 0,
      largura: 0,
      altura: 0,
      cbm_cubagem: 0.21,
      cbm_total: 0.21,
      quantidade_total: 240,
      valor_total: 1260.00,
      obs: "",
      change_dolar: 5.25 / getChangeDolarDivisorValue(),
      change_dolar_total: 1260.00 / getChangeDolarTotalDivisorValue(),
      multiplicador_reais: 5.44
    },
    {
      sku: "PL-801",
      imagem: "",
      imagem_fornecedor: "",
      material: "Poliéster",
      cor: "Azul Da Foto",
      nome_produto: "Chapéu polícia, 23.5*21*14cm",
      package: "10pcs/opp",
      preco: 5.80,
      unit: "pc",
      pcs_ctn: 200,
      caixas: 1,
      peso_unitario_g: 70,
      peso_cx_master_kg: 15.00,
      peso_sem_cx_master_kg: 14.00,
      peso_total_cx_master_kg: 15.00,
      peso_total_sem_cx_master_kg: 14.00,
      comprimento: 0,
      largura: 0,
      altura: 0,
      cbm_cubagem: 0.21,
      cbm_total: 0.21,
      quantidade_total: 200,
      valor_total: 1160.00,
      obs: "",
      change_dolar: 5.80 / getChangeDolarDivisorValue(),
      change_dolar_total: 1160.00 / getChangeDolarTotalDivisorValue(),
      multiplicador_reais: 6.00
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Cotações Internacionais</h2>
          <p className="text-muted-foreground">
            Gerencie suas cotações de fornecedores internacionais
          </p>
        </div>
        
        <div className="flex gap-2">
          {selectedCotacao && (
            <Button variant="outline" onClick={() => setSelectedCotacao(null)}>
              Voltar aos Cards
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={updateRates} 
            className="gap-2"
            disabled={ratesLoading}
          >
            <RefreshCw className={`h-4 w-4 ${ratesLoading ? 'animate-spin' : ''}`} />
            {ratesLoading ? 'Atualizando...' : 'Atualizar Cotações'}
          </Button>
          <Button className="gap-2" onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="h-4 w-4" />
            Nova Cotação Internacional
          </Button>
        </div>
      </div>

      {!selectedCotacao ? (
        <>
          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cotações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Cotações Grid - Cards Layout */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cotacoes
              .filter(cotacao => 
                cotacao.numero_cotacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cotacao.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((cotacao) => (
                <Card key={cotacao.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCotacao(cotacao)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{cotacao.numero_cotacao}</CardTitle>
                      <Badge className={`text-white ${getStatusColor(cotacao.status)}`}>
                        {cotacao.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {cotacao.descricao}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(cotacao.data_abertura).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{cotacao.total_quantidade || 0} itens</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Origem ({cotacao.moeda_origem}):</span>
                        <span>{formatCurrency(cotacao.total_valor_origem || 0, cotacao.moeda_origem)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total BRL:</span>
                        <span>{formatCurrency(cotacao.total_valor_brl || 0)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Produtos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {cotacoes.filter(cotacao => 
            cotacao.numero_cotacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cotacao.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma cotação encontrada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece criando sua primeira cotação internacional'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Cotação
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {/* Cabeçalho da Cotação Selecionada */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedCotacao.numero_cotacao}</CardTitle>
                  <p className="text-muted-foreground">{selectedCotacao.descricao}</p>
                </div>
                <Badge className={`text-white ${getStatusColor(selectedCotacao.status)}`}>
                  {selectedCotacao.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">País:</span>
                  <div className="font-semibold">{selectedCotacao.pais_origem}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Moeda:</span>
                  <div className="font-semibold">{selectedCotacao.moeda_origem}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Fator:</span>
                  <div className="font-semibold">{selectedCotacao.fator_multiplicador}x</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total BRL:</span>
                  <div className="font-semibold text-green-600">{formatCurrency(selectedCotacao.total_valor_brl || 0)}</div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Tabela estilo Excel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Produtos da Cotação</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[50px]">
                        <input 
                          type="checkbox"
                          checked={selectedProducts.length === mockProducts.length && mockProducts.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead className="min-w-[100px]">SKU</TableHead>
                      <TableHead className="min-w-[80px]">IMAGEM</TableHead>
                      <TableHead className="min-w-[120px]">IMAGEM DO FORNECEDOR</TableHead>
                      <TableHead className="min-w-[100px]">MATERIAL</TableHead>
                      <TableHead className="min-w-[80px]">COR</TableHead>
                      <TableHead className="min-w-[200px]">Nome do Produto</TableHead>
                      <TableHead className="min-w-[100px]">PACKAGE</TableHead>
                      <TableHead className="min-w-[80px]">PREÇO</TableHead>
                      <TableHead className="min-w-[60px]">UNIT</TableHead>
                      <TableHead className="min-w-[80px]">PCS/CTN</TableHead>
                      <TableHead className="min-w-[80px]">CAIXAS</TableHead>
                      <TableHead className="min-w-[120px]">PESO UNITARIO(g)</TableHead>
                      <TableHead className="min-w-[140px]">Peso cx Master (KG)</TableHead>
                      <TableHead className="min-w-[160px]">Peso Sem cx Master (KG)</TableHead>
                      <TableHead className="min-w-[160px]">Peso total cx Master (KG)</TableHead>
                      <TableHead className="min-w-[180px]">Peso total sem cx Master (KG)</TableHead>
                      <TableHead className="min-w-[100px]">Comprimento</TableHead>
                      <TableHead className="min-w-[80px]">Largura</TableHead>
                      <TableHead className="min-w-[80px]">Altura</TableHead>
                      <TableHead className="min-w-[120px]">CBM Cubagem</TableHead>
                      <TableHead className="min-w-[100px]">CBM Total</TableHead>
                      <TableHead className="min-w-[120px]">Quantidade Total</TableHead>
                      <TableHead className="min-w-[120px]">Valor Total</TableHead>
                      <TableHead className="min-w-[100px]">OBS</TableHead>
                      <TableHead className="min-w-[120px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium">CHANGE DOLAR UNITARIO</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>PREÇO ÷ Divisor</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            type="number"
                            placeholder="Divisor"
                            value={changeDolarDivisor}
                            onChange={(e) => setChangeDolarDivisor(e.target.value)}
                            className="h-6 text-xs"
                            step="0.01"
                            min="0.01"
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium">CHANGE DOLAR TOTAL</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>VALOR TOTAL ÷ Divisor</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            type="number"
                            placeholder="Divisor"
                            value={changeDolarTotalDivisor}
                            onChange={(e) => setChangeDolarTotalDivisor(e.target.value)}
                            className="h-6 text-xs"
                            step="0.01"
                            min="0.01"
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[140px]">Multiplicador REAIS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProducts.map((product: any, index: number) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell>
                          <input 
                            type="checkbox"
                            checked={selectedProducts.includes(index.toString())}
                            onChange={(e) => handleSelectProduct(index.toString(), e.target.checked)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{product.sku}</TableCell>
                        <TableCell>
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center cursor-pointer hover:bg-muted/80">
                            {product.imagem ? (
                              <img src={product.imagem} alt="Produto" className="w-full h-full object-cover rounded" />
                            ) : (
                              <Image className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center cursor-pointer hover:bg-muted/80">
                            {product.imagem_fornecedor ? (
                              <img src={product.imagem_fornecedor} alt="Fornecedor" className="w-full h-full object-cover rounded" />
                            ) : (
                              <Image className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.material}</TableCell>
                        <TableCell>{product.cor}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={product.nome_produto}>
                          {product.nome_produto}
                        </TableCell>
                        <TableCell>{product.package}</TableCell>
                        <TableCell>¥ {product.preco.toFixed(2)}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>{product.pcs_ctn}</TableCell>
                        <TableCell>{product.caixas}</TableCell>
                        <TableCell>{product.peso_unitario_g}</TableCell>
                        <TableCell>{product.peso_cx_master_kg.toFixed(2)}</TableCell>
                        <TableCell>{product.peso_sem_cx_master_kg.toFixed(2)}</TableCell>
                        <TableCell>{product.peso_total_cx_master_kg.toFixed(2)}</TableCell>
                        <TableCell>{product.peso_total_sem_cx_master_kg.toFixed(2)}</TableCell>
                        <TableCell>{product.comprimento}</TableCell>
                        <TableCell>{product.largura}</TableCell>
                        <TableCell>{product.altura}</TableCell>
                        <TableCell>{product.cbm_cubagem.toFixed(2)}</TableCell>
                        <TableCell>{product.cbm_total.toFixed(2)}</TableCell>
                        <TableCell>{product.quantidade_total}</TableCell>
                        <TableCell>¥ {product.valor_total.toFixed(2)}</TableCell>
                        <TableCell>{product.obs}</TableCell>
                        <TableCell>$ {product.change_dolar.toFixed(2)}</TableCell>
                        <TableCell>$ {product.change_dolar_total.toFixed(2)}</TableCell>
                        <TableCell>R$ {product.multiplicador_reais.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {mockProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado nesta cotação
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Nova Cotação */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {editingCotacao ? 'Editar Cotação Internacional' : 'Nova Cotação Internacional'}
              {dadosBasicos.numero_cotacao && (
                <Badge variant="outline">{dadosBasicos.numero_cotacao}</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Gerencie cotações de produtos importados com conversão automática de moedas e cálculos de impostos.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico">Dados Básicos</TabsTrigger>
              <TabsTrigger value="produtos">Produtos ({produtos.length})</TabsTrigger>
              <TabsTrigger value="calculos">Cálculos</TabsTrigger>
              <TabsTrigger value="revisao">Revisão</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {/* ABA 1: Dados Básicos */}
              <TabsContent value="basico" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Gerais</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Número da Cotação *</Label>
                      <Input
                        value={dadosBasicos.numero_cotacao}
                        onChange={(e) => setDadosBasicos({ ...dadosBasicos, numero_cotacao: e.target.value })}
                        placeholder="COT-INT-2024-001"
                        maxLength={50}
                      />
                    </div>
                    
                    <div>
                      <Label>Descrição *</Label>
                      <Input
                        value={dadosBasicos.descricao}
                        onChange={(e) => setDadosBasicos({ ...dadosBasicos, descricao: e.target.value })}
                        placeholder="Ex: Produtos eletrônicos da China"
                        maxLength={500}
                      />
                    </div>
                    
                    <div>
                      <Label>País de Origem</Label>
                      <Select 
                        value={dadosBasicos.pais_origem} 
                        onValueChange={(value) => setDadosBasicos({ ...dadosBasicos, pais_origem: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="China">🇨🇳 China</SelectItem>
                          <SelectItem value="Estados Unidos">🇺🇸 Estados Unidos</SelectItem>
                          <SelectItem value="Alemanha">🇩🇪 Alemanha</SelectItem>
                          <SelectItem value="Japão">🇯🇵 Japão</SelectItem>
                          <SelectItem value="Coreia do Sul">🇰🇷 Coreia do Sul</SelectItem>
                          <SelectItem value="Itália">🇮🇹 Itália</SelectItem>
                          <SelectItem value="França">🇫🇷 França</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Moeda de Origem</Label>
                      <Select 
                        value={dadosBasicos.moeda_origem} 
                        onValueChange={(value) => setDadosBasicos({ ...dadosBasicos, moeda_origem: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {AVAILABLE_CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.flag} {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Fator Multiplicador</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="10"
                        value={dadosBasicos.fator_multiplicador}
                        onChange={(e) => setDadosBasicos({ ...dadosBasicos, fator_multiplicador: parseFloat(e.target.value) || 1 })}
                        placeholder="1.00"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Fator para ajustar preços (ex: 1.1 para 10% de margem)
                      </p>
                    </div>
                    
                    <div>
                      <Label>Data de Abertura</Label>
                      <Input
                        type="date"
                        value={dadosBasicos.data_abertura}
                        onChange={(e) => setDadosBasicos({ ...dadosBasicos, data_abertura: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label>Data de Fechamento</Label>
                      <Input
                        type="date"
                        value={dadosBasicos.data_fechamento}
                        onChange={(e) => setDadosBasicos({ ...dadosBasicos, data_fechamento: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label>Status</Label>
                      <Select 
                        value={dadosBasicos.status} 
                        onValueChange={(value) => setDadosBasicos({ ...dadosBasicos, status: value as any })}
                      >
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
                    
                    <div className="md:col-span-2">
                      <Label>Observações</Label>
                      <Textarea
                        value={dadosBasicos.observacoes}
                        onChange={(e) => setDadosBasicos({ ...dadosBasicos, observacoes: e.target.value })}
                        placeholder="Observações sobre a cotação internacional..."
                        rows={3}
                        maxLength={1000}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Conversões em tempo real */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Simulador de Conversão
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="text-sm text-muted-foreground">Moeda Origem</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(100, dadosBasicos.moeda_origem)}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-success/5 border border-success/20 rounded-lg">
                        <div className="text-sm text-muted-foreground">Em Dólares</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(converterMoeda(100, dadosBasicos.moeda_origem, dadosBasicos.fator_multiplicador).valorUSD, 'USD')}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-warning/5 border border-warning/20 rounded-lg">
                        <div className="text-sm text-muted-foreground">Em Reais</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(converterMoeda(100, dadosBasicos.moeda_origem, dadosBasicos.fator_multiplicador).valorBRL, 'BRL')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ABA 2: Produtos */}
              <TabsContent value="produtos" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Formulário de Produto */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Adicionar Produto
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>SKU *</Label>
                          <Input
                            value={produtoTemp.sku}
                            onChange={(e) => setProdutoTemp({ ...produtoTemp, sku: e.target.value })}
                            placeholder="SKU001"
                            maxLength={50}
                          />
                        </div>
                        <div>
                          <Label>Nome *</Label>
                          <Input
                            value={produtoTemp.nome}
                            onChange={(e) => setProdutoTemp({ ...produtoTemp, nome: e.target.value })}
                            placeholder="Nome do produto"
                            maxLength={200}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Material</Label>
                        <Input
                          value={produtoTemp.material}
                          onChange={(e) => setProdutoTemp({ ...produtoTemp, material: e.target.value })}
                          placeholder="Ex: Plástico ABS, Aço inox, Algodão"
                          maxLength={100}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Package (pcs/embalagem)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={produtoTemp.package_qtd}
                            onChange={(e) => setProdutoTemp({ ...produtoTemp, package_qtd: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div>
                          <Label>Preço Unitário</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={produtoTemp.preco_unitario}
                            onChange={(e) => setProdutoTemp({ ...produtoTemp, preco_unitario: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Unidade</Label>
                          <Select 
                            value={produtoTemp.unidade_medida} 
                            onValueChange={(value) => setProdutoTemp({ ...produtoTemp, unidade_medida: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PCS">PCS - Peças</SelectItem>
                              <SelectItem value="KG">KG - Quilograma</SelectItem>
                              <SelectItem value="M">M - Metro</SelectItem>
                              <SelectItem value="M2">M² - Metro Quadrado</SelectItem>
                              <SelectItem value="L">L - Litro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>PCS/CTN (pcs por caixa master)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={produtoTemp.pcs_ctn}
                            onChange={(e) => setProdutoTemp({ ...produtoTemp, pcs_ctn: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Qtd Caixas Pedido</Label>
                          <Input
                            type="number"
                            min="1"
                            value={produtoTemp.qtd_caixas_pedido}
                            onChange={(e) => setProdutoTemp({ ...produtoTemp, qtd_caixas_pedido: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div>
                          <Label>Peso Unitário (g)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={produtoTemp.peso_unitario_g}
                            onChange={(e) => setProdutoTemp({ ...produtoTemp, peso_unitario_g: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Dimensões (cm)</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="Largura"
                            min="0"
                            value={produtoTemp.largura_cm}
                            onChange={(e) => setProdutoTemp({ ...produtoTemp, largura_cm: parseFloat(e.target.value) || 0 })}
                          />
                          <Input
                            type="number"
                            placeholder="Altura"
                            min="0"
                            value={produtoTemp.altura_cm}
                            onChange={(e) => setProdutoTemp({ ...produtoTemp, altura_cm: parseFloat(e.target.value) || 0 })}
                          />
                          <Input
                            type="number"
                            placeholder="Comprimento"
                            min="0"
                            value={produtoTemp.comprimento_cm}
                            onChange={(e) => setProdutoTemp({ ...produtoTemp, comprimento_cm: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Button onClick={adicionarProduto} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Produto
                        </Button>
                        
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">ou</span>
                          </div>
                        </div>
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsProductSelectorOpen(true)}
                          className="w-full gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Usar Seletor Avançado
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lista de Produtos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Produtos Adicionados ({produtos.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto">
                      {produtos.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground mb-4">Nenhum produto adicionado</p>
                          <Button 
                            onClick={() => setIsProductSelectorOpen(true)}
                            variant="outline"
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Usar Seletor Avançado
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {produtos.map((produto, index) => {
                            const produtoCalculado = calcularProduto(produto);
                            return (
                              <div key={produto.id} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <div className="font-medium">{produto.nome}</div>
                                    <div className="text-sm text-muted-foreground">
                                      SKU: {produto.sku} | Material: {produto.material}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removerProduto(produto.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>Qtd Total: <strong>{produtoCalculado.quantidade_total || 0}</strong></div>
                                  <div>Peso Total: <strong>{(produtoCalculado.peso_total_kg || 0).toFixed(2)} kg</strong></div>
                                  <div>CBM: <strong>{(produtoCalculado.cbm_total || 0).toFixed(4)} m³</strong></div>
                                  <div>Valor: <strong>{formatCurrency(produtoCalculado.valor_total || 0, dadosBasicos.moeda_origem)}</strong></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ABA 3: Cálculos */}
              <TabsContent value="calculos" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Totais Físicos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Weight className="h-5 w-5" />
                        Totais Físicos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <div className="text-sm text-muted-foreground">Peso Total</div>
                          <div className="text-xl font-bold">{(totaisGerais.total_peso_kg || 0).toFixed(2)} kg</div>
                        </div>
                        <div className="text-center p-3 bg-success/5 border border-success/20 rounded-lg">
                          <div className="text-sm text-muted-foreground">CBM Total</div>
                          <div className="text-xl font-bold">{(totaisGerais.total_cbm || 0).toFixed(4)} m³</div>
                        </div>
                        <div className="text-center p-3 bg-warning/5 border border-warning/20 rounded-lg">
                          <div className="text-sm text-muted-foreground">Quantidade Total</div>
                          <div className="text-xl font-bold">{totaisGerais.total_quantidade || 0} pcs</div>
                        </div>
                        <div className="text-center p-3 bg-accent/5 border border-accent/20 rounded-lg">
                          <div className="text-sm text-muted-foreground">Produtos</div>
                          <div className="text-xl font-bold">{produtos.length}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Totais Financeiros */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Totais Financeiros
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <span className="text-sm text-muted-foreground">Valor em {dadosBasicos.moeda_origem}:</span>
                          <span className="font-bold">{formatCurrency(totaisGerais.total_valor_origem, dadosBasicos.moeda_origem)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-success/5 border border-success/20 rounded-lg">
                          <span className="text-sm text-muted-foreground">Valor em USD:</span>
                          <span className="font-bold">{formatCurrency(totaisGerais.total_valor_usd, 'USD')}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-warning/5 border border-warning/20 rounded-lg">
                          <span className="text-sm text-muted-foreground">Valor em BRL:</span>
                          <span className="font-bold text-lg">{formatCurrency(totaisGerais.total_valor_brl, 'BRL')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabela Detalhada de Produtos */}
                {produtos.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalhamento por Produto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>SKU</TableHead>
                              <TableHead>Nome</TableHead>
                              <TableHead>Qtd Caixas</TableHead>
                              <TableHead>PCS/CTN</TableHead>
                              <TableHead>Qtd Total</TableHead>
                              <TableHead>Peso Total (kg)</TableHead>
                              <TableHead>CBM Total</TableHead>
                              <TableHead>Valor {dadosBasicos.moeda_origem}</TableHead>
                              <TableHead>Valor BRL</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {totaisGerais.produtos.map((produto) => {
                              const { valorBRL } = converterMoeda(produto.valor_total || 0, dadosBasicos.moeda_origem, dadosBasicos.fator_multiplicador);
                              return (
                                <TableRow key={produto.id}>
                                  <TableCell className="font-medium">{produto.sku}</TableCell>
                                  <TableCell>{produto.nome}</TableCell>
                                  <TableCell>{produto.qtd_caixas_pedido}</TableCell>
                                  <TableCell>{produto.pcs_ctn}</TableCell>
                                  <TableCell>{produto.quantidade_total}</TableCell>
                                  <TableCell>{(produto.peso_total_kg || 0).toFixed(2)}</TableCell>
                                  <TableCell>{(produto.cbm_total || 0).toFixed(4)}</TableCell>
                                  <TableCell>{formatCurrency(produto.valor_total || 0, dadosBasicos.moeda_origem)}</TableCell>
                                  <TableCell>{formatCurrency(valorBRL, 'BRL')}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ABA 4: Revisão */}
              <TabsContent value="revisao" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Revisão da Cotação Internacional
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Dados Básicos */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Dados da Cotação</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Número:</span>
                            <span>{dadosBasicos.numero_cotacao}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Descrição:</span>
                            <span>{dadosBasicos.descricao}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">País:</span>
                            <span>{dadosBasicos.pais_origem}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Moeda:</span>
                            <span>{dadosBasicos.moeda_origem}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fator:</span>
                            <span>{dadosBasicos.fator_multiplicador}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="outline">{dadosBasicos.status}</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Resumo Executivo */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Resumo Executivo</h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <div className="text-sm text-muted-foreground">Total de Produtos</div>
                            <div className="text-xl font-bold">{produtos.length} itens</div>
                          </div>
                          <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                            <div className="text-sm text-muted-foreground">Quantidade Total</div>
                            <div className="text-xl font-bold">{totaisGerais.total_quantidade} peças</div>
                          </div>
                          <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                            <div className="text-sm text-muted-foreground">Peso Total</div>
                            <div className="text-xl font-bold">{(totaisGerais.total_peso_kg || 0).toFixed(2)} kg</div>
                          </div>
                          <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
                            <div className="text-sm text-muted-foreground">Volume Total</div>
                            <div className="text-xl font-bold">{(totaisGerais.total_cbm || 0).toFixed(4)} m³</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Resumo Financeiro */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Resumo Financeiro</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-primary/20">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-muted-foreground">Valor em {dadosBasicos.moeda_origem}</div>
                            <div className="text-2xl font-bold text-primary">
                              {formatCurrency(totaisGerais.total_valor_origem, dadosBasicos.moeda_origem)}
                            </div>
                            <div className="text-xs text-muted-foreground">Moeda de origem</div>
                          </CardContent>
                        </Card>
                        <Card className="border-success/20">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-muted-foreground">Valor em USD</div>
                            <div className="text-2xl font-bold text-success">
                              {formatCurrency(totaisGerais.total_valor_usd, 'USD')}
                            </div>
                            <div className="text-xs text-muted-foreground">Dólar americano</div>
                          </CardContent>
                        </Card>
                        <Card className="border-warning/20">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-muted-foreground">Valor em BRL</div>
                            <div className="text-2xl font-bold text-warning">
                              {formatCurrency(totaisGerais.total_valor_brl, 'BRL')}
                            </div>
                            <div className="text-xs text-muted-foreground">Real brasileiro</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Informações de Cotação */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Informações de Cotação</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-muted-foreground">Taxa {dadosBasicos.moeda_origem}/USD</div>
                          <div className="font-bold">
                            {dadosBasicos.moeda_origem === 'CNY' ? (rates.CNY_USD || 0).toFixed(4) :
                             dadosBasicos.moeda_origem === 'EUR' ? (rates.EUR_USD || 0).toFixed(4) :
                             dadosBasicos.moeda_origem === 'JPY' ? (rates.JPY_USD || 0).toFixed(4) : '1.0000'}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-muted-foreground">Taxa USD/BRL</div>
                          <div className="font-bold">{(rates.USD_BRL || 0).toFixed(2)}</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-muted-foreground">Fator Aplicado</div>
                          <div className="font-bold">{dadosBasicos.fator_multiplicador}x</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-muted-foreground">Atualizado</div>
                          <div className="font-bold text-xs">{new Date(rates.lastUpdate).toLocaleTimeString('pt-BR')}</div>
                        </div>
                      </div>
                    </div>

                    {/* Validações */}
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Validações
                      </h4>
                      <div className="space-y-1 text-sm">
                        {!dadosBasicos.numero_cotacao && (
                          <div className="flex items-center gap-2 text-destructive">
                            <X className="h-3 w-3" />
                            <span>Número da cotação é obrigatório</span>
                          </div>
                        )}
                        {!dadosBasicos.descricao && (
                          <div className="flex items-center gap-2 text-destructive">
                            <X className="h-3 w-3" />
                            <span>Descrição é obrigatória</span>
                          </div>
                        )}
                        {produtos.length === 0 && (
                          <div className="flex items-center gap-2 text-warning">
                            <AlertCircle className="h-3 w-3" />
                            <span>Nenhum produto adicionado</span>
                          </div>
                        )}
                        {dadosBasicos.numero_cotacao && dadosBasicos.descricao && produtos.length > 0 && (
                          <div className="flex items-center gap-2 text-success">
                            <CheckCircle className="h-3 w-3" />
                            <span>Cotação pronta para ser salva</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={updateRates} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Cotações
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={!dadosBasicos.numero_cotacao || !dadosBasicos.descricao || saveLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveLoading ? 'Salvando...' : (editingCotacao ? 'Atualizar' : 'Salvar')} Cotação
                </Button>
              </div>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Modal do Seletor de Produtos */}
      <ProductSelector
        isOpen={isProductSelectorOpen}
        onOpenChange={setIsProductSelectorOpen}
        onSelectProducts={handleProductSelectorConfirm}
      />
    </div>
  );
};