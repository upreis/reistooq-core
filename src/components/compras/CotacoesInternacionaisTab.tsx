// src/components/compras/CotacoesInternacionaisTab.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditableCell } from './EditableCell';
import ContainerVisualization from './ContainerVisualization';
import { CotacaoImportDialog } from './CotacaoImportDialog';
import { ProdutoImagemPreview } from './ProdutoImagemPreview';
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
  Info,
  Download
} from "lucide-react";
import { CurrencyService } from "@/services/currencyService";
import { ProductSelector } from './ProductSelector';
import { useCotacoesInternacionais } from '@/hooks/useCotacoesInternacionais';
import { useToast } from "@/hooks/use-toast";
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';

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
  const [multiplicadorReais, setMultiplicadorReais] = useState<string>("5.44");
  const [multiplicadorReaisTotal, setMultiplicadorReaisTotal] = useState<string>("5.44");
  
  // Estados para edição inline
  const [editingCell, setEditingCell] = useState<{row: number, field: string} | null>(null);
  const [productData, setProductData] = useState<any[]>(() => {
    // Tentar recuperar dados do sessionStorage
    try {
      const savedData = sessionStorage.getItem('cotacao-produtos');
      if (savedData) {
        const data = JSON.parse(savedData);
        
        // Filtrar dados inválidos incluindo PROD-29
        const cleanedData = data
          .filter((product: any) => 
            product.sku && 
            product.sku !== 'PROD-29' && 
            (!product.sku.startsWith('PROD-') || 
             (product.sku.startsWith('PROD-') && product.nome_produto && product.nome_produto.trim() !== ''))
          )
          .map((product: any) => ({
            ...product,
            imagem: product.imagem?.startsWith('blob:') ? '' : product.imagem,
            imagem_fornecedor: product.imagem_fornecedor?.startsWith('blob:') ? '' : product.imagem_fornecedor
          }));
        
        // Se houve limpeza, atualizar o sessionStorage
        if (cleanedData.length !== data.length) {
          console.log(`🧹 Removidos ${data.length - cleanedData.length} itens inválidos incluindo PROD-29`);
          sessionStorage.setItem('cotacao-produtos', JSON.stringify(cleanedData));
        }
        
        return cleanedData;
      }
      return [];
    } catch {
      return [];
    }
  });
  const [hasImportedData, setHasImportedData] = useState(() => {
    try {
      const savedData = sessionStorage.getItem('cotacao-produtos');
      return savedData ? JSON.parse(savedData).length > 0 : false;
    } catch {
      return false;
    }
  });
  
  // Estado para moeda selecionada no resumo
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    try {
      return sessionStorage.getItem('cotacao-selected-currency') || 'CNY';
    } catch {
      return 'CNY';
    }
  });
  
  // Estado para tipo de contêiner selecionado com persistência
  const [selectedContainer, setSelectedContainer] = useState<string>(() => {
    try {
      return sessionStorage.getItem('cotacao-selected-container') || '20';
    } catch {
      return '20';
    }
  });
  
  // Estado para dialog de importação
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // Hook do toast
  const { toast } = useToast();
  
  // Tipos de contêineres disponíveis
  const CONTAINER_TYPES = {
    '20': { name: "20' Dry", volume: 33.2, maxWeight: 28130 },
    '40': { name: "40' Dry", volume: 67.7, maxWeight: 28750 }
  };
  
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
    console.log('🔘 [DEBUG] Selecionando produto:', { productId, checked, currentSelected: selectedProducts });
    if (checked) {
      setSelectedProducts(prev => {
        const newSelected = [...prev, productId];
        console.log('✅ [DEBUG] Produtos selecionados após adicionar:', newSelected);
        return newSelected;
      });
    } else {
      setSelectedProducts(prev => {
        const newSelected = prev.filter(id => id !== productId);
        console.log('❌ [DEBUG] Produtos selecionados após remover:', newSelected);
        return newSelected;
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Usar displayProducts em vez de selectedCotacao.produtos
      setSelectedProducts(displayProducts.map((_, index) => index.toString()));
    } else {
      setSelectedProducts([]);
    }
  };

  // Função para excluir produtos selecionados
  const handleDeleteSelectedProducts = () => {
    if (selectedProducts.length === 0) return;
    
    // Filtrar produtos que não estão selecionados
    const updatedProducts = displayProducts.filter((_, index) => 
      !selectedProducts.includes(index.toString())
    );
    
    // Atualizar o estado
    setProductData(updatedProducts);
    setSelectedProducts([]);
    
    // CRITICAL: Marcar que dados foram importados/editados para não voltar ao mock
    setHasImportedData(true);
    
    // Salvar no sessionStorage (removendo URLs blob inválidas)
    try {
      const cleanedProducts = updatedProducts.map(product => ({
        ...product,
        imagem: product.imagem?.startsWith('blob:') ? '' : product.imagem,
        imagem_fornecedor: product.imagem_fornecedor?.startsWith('blob:') ? '' : product.imagem_fornecedor
      }));
      sessionStorage.setItem('cotacao-produtos', JSON.stringify(cleanedProducts));
    } catch (error) {
      console.warn('Erro ao salvar no sessionStorage:', error);
    }
    
    toast({
      title: "Produtos excluídos",
      description: `${selectedProducts.length} produto(s) foram excluídos com sucesso.`,
    });
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

  const getMultiplicadorReaisValue = () => {
    const value = parseFloat(multiplicadorReais);
    return value > 0 ? value : 5.44;
  };

  const getMultiplicadorReaisTotalValue = () => {
    const value = parseFloat(multiplicadorReaisTotal);
    return value > 0 ? value : 5.44;
  };

  // Effect para recalcular produtos quando divisores/multiplicadores mudarem
  useEffect(() => {
    if (productData.length > 0) {
      const updatedProducts = productData.map(product => ({
        ...product,
        change_dolar: (product.preco || 0) / getChangeDolarDivisorValue(),
        change_dolar_total: (product.valor_total || 0) / getChangeDolarTotalDivisorValue(),
        multiplicador_reais: (product.preco || 0) * getMultiplicadorReaisValue(),
        multiplicador_reais_total: ((product.valor_total || 0) / getChangeDolarTotalDivisorValue()) * getMultiplicadorReaisTotalValue()
      }));
      
      setProductData(updatedProducts);
      
      // Salvar no sessionStorage
      try {
        const cleanedProducts = updatedProducts.map(product => ({
          ...product,
          imagem: product.imagem?.startsWith('blob:') ? '' : product.imagem,
          imagem_fornecedor: product.imagem_fornecedor?.startsWith('blob:') ? '' : product.imagem_fornecedor
        }));
        sessionStorage.setItem('cotacao-produtos', JSON.stringify(cleanedProducts));
      } catch (error) {
        console.warn('Erro ao salvar no sessionStorage:', error);
      }
    }
  }, [changeDolarDivisor, changeDolarTotalDivisor, multiplicadorReais, multiplicadorReaisTotal]);

  // Funções para edição inline
  const startEditing = useCallback((rowIndex: number, field: string) => {
    setEditingCell({ row: rowIndex, field });
  }, []);

  const stopEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  // Identificar campos editáveis (excluir calculados)
  const editableFields = [
    'sku', 'material', 'cor', 'nome_produto', 'package', 'preco', 'unit', 
    'pcs_ctn', 'caixas', 'peso_unitario_g', 'comprimento', 'largura', 
    'altura', 'cbm_cubagem', 'cbm_total', 'obs'
  ];

  const isFieldEditable = useCallback((field: string) => {
    return editableFields.includes(field);
  }, []);

  const getFieldType = useCallback((field: string) => {
    const numberFields = [
      'preco', 'pcs_ctn', 'caixas', 'peso_unitario_g', 'comprimento', 
      'largura', 'altura', 'cbm_cubagem', 'cbm_total'
    ];
    return numberFields.includes(field) ? 'number' : 'text';
  }, []);

  // Função para obter símbolo da moeda
  const getCurrencySymbol = useCallback((currencyCode: string) => {
    const currency = AVAILABLE_CURRENCIES.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  }, []);

  // Usar apenas productData - sem dados de exemplo
  const displayProducts = productData;
  
  // Remover logs excessivos que causam loop infinito

  // Função para atualizar dados do produto
  const updateProductData = useCallback((rowIndex: number, field: string, value: string | number) => {
    const currentProducts = productData;
    const updatedProducts = [...currentProducts];
    updatedProducts[rowIndex] = {
      ...updatedProducts[rowIndex],
      [field]: value
    };
    
    // Recalcular campos automáticos
    const product = updatedProducts[rowIndex];
    
    // Recalcular campos que dependem dos valores editados
    if (['peso_unitario_g', 'pcs_ctn'].includes(field)) {
      product.peso_cx_master_kg = (product.peso_unitario_g * product.pcs_ctn) / 1000;
      product.peso_sem_cx_master_kg = product.peso_cx_master_kg - 1;
      product.peso_total_cx_master_kg = product.peso_cx_master_kg * product.caixas;
      product.peso_total_sem_cx_master_kg = (product.peso_cx_master_kg - 1) * product.caixas;
    }
    
    if (['preco', 'pcs_ctn', 'caixas'].includes(field)) {
      product.quantidade_total = product.pcs_ctn * product.caixas;
      product.valor_total = product.preco * product.quantidade_total;
    }
    
    // Recalcular CBM Total quando CBM Cubagem ou CAIXAS mudarem
    if (['cbm_cubagem', 'caixas'].includes(field)) {
      product.cbm_total = product.cbm_cubagem * product.caixas;
    }
    
    // Recalcular Peso Total cx Master quando Peso cx Master ou CAIXAS mudarem
    if (['peso_cx_master_kg', 'caixas'].includes(field)) {
      product.peso_total_cx_master_kg = product.peso_cx_master_kg * product.caixas;
      product.peso_total_sem_cx_master_kg = (product.peso_cx_master_kg - 1) * product.caixas;
    }
    
    // Recalcular campos calculados automaticamente
    product.change_dolar = product.preco / getChangeDolarDivisorValue();
    product.change_dolar_total = product.valor_total / getChangeDolarTotalDivisorValue();
    product.multiplicador_reais = product.preco * getMultiplicadorReaisValue();
    product.multiplicador_reais_total = (product.valor_total / getChangeDolarTotalDivisorValue()) * getMultiplicadorReaisTotalValue();
    
    setProductData(updatedProducts);
    stopEditing();
    
    // Salvar no sessionStorage (removendo URLs blob inválidas)
    try {
      const cleanedProducts = updatedProducts.map(product => ({
        ...product,
        imagem: product.imagem?.startsWith('blob:') ? '' : product.imagem,
        imagem_fornecedor: product.imagem_fornecedor?.startsWith('blob:') ? '' : product.imagem_fornecedor
      }));
      sessionStorage.setItem('cotacao-produtos', JSON.stringify(cleanedProducts));
    } catch (error) {
      console.warn('Erro ao salvar no sessionStorage:', error);
    }
  }, [productData, getChangeDolarDivisorValue, getChangeDolarTotalDivisorValue, getMultiplicadorReaisValue, getMultiplicadorReaisTotalValue, stopEditing]);

  // Funções para calcular totais das colunas
  const getTotalValorTotal = useCallback(() => {
    return displayProducts.reduce((total, product) => {
      return total + (product.valor_total || 0);
    }, 0);
  }, [displayProducts]);

  const getTotalChangeDolarTotal = useCallback(() => {
    const total = displayProducts.reduce((total, product) => {
      return total + (product.change_dolar_total || 0);
    }, 0);
    return total;
  }, [displayProducts]);

  const getTotalMultiplicadorReaisTotal = useCallback(() => {
    const total = displayProducts.reduce((total, product) => {
      return total + (product.multiplicador_reais_total || 0);
    }, 0);
    return total;
  }, [displayProducts]);

  // Função para calcular peso total
  const getTotalWeight = useCallback(() => {
    return displayProducts.reduce((total, product) => {
      return total + (product.peso_total_cx_master_kg || 0);
    }, 0);
  }, [displayProducts]);

  // Função para calcular CBM total
  const getTotalCBM = useCallback(() => {
    return displayProducts.reduce((total, product) => {
      return total + (product.cbm_total || 0);
    }, 0);
  }, [displayProducts]);

  // Função para calcular percentual de utilização
  const getContainerUsage = useCallback((type: 'volume' | 'weight') => {
    const container = CONTAINER_TYPES[selectedContainer];
    if (type === 'volume') {
      const totalCBM = getTotalCBM();
      return Math.min((totalCBM / container.volume) * 100, 100);
    } else {
      const totalWeight = getTotalWeight();
      return Math.min((totalWeight / container.maxWeight) * 100, 100);
    }
  }, [selectedContainer, getTotalCBM, getTotalWeight]);

  // Função para verificar se excede limites
  const isOverLimit = useCallback((type: 'volume' | 'weight') => {
    return getContainerUsage(type) >= 100;
  }, [getContainerUsage]);
  
  // Função para lidar com dados importados
  const handleImportSuccess = useCallback((dadosImportados: any[]) => {
    console.log('📥 [DEBUG] Dados recebidos na importação:', dadosImportados);
    console.log('📥 [DEBUG] Estrutura do primeiro produto:', dadosImportados[0]);
    console.log('📥 [DEBUG] Campos disponíveis:', Object.keys(dadosImportados[0] || {}));
    
    if (!dadosImportados || dadosImportados.length === 0) {
      console.error('❌ [DEBUG] Nenhum dado para importar');
      toast({
        title: "Erro na importação",
        description: "Nenhum dado foi recebido para importação.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('📋 [IMPORT] Processando dados sem correção de desalinhamento. Total de produtos:', dadosImportados.length);
    
    // Mapear dados importados para o formato esperado (SEM correção de desalinhamento)
    const novosProdutos = dadosImportados.map((produto, index) => {
      console.log(`📋 [DEBUG] Processando produto ${index}:`, produto);
      
      const produtoMapeado = {
        ...produto,
        id: `import-${index}`,
        // Garantir que todas as propriedades necessárias existem
         sku: produto.sku || `PROD-${index + 1}`,
         imagem: produto.imagem || '', // Usar imagem original sem correção
         imagem_fornecedor: produto.imagem_fornecedor || '', // Manter a original do fornecedor
        nome_produto: produto.nome_produto || produto.nome || '',
        material: produto.material || '',
        cor: produto.cor || '',
        package: produto.package || '',
        preco: Number(produto.preco) || Number(produto.preco_unitario) || 0,
        unit: produto.unit || 'pc',
        pcs_ctn: Number(produto.pcs_ctn) || 0,
        caixas: Number(produto.caixas) || Number(produto.quantidade_total_calc) || 1,
        peso_unitario_g: Number(produto.peso_unitario_g) || 0,
        peso_cx_master_kg: Number(produto.peso_cx_master_kg) || 0,
        peso_sem_cx_master_kg: Number(produto.peso_sem_cx_master_kg) || 0,
        peso_total_cx_master_kg: Number(produto.peso_total_cx_master_kg) || 0,
        peso_total_sem_cx_master_kg: Number(produto.peso_total_sem_cx_master_kg) || 0,
        comprimento: Number(produto.comprimento) || 0,
        largura: Number(produto.largura) || 0,
        altura: Number(produto.altura) || 0,
        cbm_cubagem: Number(produto.cbm_cubagem) || 0,
        cbm_total: Number(produto.cbm_total) || Number(produto.cbm_total_calc) || 0,
        quantidade_total: Number(produto.quantidade_total) || Number(produto.quantidade_total_calc) || 0,
        valor_total: Number(produto.valor_total) || 0,
        obs: produto.obs || '',
        change_dolar: Number(produto.change_dolar) || 0,
        multiplicador_reais: Number(produto.multiplicador_reais) || 0,
        // Campos calculados
        change_dolar_total: Number(produto.change_dolar_total) || 0,
        multiplicador_reais_total: Number(produto.multiplicador_reais_total) || 0,
      };
      
      return produtoMapeado;
    });
    // Recalcular campos automaticamente para todos os produtos
    const produtosComCalculos = novosProdutos.map(produto => ({
      ...produto,
      change_dolar: (produto.preco || 0) / getChangeDolarDivisorValue(),
      change_dolar_total: (produto.valor_total || 0) / getChangeDolarTotalDivisorValue(),
      multiplicador_reais: (produto.preco || 0) * getMultiplicadorReaisValue(),
      multiplicador_reais_total: ((produto.valor_total || 0) / getChangeDolarTotalDivisorValue()) * getMultiplicadorReaisTotalValue()
    }));
    
    setProductData(produtosComCalculos);
    setHasImportedData(true); // Marcar que dados foram importados
    
    // Salvar no sessionStorage para persistir entre navegações (removendo URLs blob inválidas)
    try {
      const cleanedProducts = produtosComCalculos.map(product => ({
        ...product,
        imagem: product.imagem?.startsWith('blob:') ? '' : product.imagem,
        imagem_fornecedor: product.imagem_fornecedor?.startsWith('blob:') ? '' : product.imagem_fornecedor
      }));
      sessionStorage.setItem('cotacao-produtos', JSON.stringify(cleanedProducts));
    } catch (error) {
      console.warn('Erro ao salvar no sessionStorage:', error);
    }
    
    // Força atualização da UI
    setTimeout(() => {
      if (productData.length === 0 && novosProdutos.length > 0) {
        setProductData([...novosProdutos]); // força nova referência
      }
    }, 100);
    
    toast({
      title: "Importação concluída!",
      description: `${novosProdutos.length} produtos importados com sucesso.`,
    });
  }, [toast]);

  // Função para converter imagem URL para base64
  const imageUrlToBase64 = async (url: string): Promise<string> => {
    try {
      if (!url || url.startsWith('blob:')) return '';
      
      // Se a URL já é base64, extrair apenas os dados
      if (url.startsWith('data:')) {
        return url.split(',')[1];
      }
      
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]); // Remove o prefixo data:image/...;base64,
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Erro ao converter imagem para base64:', error);
      return '';
    }
  };

  // Função para download do Excel com imagens
  const handleDownloadExcel = async () => {
    try {
      toast({
        title: "Preparando download...",
        description: "Processando imagens e gerando planilha Excel.",
      });

      // Criar workbook usando ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Cotação');

      // Definir cabeçalhos
      const headers = [
        'SKU', 'Imagem', 'Imagem Fornecedor', 'Material', 'Cor', 'Nome do Produto', 
        'Package', 'Preço', 'Unid.', 'PCS/CTN', 'Caixas', 'Peso Unit. (g)', 
        'Peso Emb. Master (KG)', 'Peso S/ Emb. Master (KG)', 'Peso Total Emb. (KG)', 
        'Peso Total S/ Emb. (KG)', 'Comp. (cm)', 'Larg. (cm)', 'Alt. (cm)', 
        'CBM Cubagem', 'CBM Total', 'Qtd. Total', 'Valor Total', 'Obs.'
      ];

      // Adicionar cabeçalho
      worksheet.addRow(headers);

      // Estilizar cabeçalho
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5F3FF' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // Configurar larguras das colunas
      const colWidths = [15, 15, 20, 12, 10, 25, 12, 10, 8, 10, 10, 15, 18, 20, 18, 20, 12, 12, 12, 15, 12, 12, 15, 20];
      headers.forEach((_, index) => {
        worksheet.getColumn(index + 1).width = colWidths[index];
      });

      // Adicionar dados e imagens
      for (let index = 0; index < displayProducts.length; index++) {
        const product = displayProducts[index];
        const rowNumber = index + 2;

        // Criar linha com dados
        const rowData = [
          product.sku || '',
          '', // Imagem - será preenchida após inserir a imagem
          '', // Imagem Fornecedor - será preenchida após inserir a imagem  
          product.material || '',
          product.cor || '',
          product.nome_produto || '',
          product.package || '',
          typeof product.preco === 'number' ? product.preco.toFixed(2) : product.preco || '',
          product.unit || '',
          product.pcs_ctn || 0,
          product.caixas || 0,
          typeof product.peso_unitario_g === 'number' ? product.peso_unitario_g.toFixed(0) : product.peso_unitario_g || '',
          typeof product.peso_cx_master_kg === 'number' ? product.peso_cx_master_kg.toFixed(2) : product.peso_cx_master_kg || '',
          typeof product.peso_sem_cx_master_kg === 'number' ? product.peso_sem_cx_master_kg.toFixed(2) : product.peso_sem_cx_master_kg || '',
          typeof product.peso_total_cx_master_kg === 'number' ? product.peso_total_cx_master_kg.toFixed(2) : product.peso_total_cx_master_kg || '',
          typeof product.peso_total_sem_cx_master_kg === 'number' ? product.peso_total_sem_cx_master_kg.toFixed(2) : product.peso_total_sem_cx_master_kg || '',
          product.comprimento || 0,
          product.largura || 0,
          product.altura || 0,
          typeof product.cbm_cubagem === 'number' ? product.cbm_cubagem.toFixed(2) : product.cbm_cubagem || '',
          typeof product.cbm_total === 'number' ? product.cbm_total.toFixed(2) : product.cbm_total || '',
          product.quantidade_total || 0,
          typeof product.valor_total === 'number' ? product.valor_total.toFixed(2) : product.valor_total || '',
          product.obs || ''
        ];

        worksheet.addRow(rowData);

        // Configurar altura da linha para acomodar imagens
        worksheet.getRow(rowNumber).height = 80;

        // Inserir imagem principal
        if (product.imagem) {
          try {
            const base64 = await imageUrlToBase64(product.imagem);
            if (base64) {
              const imageData = base64.split(',')[1] || base64;
              const imageBuffer = Buffer.from(imageData, 'base64');
              
              const imageId = workbook.addImage({
                buffer: imageBuffer,
                extension: 'png',
              });

              worksheet.addImage(imageId, {
                tl: { col: 1, row: rowNumber - 1 }, // coluna B (index 1)
                ext: { width: 100, height: 60 }
              });

              // Adicionar texto indicativo na célula
              worksheet.getCell(rowNumber, 2).value = '[IMAGEM]';
            }
          } catch (error) {
            console.warn('Erro ao processar imagem:', error);
            worksheet.getCell(rowNumber, 2).value = 'Erro ao carregar';
          }
        }

        // Inserir imagem do fornecedor
        if (product.imagem_fornecedor) {
          try {
            const base64 = await imageUrlToBase64(product.imagem_fornecedor);
            if (base64) {
              const imageData = base64.split(',')[1] || base64;
              const imageBuffer = Buffer.from(imageData, 'base64');
              
              const imageId = workbook.addImage({
                buffer: imageBuffer,
                extension: 'png',
              });

              worksheet.addImage(imageId, {
                tl: { col: 2, row: rowNumber - 1 }, // coluna C (index 2)
                ext: { width: 100, height: 60 }
              });

              // Adicionar texto indicativo na célula
              worksheet.getCell(rowNumber, 3).value = '[IMAGEM]';
            }
          } catch (error) {
            console.warn('Erro ao processar imagem fornecedor:', error);
            worksheet.getCell(rowNumber, 3).value = 'Erro ao carregar';
          }
        }

        // Destacar coluna Caixas (coluna K)
        const caixasCell = worksheet.getCell(rowNumber, 11);
        caixasCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF9C4' }
        };
        caixasCell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Aplicar bordas a todas as células
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Gerar arquivo Excel
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Gerar nome do arquivo com data/hora
      const agora = new Date();
      const dataHora = agora.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
      const nomeArquivo = `cotacao_internacional_${dataHora}.xlsx`;

      // Criar blob e fazer download
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, nomeArquivo);

      toast({
        title: "Download concluído!",
        description: `Planilha ${nomeArquivo} baixada com sucesso.`,
      });

    } catch (error) {
      console.error('Erro no download do Excel:', error);
      toast({
        title: "Erro no download",
        description: "Ocorreu um erro ao gerar a planilha Excel.",
        variant: "destructive",
      });
    }
  };
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
            <CardHeader className="pb-3">
              {/* Layout em duas colunas */}
              <div className="flex gap-6">
                {/* Coluna esquerda - Informações */}
                <div className="bg-slate-800 text-white p-3 rounded-lg w-80">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{selectedCotacao.numero_cotacao}</h3>
                    <Badge className={`text-white ${getStatusColor(selectedCotacao.status)}`}>
                      {selectedCotacao.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{selectedCotacao.descricao}</p>
                  
                   {/* Informações organizadas de forma clara */}
                   <div className="space-y-3 text-xs">
                     {/* País e Moeda em linha única */}
                     <div className="flex items-center justify-between gap-6">
                       <div className="flex items-center gap-2">
                         <span className="text-slate-400">País:</span>
                         <span className="font-medium text-white">{selectedCotacao.pais_origem}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="text-slate-400">Moeda:</span>
                         <Select value={selectedCurrency} onValueChange={(value) => {
                           setSelectedCurrency(value);
                           try {
                             sessionStorage.setItem('cotacao-selected-currency', value);
                           } catch (error) {
                             console.warn('Erro ao salvar moeda no sessionStorage:', error);
                           }
                         }}>
                           <SelectTrigger className="w-20 h-6 text-xs bg-slate-700 border-slate-600">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-background border border-border z-50">
                             {AVAILABLE_CURRENCIES.map((currency) => (
                               <SelectItem key={currency.code} value={currency.code}>
                                 <span className="flex items-center gap-2">
                                   <span>{currency.flag}</span>
                                   <span>{currency.code}</span>
                                 </span>
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                     </div>
              
                     {/* Total na moeda selecionada */}
                     <div className="flex justify-between items-center">
                       <span className="text-slate-400">Total {AVAILABLE_CURRENCIES.find(c => c.code === selectedCurrency)?.name || selectedCurrency}:</span>
                       <div className="font-semibold text-blue-400 text-sm">{getCurrencySymbol(selectedCurrency)} {getTotalValorTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                     </div>
              {hasImportedData && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Filtrar e remover itens inválidos como PROD-29
                    const produtosFiltrados = productData.filter(produto => 
                      produto.sku && 
                      produto.sku !== 'PROD-29' && 
                      !produto.sku.startsWith('PROD-') || 
                      (produto.sku.startsWith('PROD-') && produto.nome_produto && produto.nome_produto.trim() !== '')
                    );
                    
                    setProductData(produtosFiltrados);
                    
                    // Atualizar sessionStorage
                    try {
                      const cleanedProducts = produtosFiltrados.map(product => ({
                        ...product,
                        imagem: product.imagem?.startsWith('blob:') ? '' : product.imagem,
                        imagem_fornecedor: product.imagem_fornecedor?.startsWith('blob:') ? '' : product.imagem_fornecedor
                      }));
                      sessionStorage.setItem('cotacao-produtos', JSON.stringify(cleanedProducts));
                    } catch (error) {
                      console.warn('Erro ao salvar no sessionStorage:', error);
                    }
                    
                    toast({
                      title: "Limpeza concluída",
                      description: `Produtos inválidos removidos. ${produtosFiltrados.length} produtos restantes.`
                    });
                  }}
                  className="gap-1"
                >
                  🧹 Limpar Dados Inválidos
                </Button>
              )}
              
                      {/* Total USD em linha separada */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total USD:</span>
                        <div className="font-semibold text-green-400 text-sm">$ {(() => {
                          const totalOrigemValue = getTotalValorTotal();
                          const { valorUSD } = converterMoeda(totalOrigemValue, selectedCurrency, 1);
                          return valorUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}</div>
                      </div>
                      
                      {/* Total BRL em linha separada */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total BRL:</span>
                        <div className="font-semibold text-orange-400 text-sm">R$ {(() => {
                          const totalOrigemValue = getTotalValorTotal();
                          const { valorBRL } = converterMoeda(totalOrigemValue, selectedCurrency, 1);
                          return valorBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}</div>
                      </div>
                   </div>
                </div>
                
                {/* Coluna direita - Container Visualization */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Simulação de Contêiner</h4>
                    <div className="w-36">
                      <Select value={selectedContainer} onValueChange={(value) => {
                        setSelectedContainer(value);
                        try {
                          sessionStorage.setItem('cotacao-selected-container', value);
                        } catch (error) {
                          console.warn('Erro ao salvar container no sessionStorage:', error);
                        }
                      }}>
                        <SelectTrigger className="w-full h-6 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50">
                          {Object.entries(CONTAINER_TYPES).map(([key, container]) => (
                            <SelectItem key={key} value={key}>
                              {container.name} ({container.volume}m³, {container.maxWeight.toLocaleString()}kg)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <ContainerVisualization
                    containerType={CONTAINER_TYPES[selectedContainer].name}
                    volumePercentage={getContainerUsage('volume')}
                    weightPercentage={getContainerUsage('weight')}
                    totalCBM={getTotalCBM()}
                    totalWeight={getTotalWeight()}
                    maxVolume={CONTAINER_TYPES[selectedContainer].volume}
                    maxWeight={CONTAINER_TYPES[selectedContainer].maxWeight}
                  />
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
                    {selectedProducts.length > 0 && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleDeleteSelectedProducts}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Selecionados ({selectedProducts.length})
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowImportDialog(true)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Importar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDownloadExcel}
                      disabled={displayProducts.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
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
                    <TableRow className="bg-muted/50 border-b-2 border-border">
                      <TableHead className="w-[50px] h-12 text-center">
                         <input 
                           type="checkbox"
                           checked={selectedProducts.length === displayProducts.length && displayProducts.length > 0}
                           onChange={(e) => handleSelectAll(e.target.checked)}
                           className="rounded"
                         />
                      </TableHead>
                      <TableHead className="min-w-[100px] h-12 font-semibold text-sm">SKU</TableHead>
                      <TableHead className="min-w-[120px] h-12 font-semibold text-sm text-center">Imagem</TableHead>
                      <TableHead className="min-w-[150px] h-12 font-semibold text-sm text-center">Imagem Fornecedor</TableHead>
                      <TableHead className="min-w-[100px] h-12 font-semibold text-sm">Material</TableHead>
                      <TableHead className="min-w-[80px] h-12 font-semibold text-sm text-center">Cor</TableHead>
                      <TableHead className="min-w-[200px] h-12 font-semibold text-sm">Nome do Produto</TableHead>
                      <TableHead className="min-w-[100px] h-12 font-semibold text-sm text-center">Package</TableHead>
                      <TableHead className="min-w-[80px] h-12 font-semibold text-sm text-right">Preço</TableHead>
                      <TableHead className="min-w-[60px] h-12 font-semibold text-sm text-center">Unid.</TableHead>
                      <TableHead className="min-w-[80px] h-12 font-semibold text-sm text-center">PCS/CTN</TableHead>
                      <TableHead className="min-w-[80px] h-12 font-semibold text-sm text-center bg-accent/20">Caixas</TableHead>
                      <TableHead className="min-w-[120px] h-12 font-semibold text-sm text-right">Peso Unit. (g)</TableHead>
                      <TableHead className="min-w-[100px] h-12 font-semibold text-xs text-center">Peso Emb. Master (KG)</TableHead>
                      <TableHead className="min-w-[110px] h-12 font-semibold text-xs text-center">Peso S/ Emb. Master (KG)</TableHead>
                      <TableHead className="min-w-[110px] h-12 font-semibold text-xs text-center">Peso Total Emb. (KG)</TableHead>
                      <TableHead className="min-w-[120px] h-12 font-semibold text-xs text-center">Peso Total S/ Emb. (KG)</TableHead>
                      <TableHead className="min-w-[100px] h-12 font-semibold text-sm text-center">Comp. (cm)</TableHead>
                      <TableHead className="min-w-[80px] h-12 font-semibold text-sm text-center">Larg. (cm)</TableHead>
                      <TableHead className="min-w-[80px] h-12 font-semibold text-sm text-center">Alt. (cm)</TableHead>
                      <TableHead className="min-w-[120px] h-12 font-semibold text-sm text-center">CBM Cubagem</TableHead>
                      <TableHead className="min-w-[100px] h-12 font-semibold text-sm text-center">CBM Total</TableHead>
                      <TableHead className="min-w-[120px] h-12 font-semibold text-sm text-center">Qtd. Total</TableHead>
                      <TableHead className="min-w-[120px] h-12 font-semibold text-sm text-right">Valor Total</TableHead>
                      <TableHead className="min-w-[100px] h-12 font-semibold text-sm text-center">Obs.</TableHead>
                      <TableHead className="min-w-[120px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium">Change DOLAR Uni</span>
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
                            <span className="text-xs font-medium">Change DOLAR Total</span>
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
                      <TableHead className="min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium">Multiplicador REAIS Uni</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>PREÇO × Multiplicador</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            type="number"
                            placeholder="Multiplicador"
                            value={multiplicadorReais}
                            onChange={(e) => setMultiplicadorReais(e.target.value)}
                            className="h-6 text-xs"
                            step="0.01"
                            min="0.01"
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium">Multiplicador REAIS Total</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Change DOLAR Total × Multiplicador</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            type="number"
                            placeholder="Multiplicador"
                            value={multiplicadorReaisTotal}
                            onChange={(e) => setMultiplicadorReaisTotal(e.target.value)}
                            className="h-6 text-xs"
                            step="0.01"
                            min="0.01"
                          />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {displayProducts.map((product: any, index: number) => (
                       <TableRow key={index} className="hover:bg-muted/30 border-b border-border/50">
                         <TableCell className="text-center py-3">
                           <input 
                             type="checkbox"
                             checked={selectedProducts.includes(index.toString())}
                             onChange={(e) => handleSelectProduct(index.toString(), e.target.checked)}
                             className="rounded"
                           />
                         </TableCell>
                         <TableCell className="font-mono text-sm py-3">
                           <EditableCell
                             value={product.sku}
                             type="text"
                             onSave={(value) => updateProductData(index, 'sku', value)}
                             onCancel={stopEditing}
                             isEditing={editingCell?.row === index && editingCell?.field === 'sku'}
                             onDoubleClick={() => startEditing(index, 'sku')}
                           />
                         </TableCell>
                          <TableCell className="text-center py-3">
                            <ProdutoImagemPreview
                              imagemUrl={product.imagem}
                              nomeProduto={product.nome_produto || product.sku}
                              sku={product.sku}
                              className="mx-auto"
                            />
                          </TableCell>
                         <TableCell className="text-center py-3">
                           <ProdutoImagemPreview
                             imagemUrl={product.imagem_fornecedor}
                             nomeProduto={product.nome_produto || product.sku}
                             sku={product.sku}
                             className="mx-auto"
                           />
                         </TableCell>
                         <TableCell className="py-3">
                           <EditableCell
                             value={product.material}
                             type="text"
                             onSave={(value) => updateProductData(index, 'material', value)}
                             onCancel={stopEditing}
                             isEditing={editingCell?.row === index && editingCell?.field === 'material'}
                             onDoubleClick={() => startEditing(index, 'material')}
                           />
                         </TableCell>
                         <TableCell className="text-center py-3">
                           <EditableCell
                             value={product.cor}
                             type="text"
                             onSave={(value) => updateProductData(index, 'cor', value)}
                             onCancel={stopEditing}
                             isEditing={editingCell?.row === index && editingCell?.field === 'cor'}
                             onDoubleClick={() => startEditing(index, 'cor')}
                           />
                         </TableCell>
                         <TableCell className="max-w-[200px] py-3">
                           <EditableCell
                             value={product.nome_produto}
                             type="text"
                             onSave={(value) => updateProductData(index, 'nome_produto', value)}
                             onCancel={stopEditing}
                             isEditing={editingCell?.row === index && editingCell?.field === 'nome_produto'}
                             onDoubleClick={() => startEditing(index, 'nome_produto')}
                           />
                         </TableCell>
                         <TableCell className="text-center py-3">
                           <EditableCell
                             value={product.package}
                             type="text"
                             onSave={(value) => updateProductData(index, 'package', value)}
                             onCancel={stopEditing}
                             isEditing={editingCell?.row === index && editingCell?.field === 'package'}
                             onDoubleClick={() => startEditing(index, 'package')}
                           />
                         </TableCell>
                         <TableCell className="text-right py-3">
                           <EditableCell
                             value={product.preco}
                             type="number"
                             prefix={`${getCurrencySymbol(selectedCurrency)} `}
                             step="0.01"
                             onSave={(value) => updateProductData(index, 'preco', value)}
                             onCancel={stopEditing}
                             isEditing={editingCell?.row === index && editingCell?.field === 'preco'}
                             onDoubleClick={() => startEditing(index, 'preco')}
                           />
                         </TableCell>
                         <TableCell className="text-center py-3">
                           <EditableCell
                             value={product.unit}
                             type="text"
                             onSave={(value) => updateProductData(index, 'unit', value)}
                             onCancel={stopEditing}
                             isEditing={editingCell?.row === index && editingCell?.field === 'unit'}
                             onDoubleClick={() => startEditing(index, 'unit')}
                           />
                         </TableCell>
                         <TableCell className="text-center py-3">
                           <EditableCell
                             value={product.pcs_ctn}
                             type="number"
                             onSave={(value) => updateProductData(index, 'pcs_ctn', value)}
                             onCancel={stopEditing}
                             isEditing={editingCell?.row === index && editingCell?.field === 'pcs_ctn'}
                             onDoubleClick={() => startEditing(index, 'pcs_ctn')}
                           />
                         </TableCell>
                         <TableCell className="bg-accent/20 text-center py-3 font-medium">
                           <EditableCell
                             value={product.caixas}
                             type="number"
                             onSave={(value) => updateProductData(index, 'caixas', value)}
                             onCancel={stopEditing}
                             isEditing={editingCell?.row === index && editingCell?.field === 'caixas'}
                             onDoubleClick={() => startEditing(index, 'caixas')}
                           />
                         </TableCell>
                         <TableCell className="text-right py-3 font-mono text-sm">{(product.peso_unitario_g || 0).toFixed(0)}g</TableCell>
                         <TableCell className="text-center py-3 text-sm">{(product.peso_cx_master_kg || 0).toFixed(2)}</TableCell>
                         <TableCell className="text-center py-3 text-sm">{(product.peso_sem_cx_master_kg || 0).toFixed(2)}</TableCell>
                         <TableCell className="text-center py-3 text-sm">{(product.peso_total_cx_master_kg || 0).toFixed(2)}</TableCell>
                         <TableCell className="text-center py-3 text-sm">{(product.peso_total_sem_cx_master_kg || 0).toFixed(2)}</TableCell>
                         <TableCell className="text-center py-3">{product.comprimento || 0}</TableCell>
                         <TableCell className="text-center py-3">{product.largura || 0}</TableCell>
                         <TableCell className="text-center py-3">{product.altura || 0}</TableCell>
                         <TableCell className="text-center py-3">{(product.cbm_cubagem || 0).toFixed(2)}</TableCell>
                         <TableCell className="text-center py-3">{(product.cbm_total || 0).toFixed(2)}</TableCell>
                         <TableCell className="text-center py-3 font-medium">{product.quantidade_total || 0}</TableCell>
                         <TableCell className="text-right py-3 font-medium">{getCurrencySymbol(selectedCurrency)} {(product.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                         <TableCell className="text-center py-3">{product.obs}</TableCell>
                          <TableCell className="text-right py-3 font-mono text-sm">$ {product.change_dolar.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                         <TableCell className="text-right py-3 font-mono text-sm">$ {product.change_dolar_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right py-3 font-mono text-sm">R$ {product.multiplicador_reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                           <TableCell className="text-right py-3 font-mono text-sm">R$ {product.multiplicador_reais_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                   <TableFooter>
                    <TableRow className="bg-accent/50 font-bold text-sm">
                      <TableCell></TableCell> {/* Checkbox */}
                      <TableCell></TableCell> {/* SKU */}
                      <TableCell></TableCell> {/* Imagem */}
                      <TableCell></TableCell> {/* Imagem Fornecedor */}
                      <TableCell></TableCell> {/* Material */}
                      <TableCell></TableCell> {/* Cor */}
                      <TableCell></TableCell> {/* Nome do Produto */}
                      <TableCell></TableCell> {/* Package */}
                      <TableCell></TableCell> {/* Preço */}
                      <TableCell></TableCell> {/* Unid. */}
                      <TableCell></TableCell> {/* PCS/CTN */}
                      <TableCell></TableCell> {/* Caixas */}
                      <TableCell></TableCell> {/* Peso Unit. (g) */}
                      <TableCell></TableCell> {/* Peso Emb. Master (KG) */}
                      <TableCell className="text-center font-bold">{displayProducts.reduce((sum, p) => sum + (p.peso_total_cx_master_kg || 0), 0).toFixed(2)}</TableCell> {/* Peso Total Emb. (KG) */}
                      <TableCell className="text-center font-bold">{displayProducts.reduce((sum, p) => sum + (p.peso_total_sem_cx_master_kg || 0), 0).toFixed(2)}</TableCell> {/* Peso Total S/ Emb. (KG) */}
                      <TableCell></TableCell> {/* Comp. (cm) */}
                      <TableCell></TableCell> {/* Larg. (cm) */}
                      <TableCell></TableCell> {/* Alt. (cm) */}
                      <TableCell></TableCell> {/* CBM Cubagem */}
                      <TableCell className="text-center font-bold">{displayProducts.reduce((sum, p) => sum + (p.cbm_total || 0), 0).toFixed(2)}</TableCell> {/* CBM Total */}
                      <TableCell className="text-center font-bold">{displayProducts.reduce((sum, p) => sum + (p.quantidade_total || 0), 0)}</TableCell> {/* Qtd. Total */}
                       <TableCell className="text-right font-bold">{getCurrencySymbol(selectedCurrency)} {getTotalValorTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> {/* Valor Total */}
                       <TableCell></TableCell> {/* Obs. */}
                       <TableCell className="text-right font-bold">$ {displayProducts.reduce((sum, p) => sum + (p.change_dolar || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> {/* Change DOLAR Uni */}
                       <TableCell className="text-right font-bold">$ {getTotalChangeDolarTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> {/* Change DOLAR Total */}
                       <TableCell className="text-right font-bold">R$ {displayProducts.reduce((sum, p) => sum + (p.multiplicador_reais || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> {/* Multiplicador REAIS Uni */}
                       <TableCell className="text-right font-bold">R$ {getTotalMultiplicadorReaisTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> {/* Multiplicador REAIS Total */}
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
              
              {displayProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto importado. Use o botão "Importar" para carregar dados de um arquivo Excel.
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
      {/* Dialog de Importação */}
      <CotacaoImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        cotacao={null}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};