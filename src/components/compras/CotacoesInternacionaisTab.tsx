// src/components/compras/CotacoesInternacionaisTab.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SessionStorageManager } from '@/utils/sessionStorageManager';
import { ErrorHandler } from '@/utils/errorHandler';
import { 
  validateCotacoes, 
  sanitizeProduto, 
  calculateCotacaoTotals, 
  validateProdutoData,
  type CotacaoInternacional as CotacaoInternacionalType,
  type ProdutoCotacao as ProdutoCotacaoType
} from '@/utils/cotacaoTypeGuards';
import { useSecureCotacoes } from '@/hooks/useSecureCotacoes';
import { validateFileUpload, sanitizeInput, logSecurityEvent } from '@/utils/inputValidation';
import { useImageUpload } from '@/hooks/useImageUpload';
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
const CotacaoImportDialog = React.lazy(() => import('./CotacaoImportDialog').then(m => ({ default: m.CotacaoImportDialog })));
import { ImageComparisonModal } from './ImageComparisonModal';
import { ProdutoImagemPreview } from './ProdutoImagemPreview';
import { CotacaoCard } from './cotacoes/CotacaoCard';
import { CotacaoHeader } from './cotacoes/CotacaoHeader';
import { EmptyState } from './cotacoes/EmptyState';
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
import { ProductSelector } from './ProductSelector';
import { useCotacoesInternacionais } from '@/hooks/useCotacoesInternacionais';
import { useToastFeedback } from '@/hooks/useToastFeedback';
import { useCompatibleToast } from '@/utils/toastUtils';
import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import { usePersistentCalculators } from '@/hooks/usePersistentCalculators';
import { useMultipleSelection } from '@/hooks/useMultipleSelection';
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

// Usar tipos do utilitário para evitar duplicação
type CotacaoInternacional = CotacaoInternacionalType;
type ProdutoCotacao = ProdutoCotacaoType;

interface CotacoesInternacionaisTabProps {
  cotacoes: CotacaoInternacional[];
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

export const CotacoesInternacionaisTab: React.FC<CotacoesInternacionaisTabProps> = ({
  cotacoes,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [selectedCotacao, setSelectedCotacao] = useState<CotacaoInternacional | null>(null);
  const [showNewCotacaoDialog, setShowNewCotacaoDialog] = useState(false);
  const [newCotacaoData, setNewCotacaoData] = useState({
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
  
  // Estados para seleção de produtos na tabela
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  // Ref para controlar auto-save
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isSavingAuto, setIsSavingAuto] = useState(false);
  
  // Estados para edição inline
  const [editingCell, setEditingCell] = useState<{row: number, field: string} | null>(null);
  const [productData, setProductData] = useState<any[]>(() => {
    const loaded = SessionStorageManager.loadProducts();
    return loaded;
  });
  
  // Monitor de mudanças no productData
  useEffect(() => {
    if (productData.length > 0) {
      console.log('✓ Produtos carregados:', productData.length);
    }
  }, [productData]);
  
  const [hasImportedData, setHasImportedData] = useState(() => {
    const products = SessionStorageManager.loadProducts();
    return products.length > 0;
  });
  
  // Estado para moeda selecionada no resumo
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    return SessionStorageManager.loadCurrency('CNY');
  });
  
  // Estado para tipo de contêiner selecionado com persistência
  const [selectedContainer, setSelectedContainer] = useState<string>(() => {
    return SessionStorageManager.loadContainer('20');
  });
  
  // Estado para dialog de importação
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // Estado para modal de comparação de imagens
  const [imageComparisonModal, setImageComparisonModal] = useState<{
    isOpen: boolean;
    imagemPrincipal?: string;
    imagemFornecedor?: string;
    observacoes?: string;
    produtoInfo?: {
      sku?: string;
      nome_produto?: string;
      rowIndex: number;
    };
  }>({
    isOpen: false,
    imagemPrincipal: '',
    imagemFornecedor: '',
    observacoes: '',
    produtoInfo: undefined
  });
  
  // Hook do toast
  const { toast } = useCompatibleToast();
  
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

  // Hooks customizados
  const { rates, updateRates, loading: ratesLoading, lastUpdate } = useCurrencyRates();
  const { getCotacoesInternacionais } = useCotacoesInternacionais();
  const { 
    secureCreateCotacao, 
    secureUpdateCotacao, 
    secureDeleteCotacao,
    silentCreateCotacao,
    silentUpdateCotacao,
    loading: saveLoading 
  } = useSecureCotacoes();
  const { uploadImage, uploading: imageUploading } = useImageUpload();
  const {
    changeDolarDivisor,
    setChangeDolarDivisor,
    changeDolarTotalDivisor,
    setChangeDolarTotalDivisor,
    multiplicadorReais,
    setMultiplicadorReais,
    multiplicadorReaisTotal,
    setMultiplicadorReaisTotal
  } = usePersistentCalculators();
  const {
    selectedIds: selectedCotacoes,
    isSelectMode,
    toggleSelectMode,
    selectItem: selectCotacao,
    selectAll: selectAllCotacoes,
    clearSelection,
    deleteSelected: deleteSelectedCotacoes
  } = useMultipleSelection({
    items: cotacoes,
    onRefresh,
    deleteFunction: secureDeleteCotacao
  });

  // CORREÇÃO: Memoizar filtros com validação de props usando type guards
  const validatedCotacoes = useMemo(() => {
    return validateCotacoes(cotacoes);
  }, [cotacoes]);

  const filteredCotacoes = useMemo(() => {
    if (!searchTerm.trim()) return validatedCotacoes;
    
    const searchLower = searchTerm.toLowerCase();
    return validatedCotacoes.filter(cotacao => {
      const numero = cotacao.numero_cotacao || '';
      const descricao = cotacao.descricao || '';
      
      return numero.toLowerCase().includes(searchLower) ||
             descricao.toLowerCase().includes(searchLower);
    });
  }, [validatedCotacoes, searchTerm]);

  // CORREÇÃO: Funções memoizadas para modal de comparação
  const openImageComparisonModal = useCallback((
    imagemPrincipal: string,
    imagemFornecedor: string,
    observacoes: string,
    produtoInfo: { sku?: string; nome_produto?: string; rowIndex: number }
  ) => {
    setImageComparisonModal({
      isOpen: true,
      imagemPrincipal,
      imagemFornecedor,
      observacoes,
      produtoInfo
    });
  }, []);

  const closeImageComparisonModal = useCallback(() => {
    setImageComparisonModal({
      isOpen: false,
      imagemPrincipal: '',
      imagemFornecedor: '',
      observacoes: '',
      produtoInfo: undefined
    });
  }, []);

  const saveObservacoes = useCallback((rowIndex: number, observacoes: string) => {
    setProductData(prevData => {
      const newData = [...prevData];
      if (newData[rowIndex]) {
        newData[rowIndex] = { ...newData[rowIndex], obs: observacoes };
      }
      
      // CORREÇÃO: Usar o novo gerenciador de sessionStorage
      const { error } = ErrorHandler.withErrorHandlingSync(
        () => SessionStorageManager.saveProducts(newData),
        { component: 'CotacoesInternacionaisTab', action: 'save_observacoes' }
      );
      
      if (error) {
        console.warn('Erro ao salvar observações:', error.message);
      }
      
      return newData;
    });
  }, []);

  // Funções para gerenciar imagens no modal de comparação
  const handleDeleteImagemPrincipal = useCallback((rowIndex: number) => {
    setProductData(prevData => {
      const newData = [...prevData];
      if (newData[rowIndex]) {
        newData[rowIndex] = { ...newData[rowIndex], imagem: '' };
      }
      SessionStorageManager.saveProducts(newData);
      return newData;
    });
    
    // Atualizar o modal
    setImageComparisonModal(prev => ({
      ...prev,
      imagemPrincipal: ''
    }));
  }, []);

  const handleDeleteImagemFornecedor = useCallback((rowIndex: number) => {
    setProductData(prevData => {
      const newData = [...prevData];
      if (newData[rowIndex]) {
        newData[rowIndex] = { ...newData[rowIndex], imagem_fornecedor: '' };
      }
      SessionStorageManager.saveProducts(newData);
      return newData;
    });
    
    // Atualizar o modal
    setImageComparisonModal(prev => ({
      ...prev,
      imagemFornecedor: ''
    }));
  }, []);

  const handleUploadImagemPrincipal = useCallback(async (rowIndex: number, file: File) => {
    try {
      const result = await uploadImage(file, `cotacoes/imagens-produtos/${Date.now()}-${file.name}`);
      
      if (result.success && result.url) {
        setProductData(prevData => {
          const newData = [...prevData];
          if (newData[rowIndex]) {
            newData[rowIndex] = { ...newData[rowIndex], imagem: result.url };
          }
          SessionStorageManager.saveProducts(newData);
          return newData;
        });
        
        // Atualizar o modal
        setImageComparisonModal(prev => ({
          ...prev,
          imagemPrincipal: result.url
        }));
      } else {
        throw new Error(result.error || 'Erro ao fazer upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  }, [uploadImage]);

  const handleUploadImagemFornecedor = useCallback(async (rowIndex: number, file: File) => {
    try {
      const result = await uploadImage(file, `cotacoes/imagens-fornecedor/${Date.now()}-${file.name}`);
      
      if (result.success && result.url) {
        setProductData(prevData => {
          const newData = [...prevData];
          if (newData[rowIndex]) {
            newData[rowIndex] = { ...newData[rowIndex], imagem_fornecedor: result.url };
          }
          SessionStorageManager.saveProducts(newData);
          return newData;
        });
        
        // Atualizar o modal
        setImageComparisonModal(prev => ({
          ...prev,
          imagemFornecedor: result.url
        }));
      } else {
        throw new Error(result.error || 'Erro ao fazer upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  }, [uploadImage]);

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
        comprimento_cm: 0,
        // CORREÇÃO: Adicionar campos obrigatórios com valores padrão
        peso_total_kg: 0,
        cbm_unitario: 0,
        cbm_total: 0,
        quantidade_total: product.quantidade || 1,
        valor_total: (product.preco_custo || 0) * (product.quantidade || 1)
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
      toast({ title: "Produtos adicionados!", description: `${produtosAdicionados.length} produto(s) adicionado(s) à cotação.` });
    }
    
    if (produtosDuplicados.length > 0) {
      toast({
        title: "Produtos duplicados",
        description: `${produtosDuplicados.length} produto(s) já existe(m) na cotação.`,
        variant: "default"
      });
    }
  };

  // Função para calcular valores do produto (memoizada)
  const calcularProduto = useCallback((produto: ProdutoCotacao): ProdutoCotacao => {
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
  }, []);

  // Função para converter moedas usando API real (memoizada)
  const converterMoeda = useCallback((valor: number, moedaOrigem: string, fatorMultiplicador: number = 1) => {
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
  }, [rates]);


  const adicionarProduto = useCallback(() => {
    try {
      // CORREÇÃO: Validação mais robusta antes de adicionar produto
      const validationResult = validateProdutoData(produtoTemp);
      
      if (!validationResult.isValid) {
        toast({
          title: "Dados inválidos",
          description: validationResult.errors.join(', '),
          variant: "destructive",
        });
        return;
      }
      
      // Mostrar warnings se houver
      if (validationResult.warnings.length > 0) {
        toast({
          title: "Atenção",
          description: validationResult.warnings.join(', '),
          variant: "default",
        });
      }

      // Usar função de sanitização para garantir dados consistentes
      const novoProduto = sanitizeProduto({
        ...produtoTemp,
        id: Date.now().toString()
      });

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
      const errorDetails = ErrorHandler.capture(error, {
        component: 'CotacoesInternacionaisTab',
        action: 'adicionar_produto'
      });
      
      toast({
        title: "Erro ao adicionar produto",
        description: ErrorHandler.getUserMessage(errorDetails),
        variant: "destructive",
      });
    }
  }, [produtoTemp, produtos, toast]);

  const removerProduto = useCallback((id: string) => {
    setProdutos(produtos.filter(p => p.id !== id));
  }, [produtos]);

  const resetForm = useCallback(() => {
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
  }, []);

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

      // Converter produtos importados para o formato da interface ProdutoCotacao
      const produtosFormatados = totaisGerais.produtos.map((p: any) => ({
        id: p.id || `prod-${Date.now()}-${Math.random()}`,
        sku: p.sku || '',
        nome: p.nome_produto || p.nome || '',
        material: p.material || '',
        package_qtd: p.pcs_ctn || 1,
        preco_unitario: p.preco || p.preco_unitario || 0,
        unidade_medida: p.unit || p.unidade_medida || 'PCS',
        pcs_ctn: p.pcs_ctn || 1,
        qtd_caixas_pedido: p.caixas || p.qtd_caixas_pedido || 1,
        peso_unitario_g: p.peso_unitario_g || 0,
        largura_cm: p.largura || p.largura_cm || 0,
        altura_cm: p.altura || p.altura_cm || 0,
        comprimento_cm: p.comprimento || p.comprimento_cm || 0,
        peso_total_kg: p.peso_total_kg || 0,
        cbm_unitario: p.cbm_unitario || 0,
        cbm_total: p.cbm_total || 0,
        quantidade_total: p.quantidade_total || 0,
        valor_total: p.valor_total || 0
      }));

      const cotacaoCompleta: CotacaoInternacional = {
        ...dadosBasicos,
        produtos: produtosFormatados,
        ...totaisGerais
      };

      console.log('Salvando cotação:', cotacaoCompleta);

      // Salvar no banco de dados
      await secureCreateCotacao(cotacaoCompleta);

      toast({
        title: "✅ Cotação salva com sucesso!",
        description: `Cotação ${cotacaoCompleta.numero_cotacao} foi criada na aba "Cotações Internacionais"`,
      });

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

  const formatCurrency = useCallback((value: number, currency: string = 'BRL') => {
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
  }, []);

  // Funções para seleção de produtos na tabela Excel (memoizadas)
  const handleSelectProduct = useCallback((productId: string, checked: boolean) => {
    console.log('🔘 [DEBUG] Selecionando produto:', { productId, checked });
    if (checked) {
      setSelectedProductIds(prev => {
        const newSelected = [...prev, productId];
        console.log('✅ [DEBUG] Produtos selecionados após adicionar:', newSelected);
        return newSelected;
      });
    } else {
      setSelectedProductIds(prev => {
        const newSelected = prev.filter(id => id !== productId);
        console.log('❌ [DEBUG] Produtos selecionados após remover:', newSelected);
        return newSelected;
      });
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'rascunho': return 'bg-gray-500';
      case 'aberta': return 'bg-blue-500';
      case 'fechada': return 'bg-green-500';
      case 'cancelada': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }, []);

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

  // CORREÇÃO: Calcular valores dinamicamente sem criar loop
  const displayProductsWithCalculations = useMemo(() => {
    if (productData.length === 0) return [];
    
    return productData.map(product => {
      const changeDolar = (product.preco_unitario || 0) / getChangeDolarDivisorValue();
      return {
        ...product,
        change_dolar: changeDolar,
        change_dolar_total: (product.valor_total || 0) / getChangeDolarTotalDivisorValue(),
        multiplicador_reais: changeDolar * getMultiplicadorReaisValue(),
        multiplicador_reais_total: ((product.valor_total || 0) / getChangeDolarTotalDivisorValue()) * getMultiplicadorReaisTotalValue()
      };
    });
  }, [productData, changeDolarDivisor, changeDolarTotalDivisor, multiplicadorReais, multiplicadorReaisTotal]);

  // Cálculos totais da cotação (movido para depois de displayProductsWithCalculations)
  const totaisGerais = useMemo(() => {
    // Usar displayProductsWithCalculations que já tem todos os valores calculados corretamente
    const produtosCalculados = displayProductsWithCalculations.length > 0 
      ? displayProductsWithCalculations 
      : produtos.map(calcularProduto);
    
    const total_peso_kg = produtosCalculados.reduce((sum, p) => sum + (p.peso_total_kg || 0), 0);
    const total_cbm = produtosCalculados.reduce((sum, p) => sum + (p.cbm_total || 0), 0);
    const total_quantidade = produtosCalculados.reduce((sum, p) => sum + (p.quantidade_total || 0), 0);
    const total_valor_origem = produtosCalculados.reduce((sum, p) => sum + (p.valor_total || 0), 0);
    
    // Somar a coluna Change DOLAR Total
    const total_valor_usd = produtosCalculados.reduce((sum, p) => {
      return sum + (p.change_dolar_total || 0);
    }, 0);
    
    // Somar a coluna Multiplicador REAIS Total
    const total_valor_brl = produtosCalculados.reduce((sum, p) => {
      return sum + (p.multiplicador_reais_total || 0);
    }, 0);

    return {
      total_peso_kg: total_peso_kg || 0,
      total_cbm: total_cbm || 0,
      total_quantidade: total_quantidade || 0,
      total_valor_origem: total_valor_origem || 0,
      total_valor_usd: total_valor_usd || 0,
      total_valor_brl: total_valor_brl || 0,
      produtos: produtosCalculados
    };
  }, [displayProductsWithCalculations, produtos, dadosBasicos.moeda_origem, dadosBasicos.fator_multiplicador, converterMoeda]);

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
    'pcs_ctn', 'caixas', 'peso_unitario_g', 'peso_emb_master_kg', 'peso_sem_emb_master_kg',
    'peso_total_emb_kg', 'peso_total_sem_emb_kg', 'comprimento', 'largura', 
    'altura', 'cbm_cubagem', 'cbm_total', 'quantidade_total', 'valor_total', 'obs',
    'comprimento_cm', 'largura_cm', 'altura_cm', 'cbm_unitario', 'qtd_caixas_pedido'
  ];

  const isFieldEditable = useCallback((field: string) => {
    return editableFields.includes(field);
  }, []);

  const getFieldType = useCallback((field: string) => {
    const numberFields = [
      'preco', 'pcs_ctn', 'caixas', 'peso_unitario_g', 'peso_emb_master_kg', 
      'peso_sem_emb_master_kg', 'peso_total_emb_kg', 'peso_total_sem_emb_kg',
      'comprimento', 'largura', 'altura', 'cbm_cubagem', 'cbm_total',
      'comprimento_cm', 'largura_cm', 'altura_cm', 'cbm_unitario', 
      'quantidade_total', 'valor_total', 'qtd_caixas_pedido'
    ];
    return numberFields.includes(field) ? 'number' : 'text';
  }, []);

  // Função para obter símbolo da moeda
  const getCurrencySymbol = useCallback((currencyCode: string) => {
    const currency = AVAILABLE_CURRENCIES.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  }, []);

  // CORREÇÃO: Usar produtos com cálculos dinâmicos
  const displayProducts = displayProductsWithCalculations;

  // Funções de seleção que dependem de displayProducts (movidas para cá)
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedProductIds(displayProducts.map((_, index) => index.toString()));
    } else {
      setSelectedProductIds([]);
    }
  }, [displayProducts]);

  const handleDeleteSelectedProducts = useCallback(() => {
    if (selectedProductIds.length === 0) return;
    
    const updatedProducts = displayProducts.filter((_, index) => 
      !selectedProductIds.includes(index.toString())
    );
    
    setProductData(updatedProducts);
    setSelectedProductIds([]);
    setHasImportedData(true);
    
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
      description: `${selectedProductIds.length} produto(s) foram excluídos com sucesso.`,
    });
  }, [displayProducts, selectedProductIds, toast]);

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
    product.change_dolar = (product.preco_unitario || 0) / getChangeDolarDivisorValue();
    product.change_dolar_total = (product.valor_total || 0) / getChangeDolarTotalDivisorValue();
    product.multiplicador_reais = product.change_dolar * getMultiplicadorReaisValue();
    product.multiplicador_reais_total = (product.valor_total / getChangeDolarTotalDivisorValue()) * getMultiplicadorReaisTotalValue();
    
    setProductData(updatedProducts);
    stopEditing();
    
    // CORREÇÃO: Salvar no sessionStorage SEM limpar imagens
    try {
      SessionStorageManager.saveProducts(updatedProducts);
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

  // Função para calcular peso total - soma a coluna "Peso Total Emb. (KG)"
  const getTotalWeight = useCallback(() => {
    return displayProducts.reduce((total, product) => {
      return total + (product.peso_total_emb_kg || 0);
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
  const handleImportSuccess = useCallback(async (dadosImportados: any[]) => {
    console.log('🎯 [handleImportSuccess] INÍCIO - Dados recebidos:', dadosImportados.length);
    console.log('🎯 [handleImportSuccess] Estado atual de productData:', productData.length);
    
    // 🔍 DEBUG: Verificar campos problemáticos dos dados recebidos
    if (dadosImportados && dadosImportados.length > 0) {
      const p = dadosImportados[0];
      console.log('🔍 DADOS RECEBIDOS NO TAB:', {
        qtd_caixas_pedido: p.qtd_caixas_pedido,
        peso_unitario_g: p.peso_unitario_g,
        peso_emb_master_kg: p.peso_emb_master_kg,
        peso_sem_emb_master_kg: p.peso_sem_emb_master_kg,
        comprimento_cm: p.comprimento_cm,
        largura_cm: p.largura_cm,
        altura_cm: p.altura_cm,
        cbm_unitario: p.cbm_unitario
      });
    }
    
    if (!dadosImportados || dadosImportados.length === 0) {
      toast({
        title: "Erro na importação",
        description: "Nenhum dado foi recebido para importação.",
        variant: "destructive",
      });
      return;
    }
    
    // ✅ USAR DADOS JÁ MAPEADOS PELO HOOK - não refazer mapeamento!
    const novosProdutos = dadosImportados.map((produto, index) => ({
      ...produto,
      id: produto.id || `import-${index}`,
      // Garantir campos obrigatórios com fallback
      sku: produto.sku || `PROD-${index + 1}`,
      imagem: produto.imagem || '',
      imagem_fornecedor: produto.imagem_fornecedor || '',
    }));
    
    console.log('🎯 [handleImportSuccess] novosProdutos criados:', novosProdutos.length);
    console.log('🎯 [handleImportSuccess] Primeiro produto:', novosProdutos[0]);
    
    // Recalcular campos automaticamente para todos os produtos
    const produtosComCalculos = novosProdutos.map(produto => {
      const changeDolar = (produto.preco_unitario || 0) / getChangeDolarDivisorValue();
      return {
        ...produto,
        change_dolar: changeDolar,
        change_dolar_total: (produto.valor_total || 0) / getChangeDolarTotalDivisorValue(),
        multiplicador_reais: changeDolar * getMultiplicadorReaisValue(),
        multiplicador_reais_total: ((produto.valor_total || 0) / getChangeDolarTotalDivisorValue()) * getMultiplicadorReaisTotalValue()
      };
    });
    
    setProductData(produtosComCalculos);
    setHasImportedData(true);
    
    // Salvar no sessionStorage
    try {
      SessionStorageManager.saveProducts(produtosComCalculos);
      console.log('✅ Produtos salvos no sessionStorage com imagens preservadas');
    } catch (error) {
      console.warn('Erro ao salvar no sessionStorage:', error);
    }
    
    // NÃO USAR setTimeout aqui - causa bugs de estado
    
    toast({
      title: "Importação concluída!",
      description: `${novosProdutos.length} produtos importados com sucesso.`,
    });
  }, [toast, productData, getChangeDolarDivisorValue, getChangeDolarTotalDivisorValue, getMultiplicadorReaisValue, getMultiplicadorReaisTotalValue]);

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
              // Converter base64 para Uint8Array (compatível com navegador)
              const imageData = base64.split(',')[1] || base64;
              const binaryString = atob(imageData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              const imageId = workbook.addImage({
                buffer: bytes,
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
              // Converter base64 para Uint8Array (compatível com navegador)
              const imageData = base64.split(',')[1] || base64;
              const binaryString = atob(imageData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              const imageId = workbook.addImage({
                buffer: bytes,
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

  // Auto-save: salvar automaticamente após edições
  useEffect(() => {
    // ✅ VALIDAÇÕES PARA AUTO-SAVE
    // Não fazer auto-save se:
    // 1. Não houver produtos
    // 2. Já estiver salvando
    // 3. Não houver dados completos da cotação
    
    // Verificar se tem cotação selecionada COM dados válidos
    const temCotacaoValidaSelecionada = !!(
      selectedCotacao?.id && 
      selectedCotacao.numero_cotacao && 
      selectedCotacao.descricao
    );
    
    // Verificar se tem dados básicos completos (para nova cotação)
    const temDadosBasicosCompletos = !!(
      dadosBasicos.numero_cotacao && 
      dadosBasicos.descricao
    );
    
    const canAutoSave = productData.length > 0 
      && !isSavingAuto 
      && hasImportedData
      && (temCotacaoValidaSelecionada || temDadosBasicosCompletos);

    if (!canAutoSave) {
      console.log('⏸️ Auto-save pausado:', {
        temProdutos: productData.length > 0,
        naoEstaSalvando: !isSavingAuto,
        temDadosImportados: hasImportedData,
        temCotacaoValidaSelecionada,
        selectedCotacaoData: selectedCotacao ? {
          id: selectedCotacao.id,
          numero: selectedCotacao.numero_cotacao,
          descricao: selectedCotacao.descricao
        } : null,
        temDadosBasicosCompletos,
        dadosBasicos: {
          numero: dadosBasicos.numero_cotacao,
          descricao: dadosBasicos.descricao
        }
      });
      return;
    }

    // Limpar timeout anterior
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Agendar auto-save após 3 segundos de inatividade
    autoSaveTimeoutRef.current = setTimeout(async () => {
      console.log('🔍 [AUTO-SAVE] Iniciando verificação final:', {
        temSelectedCotacao: !!selectedCotacao?.id,
        selectedCotacaoData: selectedCotacao ? {
          id: selectedCotacao.id,
          numero: selectedCotacao.numero_cotacao,
          descricao: selectedCotacao.descricao
        } : null,
        dadosBasicos: {
          numero: dadosBasicos.numero_cotacao,
          descricao: dadosBasicos.descricao
        },
        totalProdutos: totaisGerais.produtos?.length || 0,
        productDataLength: productData.length
      });

      // Validação final: garantir que há cotação válida OU dados básicos válidos
      const cotacaoValida = selectedCotacao?.id && selectedCotacao.numero_cotacao && selectedCotacao.descricao;
      const dadosBasicosValidos = dadosBasicos.numero_cotacao && dadosBasicos.descricao;
      
      if (!cotacaoValida && !dadosBasicosValidos) {
        console.log('⏭️ Auto-save cancelado: Nenhuma cotação válida ou dados básicos completos');
        return;
      }

      // Verificar se há produtos para salvar
      const produtosParaSalvar = totaisGerais.produtos || productData;
      if (!produtosParaSalvar || produtosParaSalvar.length === 0) {
        console.log('⏭️ Auto-save cancelado: Nenhum produto para salvar');
        return;
      }

      try {
        setIsSavingAuto(true);
        
        console.log('💾 [AUTO-SAVE] Preparando dados para salvar...');
        
        // ✅ CORREÇÃO: Auto-save NÃO deve validar produtos rigidamente
        // Apenas filtra produtos que têm pelo menos SKU OU nome preenchido
        const produtosValidos = produtosParaSalvar.filter(p => {
          const temSku = p.sku && p.sku.trim().length > 0;
          const temNome = p.nome && p.nome.trim().length > 0;
          return temSku || temNome;
        });
        
        if (produtosValidos.length === 0) {
          console.log('⏭️ Auto-save cancelado: Nenhum produto com dados mínimos');
          setIsSavingAuto(false);
          return;
        }
        
        console.log(`💾 [AUTO-SAVE] Salvando ${produtosValidos.length} de ${produtosParaSalvar.length} produtos`);

        // Criar objeto completo da cotação com produtos válidos
        const cotacaoCompleta = {
          numero_cotacao: selectedCotacao?.numero_cotacao || dadosBasicos.numero_cotacao,
          descricao: selectedCotacao?.descricao || dadosBasicos.descricao,
          pais_origem: selectedCotacao?.pais_origem || dadosBasicos.pais_origem,
          moeda_origem: selectedCotacao?.moeda_origem || dadosBasicos.moeda_origem,
          fator_multiplicador: selectedCotacao?.fator_multiplicador || dadosBasicos.fator_multiplicador,
          data_abertura: selectedCotacao?.data_abertura || dadosBasicos.data_abertura,
          data_fechamento: selectedCotacao?.data_fechamento || dadosBasicos.data_fechamento || null,
          status: (selectedCotacao?.status || dadosBasicos.status) as 'rascunho' | 'aberta' | 'fechada' | 'cancelada',
          observacoes: selectedCotacao?.observacoes || dadosBasicos.observacoes || null,
          produtos: produtosValidos, // Usar apenas produtos válidos
          total_peso_kg: totaisGerais.total_peso_kg || 0,
          total_cbm: totaisGerais.total_cbm || 0,
          total_quantidade: totaisGerais.total_quantidade || 0,
          total_valor_origem: totaisGerais.total_valor_origem || 0,
          total_valor_usd: totaisGerais.total_valor_usd || 0,
          total_valor_brl: totaisGerais.total_valor_brl || 0
        };

        // Atualizar se já existe, criar se não existe (SILENCIOSO - sem toasts)
        if (selectedCotacao?.id) {
          await silentUpdateCotacao(selectedCotacao.id, cotacaoCompleta);
          console.log('✅ Auto-save: Cotação atualizada');
        } else {
          const novaCotacao = await silentCreateCotacao(cotacaoCompleta);
          if (novaCotacao) {
            // Converter produtos de Json para ProdutoCotacao[]
            const produtosFormatados = Array.isArray(novaCotacao.produtos) ? novaCotacao.produtos : [];
            const cotacaoConvertida = {
              ...novaCotacao,
              produtos: produtosFormatados
            } as unknown as CotacaoInternacional;
            setSelectedCotacao(cotacaoConvertida);
          }
          console.log('✅ Auto-save: Cotação criada');
        }

        setLastAutoSave(new Date());
        
      } catch (error) {
        console.error('❌ Erro no auto-save:', error);
        // Não mostrar toast de erro para auto-save silencioso
      } finally {
        setIsSavingAuto(false);
      }
    }, 3000); // 3 segundos de debounce

    // Cleanup
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [productData, dadosBasicos, totaisGerais, hasImportedData, selectedCotacao, silentCreateCotacao, silentUpdateCotacao, isSavingAuto]);
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
        
        <div className="flex gap-2 flex-wrap">
          {/* Botões de seleção múltipla quando não há cotação selecionada */}
          {!selectedCotacao && isSelectMode && selectedCotacoes.length > 0 && (
            <>
              <Button variant="destructive" onClick={deleteSelectedCotacoes} size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir ({selectedCotacoes.length})
              </Button>
              <Button variant="outline" onClick={selectAllCotacoes} size="sm">
                Selecionar Todos
              </Button>
              <Button variant="outline" onClick={clearSelection} size="sm">
                Limpar Seleção
              </Button>
            </>
          )}
          
          {/* Botão de modo de seleção quando não há cotação selecionada */}
          {!selectedCotacao && (
            <Button 
              variant={isSelectMode ? "default" : "outline"} 
              onClick={toggleSelectMode}
              size="sm"
            >
              {isSelectMode ? 'Cancelar Seleção' : 'Selecionar'}
            </Button>
          )}
          
          {selectedCotacao && (
            <Button variant="outline" onClick={() => setSelectedCotacao(null)} size="sm">
              Voltar aos Cards
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={updateRates} 
            className="gap-2"
            disabled={ratesLoading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${ratesLoading ? 'animate-spin' : ''}`} />
            {ratesLoading ? 'Atualizando...' : 'Atualizar Cotações'}
          </Button>
        </div>
      </div>

      {!selectedCotacao ? (
        <>
          {/* Search and New Button */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cotações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button 
              onClick={() => {
                // Gerar número de cotação automático
                const numeroCotacao = `COT-INT-${new Date().getFullYear()}-${Date.now()}`;
                setNewCotacaoData({
                  numero_cotacao: numeroCotacao,
                  descricao: '',
                  pais_origem: 'China',
                  moeda_origem: 'CNY',
                  fator_multiplicador: 1,
                  data_abertura: new Date().toISOString().split('T')[0],
                  data_fechamento: '',
                  status: 'rascunho' as const,
                  observacoes: ''
                });
                setShowNewCotacaoDialog(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Cotação
            </Button>
          </div>

          {/* Cotações Grid - Cards Layout */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCotacoes.map((cotacao) => (
              <CotacaoCard
                key={cotacao.id}
                cotacao={cotacao}
                isSelectMode={isSelectMode}
                isSelected={selectedCotacoes.includes(cotacao.id!)}
                onSelect={selectCotacao}
                onClick={() => setSelectedCotacao(cotacao)}
                formatCurrency={formatCurrency}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>

          {filteredCotacoes.length === 0 && <EmptyState searchTerm={searchTerm} />}
        </>
      ) : (
        <div className="space-y-4">
          {/* Cabeçalho da Cotação Selecionada */}
          <CotacaoHeader
            cotacao={selectedCotacao}
            isSavingAuto={isSavingAuto}
            lastAutoSave={lastAutoSave}
            selectedCurrency={selectedCurrency}
            onCurrencyChange={(value) => {
              setSelectedCurrency(value);
              try {
                sessionStorage.setItem('cotacao-selected-currency', value);
              } catch (error) {
                console.warn('Erro ao salvar moeda no sessionStorage:', error);
              }
            }}
            selectedContainer={selectedContainer}
            onContainerChange={(value) => {
              setSelectedContainer(value);
              try {
                sessionStorage.setItem('cotacao-selected-container', value);
              } catch (error) {
                console.warn('Erro ao salvar container no sessionStorage:', error);
              }
            }}
            totaisGerais={totaisGerais}
            dadosBasicos={dadosBasicos}
            getContainerUsage={getContainerUsage}
            getTotalCBM={getTotalCBM}
            getTotalWeight={getTotalWeight}
            getStatusColor={getStatusColor}
            getCurrencySymbol={getCurrencySymbol}
            availableCurrencies={AVAILABLE_CURRENCIES}
            containerTypes={CONTAINER_TYPES}
          />

          {/* Tabela estilo Excel */}
          <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Produtos da Cotação</CardTitle>
                  <div className="flex gap-2">
                    {selectedProductIds.length > 0 && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleDeleteSelectedProducts}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Selecionados ({selectedProductIds.length})
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
                           checked={selectedProductIds.length === displayProducts.length && displayProducts.length > 0}
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
                             checked={selectedProductIds.includes(index.toString())}
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
                              {(() => {
                                return (
                                  <div 
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => openImageComparisonModal(
                                      product.imagem || '',
                                 product.imagem_fornecedor || '',
                                 product.obs || '',
                                 {
                                   sku: product.sku,
                                   nome_produto: product.nome,
                                   rowIndex: index
                                 }
                                    )}
                                  >
                                   <ProdutoImagemPreview
                                     imagemUrl={product.imagem}
                                     nomeProduto={product.nome || product.sku}
                                     sku={product.sku}
                                     className="mx-auto"
                                   />
                                  </div>
                                );
                              })()}
                            </TableCell>
                          <TableCell className="text-center py-3">
                            <div 
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => openImageComparisonModal(
                                product.imagem || '',
                                product.imagem_fornecedor || '',
                                 product.obs || '',
                                 {
                                   sku: product.sku,
                                   nome_produto: product.nome,
                                   rowIndex: index
                                 }
                               )}
                             >
                               <ProdutoImagemPreview
                                 imagemFornecedorUrl={product.imagem_fornecedor}
                                 nomeProduto={product.nome || product.sku}
                                 sku={product.sku}
                                 className="mx-auto"
                               />
                            </div>
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
                              value={product.nome}
                              type="text"
                              onSave={(value) => updateProductData(index, 'nome', value)}
                              onCancel={stopEditing}
                              isEditing={editingCell?.row === index && editingCell?.field === 'nome'}
                              onDoubleClick={() => startEditing(index, 'nome')}
                            />
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <EditableCell
                              value={product.package_qtd}
                              type="number"
                              onSave={(value) => updateProductData(index, 'package_qtd', value)}
                              onCancel={stopEditing}
                              isEditing={editingCell?.row === index && editingCell?.field === 'package_qtd'}
                              onDoubleClick={() => startEditing(index, 'package_qtd')}
                            />
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <EditableCell
                              value={product.preco_unitario}
                              type="number"
                              prefix={`${getCurrencySymbol(selectedCurrency)} `}
                              step="0.01"
                              onSave={(value) => updateProductData(index, 'preco_unitario', value)}
                              onCancel={stopEditing}
                              isEditing={editingCell?.row === index && editingCell?.field === 'preco_unitario'}
                              onDoubleClick={() => startEditing(index, 'preco_unitario')}
                            />
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <EditableCell
                              value={product.unidade_medida}
                              type="text"
                              onSave={(value) => updateProductData(index, 'unidade_medida', value)}
                              onCancel={stopEditing}
                              isEditing={editingCell?.row === index && editingCell?.field === 'unidade_medida'}
                              onDoubleClick={() => startEditing(index, 'unidade_medida')}
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
                              value={product.qtd_caixas_pedido}
                              type="number"
                              onSave={(value) => updateProductData(index, 'qtd_caixas_pedido', value)}
                              onCancel={stopEditing}
                              isEditing={editingCell?.row === index && editingCell?.field === 'qtd_caixas_pedido'}
                              onDoubleClick={() => startEditing(index, 'qtd_caixas_pedido')}
                            />
                          </TableCell>
                          <TableCell className="text-right py-3 font-mono text-sm">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <EditableCell
                                      value={product.peso_unitario_g || 0}
                                      type="number"
                                      onSave={(value) => updateProductData(index, 'peso_unitario_g', value)}
                                      onCancel={stopEditing}
                                      isEditing={editingCell?.row === index && editingCell?.field === 'peso_unitario_g'}
                                      onDoubleClick={() => startEditing(index, 'peso_unitario_g')}
                                      suffix="g"
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Clique 2x para editar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-center py-3 text-sm">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <EditableCell
                                      value={product.peso_emb_master_kg || 0}
                                      type="number"
                                      onSave={(value) => updateProductData(index, 'peso_emb_master_kg', value)}
                                      onCancel={stopEditing}
                                      isEditing={editingCell?.row === index && editingCell?.field === 'peso_emb_master_kg'}
                                      onDoubleClick={() => startEditing(index, 'peso_emb_master_kg')}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Clique 2x para editar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-center py-3 text-sm">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <EditableCell
                                      value={product.peso_sem_emb_master_kg || 0}
                                      type="number"
                                      onSave={(value) => updateProductData(index, 'peso_sem_emb_master_kg', value)}
                                      onCancel={stopEditing}
                                      isEditing={editingCell?.row === index && editingCell?.field === 'peso_sem_emb_master_kg'}
                                      onDoubleClick={() => startEditing(index, 'peso_sem_emb_master_kg')}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Clique 2x para editar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-center py-3 text-sm">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <EditableCell
                                      value={product.peso_total_emb_kg || 0}
                                      type="number"
                                      onSave={(value) => updateProductData(index, 'peso_total_emb_kg', value)}
                                      onCancel={stopEditing}
                                      isEditing={editingCell?.row === index && editingCell?.field === 'peso_total_emb_kg'}
                                      onDoubleClick={() => startEditing(index, 'peso_total_emb_kg')}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Clique 2x para editar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-center py-3 text-sm">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <EditableCell
                                      value={product.peso_total_sem_emb_kg || 0}
                                      type="number"
                                      onSave={(value) => updateProductData(index, 'peso_total_sem_emb_kg', value)}
                                      onCancel={stopEditing}
                                      isEditing={editingCell?.row === index && editingCell?.field === 'peso_total_sem_emb_kg'}
                                      onDoubleClick={() => startEditing(index, 'peso_total_sem_emb_kg')}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Clique 2x para editar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <EditableCell
                                      value={product.comprimento_cm || 0}
                                      type="number"
                                      onSave={(value) => updateProductData(index, 'comprimento_cm', value)}
                                      onCancel={stopEditing}
                                      isEditing={editingCell?.row === index && editingCell?.field === 'comprimento_cm'}
                                      onDoubleClick={() => startEditing(index, 'comprimento_cm')}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Clique 2x para editar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <EditableCell
                                      value={product.largura_cm || 0}
                                      type="number"
                                      onSave={(value) => updateProductData(index, 'largura_cm', value)}
                                      onCancel={stopEditing}
                                      isEditing={editingCell?.row === index && editingCell?.field === 'largura_cm'}
                                      onDoubleClick={() => startEditing(index, 'largura_cm')}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Clique 2x para editar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <EditableCell
                                      value={product.altura_cm || 0}
                                      type="number"
                                      onSave={(value) => updateProductData(index, 'altura_cm', value)}
                                      onCancel={stopEditing}
                                      isEditing={editingCell?.row === index && editingCell?.field === 'altura_cm'}
                                      onDoubleClick={() => startEditing(index, 'altura_cm')}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Clique 2x para editar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <EditableCell
                                      value={product.cbm_unitario || 0}
                                      type="number"
                                      onSave={(value) => updateProductData(index, 'cbm_unitario', value)}
                                      onCancel={stopEditing}
                                      isEditing={editingCell?.row === index && editingCell?.field === 'cbm_unitario'}
                                      onDoubleClick={() => startEditing(index, 'cbm_unitario')}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Clique 2x para editar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                         <TableCell className="text-center py-3">
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <div>
                                   <EditableCell
                                     value={product.cbm_total || 0}
                                     type="number"
                                     onSave={(value) => updateProductData(index, 'cbm_total', value)}
                                     onCancel={stopEditing}
                                     isEditing={editingCell?.row === index && editingCell?.field === 'cbm_total'}
                                     onDoubleClick={() => startEditing(index, 'cbm_total')}
                                   />
                                 </div>
                               </TooltipTrigger>
                               <TooltipContent>Clique 2x para editar</TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </TableCell>
                         <TableCell className="text-center py-3 font-medium">
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <div>
                                   <EditableCell
                                     value={product.quantidade_total || 0}
                                     type="number"
                                     onSave={(value) => updateProductData(index, 'quantidade_total', value)}
                                     onCancel={stopEditing}
                                     isEditing={editingCell?.row === index && editingCell?.field === 'quantidade_total'}
                                     onDoubleClick={() => startEditing(index, 'quantidade_total')}
                                   />
                                 </div>
                               </TooltipTrigger>
                               <TooltipContent>Clique 2x para editar</TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </TableCell>
                         <TableCell className="text-right py-3 font-medium">
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <div>
                                   <EditableCell
                                     value={product.valor_total || 0}
                                     type="number"
                                     onSave={(value) => updateProductData(index, 'valor_total', value)}
                                     onCancel={stopEditing}
                                     isEditing={editingCell?.row === index && editingCell?.field === 'valor_total'}
                                     onDoubleClick={() => startEditing(index, 'valor_total')}
                                     prefix={getCurrencySymbol(selectedCurrency) + ' '}
                                   />
                                 </div>
                               </TooltipTrigger>
                               <TooltipContent>Clique 2x para editar</TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </TableCell>
                         <TableCell className="text-center py-3">
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <div>
                                   <EditableCell
                                     value={product.obs || ''}
                                     type="text"
                                     onSave={(value) => updateProductData(index, 'obs', value)}
                                     onCancel={stopEditing}
                                     isEditing={editingCell?.row === index && editingCell?.field === 'obs'}
                                     onDoubleClick={() => startEditing(index, 'obs')}
                                   />
                                 </div>
                               </TooltipTrigger>
                               <TooltipContent>Clique 2x para editar</TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </TableCell>
                          <TableCell className="text-right py-3 font-mono text-sm">$ {product.change_dolar.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                         <TableCell className="text-right py-3 font-mono text-sm">$ {product.change_dolar_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right py-3 font-mono text-sm">R$ {product.multiplicador_reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                           <TableCell className="text-right py-3 font-mono text-sm">R$ {product.multiplicador_reais_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                         </TableRow>
                       ))}
                   </TableBody>
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
      
      {/* Modal do Seletor de Produtos */}
      <ProductSelector
        isOpen={isProductSelectorOpen}
        onOpenChange={setIsProductSelectorOpen}
        onSelectProducts={handleProductSelectorConfirm}
      />
      
      {/* Dialog de Importação */}
      {showImportDialog && (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <CotacaoImportDialog
            open={showImportDialog}
            onOpenChange={setShowImportDialog}
            cotacao={selectedCotacao}
            onImportSuccess={handleImportSuccess}
          />
        </React.Suspense>
      )}
      
      {/* Modal de Comparação de Imagens */}
      <ImageComparisonModal
        isOpen={imageComparisonModal.isOpen}
        onClose={closeImageComparisonModal}
        imagemPrincipal={imageComparisonModal.imagemPrincipal}
        imagemFornecedor={imageComparisonModal.imagemFornecedor}
        observacoes={imageComparisonModal.observacoes}
        produtoInfo={imageComparisonModal.produtoInfo}
        onSaveObservacoes={saveObservacoes}
        onDeleteImagemPrincipal={handleDeleteImagemPrincipal}
        onDeleteImagemFornecedor={handleDeleteImagemFornecedor}
        onUploadImagemPrincipal={handleUploadImagemPrincipal}
        onUploadImagemFornecedor={handleUploadImagemFornecedor}
      />
      
      {/* Dialog de Nova Cotação */}
      <Dialog open={showNewCotacaoDialog} onOpenChange={setShowNewCotacaoDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Cotação Internacional</DialogTitle>
            <DialogDescription>
              Preencha as informações básicas da cotação
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="dados-basicos" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dados-basicos">Dados Básicos</TabsTrigger>
              <TabsTrigger value="fornecedor">Fornecedor</TabsTrigger>
              <TabsTrigger value="valores">Valores</TabsTrigger>
              <TabsTrigger value="observacoes">Observações</TabsTrigger>
            </TabsList>
            
            {/* Aba: Dados Básicos */}
            <TabsContent value="dados-basicos" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_cotacao">Número da Cotação *</Label>
                  <Input
                    id="numero_cotacao"
                    value={newCotacaoData.numero_cotacao}
                    onChange={(e) => setNewCotacaoData(prev => ({ ...prev, numero_cotacao: e.target.value }))}
                    placeholder="COT-INT-2025-123456"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data_abertura">Data de Abertura *</Label>
                  <Input
                    id="data_abertura"
                    type="date"
                    value={newCotacaoData.data_abertura}
                    onChange={(e) => setNewCotacaoData(prev => ({ ...prev, data_abertura: e.target.value }))}
                  />
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={newCotacaoData.descricao}
                    onChange={(e) => setNewCotacaoData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Ex: Pedido de produtos para Q1 2025"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newCotacaoData.status}
                    onValueChange={(value: any) => setNewCotacaoData(prev => ({ ...prev, status: value }))}
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
                
                <div className="space-y-2">
                  <Label htmlFor="data_fechamento">Previsão de Chegada</Label>
                  <Input
                    id="data_fechamento"
                    type="date"
                    value={newCotacaoData.data_fechamento}
                    onChange={(e) => setNewCotacaoData(prev => ({ ...prev, data_fechamento: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Aba: Fornecedor */}
            <TabsContent value="fornecedor" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pais_origem">País de Origem *</Label>
                  <Input
                    id="pais_origem"
                    value={newCotacaoData.pais_origem}
                    onChange={(e) => setNewCotacaoData(prev => ({ ...prev, pais_origem: e.target.value }))}
                    placeholder="Ex: China"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="moeda_origem">Moeda de Origem *</Label>
                  <Select
                    value={newCotacaoData.moeda_origem}
                    onValueChange={(value) => setNewCotacaoData(prev => ({ ...prev, moeda_origem: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_CURRENCIES.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.flag} {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            {/* Aba: Valores */}
            <TabsContent value="valores" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fator_multiplicador">Fator Multiplicador</Label>
                <Input
                  id="fator_multiplicador"
                  type="number"
                  step="0.01"
                  value={newCotacaoData.fator_multiplicador}
                  onChange={(e) => setNewCotacaoData(prev => ({ ...prev, fator_multiplicador: parseFloat(e.target.value) || 1 }))}
                />
                <p className="text-sm text-muted-foreground">
                  Fator para ajuste de valores (padrão: 1)
                </p>
              </div>
            </TabsContent>
            
            {/* Aba: Observações */}
            <TabsContent value="observacoes" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={newCotacaoData.observacoes}
                  onChange={(e) => setNewCotacaoData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações adicionais sobre a cotação..."
                  rows={6}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowNewCotacaoDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                // Validar campos obrigatórios
                if (!newCotacaoData.numero_cotacao.trim()) {
                  toast({
                    title: "Erro",
                    description: "Número da cotação é obrigatório",
                    variant: "destructive"
                  });
                  return;
                }
                
                if (!newCotacaoData.descricao.trim()) {
                  toast({
                    title: "Erro",
                    description: "Descrição é obrigatória",
                    variant: "destructive"
                  });
                  return;
                }
                
                try {
                  // Criar cotação com dados básicos
                  const novaCotacao = await secureCreateCotacao({
                    ...newCotacaoData,
                    produtos: [],
                    total_peso_kg: 0,
                    total_cbm: 0,
                    total_quantidade: 0,
                    total_valor_origem: 0,
                    total_valor_usd: 0,
                    total_valor_brl: 0
                  });
                  
                  if (novaCotacao) {
                    toast({
                      title: "Sucesso!",
                      description: "Cotação criada com sucesso"
                    });
                    
                    setShowNewCotacaoDialog(false);
                    onRefresh();
                  }
                } catch (error) {
                  console.error('Erro ao criar cotação:', error);
                  toast({
                    title: "Erro",
                    description: "Não foi possível criar a cotação",
                    variant: "destructive"
                  });
                }
              }}
            >
              Criar Cotação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};