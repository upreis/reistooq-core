import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useHierarchicalCategories } from "@/features/products/hooks/useHierarchicalCategories";
import { downloadFailedItemsReport } from "@/utils/exportUtils";
import * as XLSX from 'xlsx';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  tipo?: 'produtos' | 'composicoes';
  localId?: string;
}

interface ImportResult {
  success: number;
  errors: string[];
  warnings: string[];
  failed: { row: number; data: any; error: string }[];
}

export function ImportModal({ open, onOpenChange, onSuccess, tipo = 'produtos', localId }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importOnlyValid, setImportOnlyValid] = useState(false); // Nova opção
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { createProduct, getProducts } = useProducts();
  const { getCategoriasPrincipais, getCategorias, getSubcategorias } = useHierarchicalCategories();

  const getCompositionColumns = () => {
    const columns = [
      { key: 'produto', label: 'Produto', required: true },
      { key: 'sku_pai', label: 'SKU Pai', required: true },
      { key: 'categoria_principal', label: 'Categoria Principal', required: false },
    ];

    // Adicionar colunas para até 10 componentes
    for (let i = 1; i <= 10; i++) {
      columns.push(
        { key: `sku_componente_${i}`, label: `SKU do componente ${i}`, required: i === 1 },
        { key: `nome_componente_${i}`, label: `Nome do Componente ${i}`, required: false },
        { key: `quantidade_${i}`, label: `quantidade ${i}`, required: i === 1 },
        { key: `uni_medida_${i}`, label: `Uni medida ${i}`, required: false }
      );
    }

    return columns;
  };

  const getProductColumns = () => ([
    { key: 'sku_interno', label: 'SKU Interno', required: true },
    { key: 'nome', label: 'Nome', required: true },
    { key: 'sku_pai', label: 'SKU Pai', required: false },
    { key: 'descricao', label: 'Descrição', required: false },
    { key: 'codigo_barras', label: 'Código de Barras', required: false },
    { key: 'categoria_principal', label: 'Categoria Principal', required: false },
    { key: 'categoria', label: 'Categoria', required: false },
    { key: 'quantidade_atual', label: 'Estoque Atual', required: false },
    { key: 'estoque_minimo', label: 'Estoque Mínimo', required: false },
    { key: 'estoque_maximo', label: 'Estoque Máximo', required: false },
    { key: 'preco_custo', label: 'Preço Custo', required: false },
    { key: 'preco_venda', label: 'Preço Venda', required: false },
    { key: 'peso_liquido', label: 'Peso Líquido (Kg)', required: false },
    { key: 'peso_bruto', label: 'Peso Bruto (Kg)', required: false },
    { key: 'ncm', label: 'NCM', required: false },
    { key: 'codigo_cest', label: 'Código CEST', required: false },
    { key: 'sob_encomenda', label: 'Sob Encomenda', required: false },
    { key: 'dias_preparacao', label: 'Dias para Preparação', required: false },
    { key: 'unidade_medida', label: 'Unidade de Medida', required: false },
    { key: 'localizacao', label: 'Localização', required: false },
    { key: 'numero_volumes', label: 'Nº Volumes', required: false },
    { key: 'tipo_embalagem', label: 'Tipo Embalagem', required: false },
    { key: 'largura', label: 'Largura (cm)', required: false },
    { key: 'altura', label: 'Altura (cm)', required: false },
    { key: 'comprimento', label: 'Comprimento (cm)', required: false },
    { key: 'origem', label: 'Origem', required: false },
    { key: 'ativo', label: 'Status', required: false },
    { key: 'url_imagem', label: 'URL da Imagem', required: false },
  ]);

  const templateColumns = tipo === 'produtos' ? getProductColumns() : getCompositionColumns();

  const downloadTemplate = async () => {
    if (tipo === 'produtos') {
      const exampleRow = [
        'EXEMPLO001',                           // SKU Interno
        'Produto Exemplo',                      // Nome
        '',                                     // SKU Pai (deixe vazio se não for produto filho)
        'Descrição do produto exemplo',         // Descrição
        '1234567890123',                        // Código de Barras
        'Eletrônicos',                          // Categoria Principal
        'Smartphones',                          // Categoria
        '10',                                   // Estoque Atual
        '5',                                    // Estoque Mínimo
        '100',                                  // Estoque Máximo
        '50.00',                                // Preço Custo
        '75.00',                                // Preço Venda
        '0.5',                                  // Peso Líquido (Kg)
        '0.6',                                  // Peso Bruto (Kg)
        '85176990',                             // NCM
        '0100100',                              // Código CEST
        'Não',                                  // Sob Encomenda (Sim/Não)
        '0',                                    // Dias para Preparação
        'UN',                                   // Unidade de Medida
        'Estoque A1',                           // Localização
        '1',                                    // Nº Volumes
        'Caixa',                                // Tipo Embalagem
        '10',                                   // Largura (cm)
        '20',                                   // Altura (cm)
        '15',                                   // Comprimento (cm)
        'Nacional',                             // Origem
        'Ativo',                                // Status
        'https://exemplo.com/imagem.jpg',       // URL da Imagem
      ];

      const wb = XLSX.utils.book_new();

      // Aba principal com template
      const ws = XLSX.utils.aoa_to_sheet([
        templateColumns.map(col => col.label),
        exampleRow
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Template');

      // Aba com categorias disponíveis (para referência)
      const categoriasPrincipais = getCategoriasPrincipais();
      if (categoriasPrincipais.length > 0) {
        const categoriasData = [
          ['Categorias Principais Disponíveis'],
          ...categoriasPrincipais.map(cat => [cat.nome])
        ];
        const wsCategorias = XLSX.utils.aoa_to_sheet(categoriasData);
        XLSX.utils.book_append_sheet(wb, wsCategorias, 'Categorias Principais');

        // Buscar todas as categorias de nível 2 e 3 para mostrar exemplos
        const allCategorias = categoriasPrincipais.flatMap(catPrincipal => {
          const cats = getCategorias(catPrincipal.id);
          return cats.map(cat => ({
            principal: catPrincipal.nome,
            categoria: cat.nome,
            subcategorias: getSubcategorias(cat.id).map(sub => sub.nome)
          }));
        });

        if (allCategorias.length > 0) {
          const exemploData = [
            ['Categoria Principal', 'Categoria', 'Subcategorias Disponíveis'],
            ...allCategorias.map(item => [
              item.principal,
              item.categoria, 
              item.subcategorias.join(', ')
            ])
          ];
          const wsExemplos = XLSX.utils.aoa_to_sheet(exemploData);
          XLSX.utils.book_append_sheet(wb, wsExemplos, 'Estrutura Hierárquica');
        }
      }

      // Aba com instruções
      const instrucoes = [
        ['INSTRUÇÕES PARA PREENCHIMENTO'],
        [''],
        ['1. SKU Interno e Nome são obrigatórios'],
        ['2. SKU Pai é opcional - use apenas se este produto for FILHO de outro:'],
        ['   • Exemplo: Se "FL-14-TRAN-1" é filho de "FL-14-TRAN"'],
        ['   • Preencha SKU Pai = "FL-14-TRAN"'],
        ['   • Deixe vazio se o produto não tiver pai'],
        ['3. Categorias são opcionais mas devem seguir a hierarquia:'],
        ['   • Categoria Principal (Ex: Eletrônicos)'],
        ['   • Categoria (Ex: Smartphones)'], 
        ['4. Use as categorias das abas "Categorias Principais" e "Estrutura Hierárquica"'],
        ['5. Se não existir a categoria desejada, crie primeiro em /estoque/categorias'],
        ['6. Preços são opcionais (deixe em branco se não tiver)'],
        ['7. URL da imagem deve ser um link válido (opcional)'],
        [''],
        ['HIERARQUIA DE PRODUTOS (Produto Pai/Filho):'],
        ['• Produto Pai: SKU = "CMD-29", SKU Pai = (vazio)'],
        ['• Produto Filho: SKU = "CMD-29-VERD-1", SKU Pai = "CMD-29"'],
        ['• Produto Filho: SKU = "CMD-29-AZUL-1", SKU Pai = "CMD-29"'],
        [''],
        ['EXEMPLO DE CATEGORIZAÇÃO:'],
        ['• Categoria Principal: Eletrônicos'],
        ['• Categoria: Smartphones'],
        ['• Resultado: "Eletrônicos → Smartphones"'],
      ];
      const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoes);
      XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Instruções');

      XLSX.writeFile(wb, 'template_produtos.xlsx');
    } else {
      // Para composições, criar template mais completo
      try {
        // Buscar unidades de medida disponíveis
        const { data: unidades } = await supabase
          .from('unidades_medida')
          .select('nome, abreviacao, tipo')
          .eq('ativo', true)
          .order('tipo', { ascending: true })
          .order('nome', { ascending: true });

        const wb = XLSX.utils.book_new();

        // Aba principal com template
        const exampleRow = [
          'KIT BOMBA DE ENCHER BECHIGA', // Produto
          'FL-003-ROSA-10', // SKU Pai
          'Festas', // Categoria Principal
          'FL-003-ROSA-1', // SKU do componente 1
          'BOMBA DE ENCHER MANUAL', // Nome do Componente 1
          '10', // quantidade 1
          'Unidade', // Uni medida 1
          '', '', '', '', // componente 2
          '', '', '', '', // componente 3
          '', '', '', '', // componente 4
          '', '', '', '', // componente 5
          '', '', '', '', // componente 6
          '', '', '', '', // componente 7
          '', '', '', '', // componente 8
          '', '', '', '', // componente 9
          '', '', '', '', // componente 10
        ];

        const ws = XLSX.utils.aoa_to_sheet([
          templateColumns.map(col => col.label),
          exampleRow
        ]);

        XLSX.utils.book_append_sheet(wb, ws, 'Template');

        // Aba com unidades de medida disponíveis
        if (unidades && unidades.length > 0) {
          const unidadesData = [
            ['Nome', 'Abreviação', 'Tipo'],
            ...unidades.map(u => [u.nome, u.abreviacao, u.tipo])
          ];
          
          const wsUnidades = XLSX.utils.aoa_to_sheet(unidadesData);
          XLSX.utils.book_append_sheet(wb, wsUnidades, 'Unidades de Medida');
        }

        // Aba com instruções
        const instrucoes = [
          ['INSTRUÇÕES PARA PREENCHIMENTO'],
          [''],
          ['1. Preencha o SKU Pai do produto que será a composição'],
          ['2. Para cada componente, preencha SKU, Nome, Quantidade e Unidade de Medida'],
          ['3. Você pode adicionar até 10 componentes por produto'],
          ['4. Use apenas as unidades de medida da aba "Unidades de Medida"'],
          ['5. Campos obrigatórios: Produto, SKU Pai, SKU do componente 1, quantidade 1'],
          ['6. Deixe em branco os componentes que não serão utilizados'],
          [''],
          ['EXEMPLO:'],
          ['- Produto: KIT BOMBA DE ENCHER BECHIGA'],
          ['- SKU Pai: FL-003-ROSA-10'],
          ['- Componente 1: FL-003-ROSA-1 (10 Unidades)'],
          ['- Demais componentes: deixar em branco se não utilizados'],
        ];

        const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoes);
        XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Instruções');

        XLSX.writeFile(wb, 'template_composicoes.xlsx');
      } catch (error) {
        console.error('Erro ao gerar template:', error);
        toast({
          title: "Erro",
          description: "Erro ao gerar template de composições.",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Template baixado",
      description: `Template para importação de ${tipo} foi baixado com sucesso.`,
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls).",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const validateRow = (row: any, index: number, mode: 'produtos' | 'composicoes' = tipo): string[] => {
    const errors: string[] = [];
    
    if (mode === 'produtos') {
      if (!row.sku_interno || String(row.sku_interno).trim() === '') {
        errors.push(`Linha ${index + 2}: SKU Interno é obrigatório`);
      }
      
      if (!row.nome || String(row.nome).trim() === '') {
        errors.push(`Linha ${index + 2}: Nome é obrigatório`);
      }

      // Validar URL da imagem se fornecida
      if (row.url_imagem && String(row.url_imagem).trim() !== '') {
        try {
          new URL(String(row.url_imagem).trim());
        } catch {
          errors.push(`Linha ${index + 2}: URL da imagem inválida`);
        }
      }

      // Validar tipos numéricos
      const numericFields = ['quantidade_atual', 'estoque_minimo', 'estoque_maximo', 'preco_custo', 'preco_venda'];
      numericFields.forEach(field => {
        if (row[field] !== undefined && row[field] !== '' && isNaN(Number(row[field]))) {
          errors.push(`Linha ${index + 2}: ${field} deve ser um número`);
        }
      });
    } else {
      // Validação para composições
      if (!row.produto || String(row.produto).trim() === '') {
        errors.push(`Linha ${index + 2}: Produto é obrigatório`);
      }
      
      if (!row.sku_pai || String(row.sku_pai).trim() === '') {
        errors.push(`Linha ${index + 2}: SKU Pai é obrigatório`);
      }
      
      if (!row.sku_componente_1 || String(row.sku_componente_1).trim() === '') {
        errors.push(`Linha ${index + 2}: SKU do componente 1 é obrigatório`);
      }
      
      if (!row.quantidade_1 || isNaN(Number(row.quantidade_1)) || Number(row.quantidade_1) <= 0) {
        errors.push(`Linha ${index + 2}: quantidade 1 deve ser um número maior que 0`);
      }
      
      // Validar componentes adicionais se fornecidos
      for (let i = 2; i <= 10; i++) {
        const skuComponente = row[`sku_componente_${i}`];
        const quantidade = row[`quantidade_${i}`];
        
        if (skuComponente && String(skuComponente).trim() !== '') {
          if (!quantidade || isNaN(Number(quantidade)) || Number(quantidade) <= 0) {
            errors.push(`Linha ${index + 2}: quantidade ${i} deve ser um número maior que 0 quando SKU do componente ${i} for informado`);
          }
        }
      }
    }

    return errors;
  };

  const processImport = async () => {
    if (!file) {
      console.error('❌ processImport: Nenhum arquivo selecionado!');
      return;
    }

    console.log('🚀 ========== INÍCIO DA IMPORTAÇÃO ==========');
    console.log('📁 Arquivo:', {
      nome: file.name,
      tamanho: file.size,
      tipo: file.type
    });

    setIsProcessing(true);
    setProgress(0);
    
    try {
      console.log('📂 Lendo arquivo como ArrayBuffer...');
      const data = await file.arrayBuffer();
      console.log('✅ ArrayBuffer criado. Tamanho:', data.byteLength);
      
      console.log('📊 Lendo workbook Excel...');
      const workbook = XLSX.read(data);
      console.log('✅ Workbook lido. Sheets:', workbook.SheetNames);

      // Normalizador de texto para cabeçalhos
      const normalize = (s: any) => String(s || '').toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .replace(/[\-_]+/g, ' ')
        .replace(/\s+/g, ' ').trim();

      // Escolher a aba com maior correspondência considerando ambos os formatos
      const produtosHeaders = getProductColumns().map(c => normalize(c.label));
      const composicoesHeaders = getCompositionColumns().map(c => normalize(c.label));
      const expectedHeaders = Array.from(new Set([...produtosHeaders, ...composicoesHeaders]));

      let bestSheet = workbook.SheetNames[0];
      let bestScore = -1;
      for (const name of workbook.SheetNames) {
        const ws = workbook.Sheets[name];
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        const headersRow = (aoa?.[0] || []).map((h: any) => normalize(h));
        const score = headersRow.filter((h: string) => expectedHeaders.includes(h)).length;
        if (score > bestScore) { bestScore = score; bestSheet = name; }
      }

      const worksheet = workbook.Sheets[bestSheet];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      if (jsonData.length === 0) {
        throw new Error("Planilha vazia ou formato inválido");
      }

      // Detectar automaticamente o tipo a partir dos cabeçalhos
      const aoaSelected = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      const headersNorm = (aoaSelected?.[0] || []).map((h: any) => normalize(h));
      
      // Composições TEM "SKU do componente 1" (obrigatório para composições)
      // Produtos podem ter "SKU Pai" para hierarquia, mas NÃO têm "SKU do componente 1"
      const isComposicoesSheet = headersNorm.includes(normalize('SKU do componente 1'));
      const isProdutosSheet = headersNorm.includes(normalize('SKU Interno')) && headersNorm.includes(normalize('Nome'));
      
      const importMode: 'produtos' | 'composicoes' = isComposicoesSheet ? 'composicoes' : (isProdutosSheet ? 'produtos' : tipo);
      
      if (importMode !== tipo) {
        toast({ title: 'Tipo detectado automaticamente', description: `Detectamos um arquivo de ${importMode}. Vamos importar nesse modo.` });
      }

      const columnsToUse = importMode === tipo ? templateColumns : (importMode === 'produtos' ? getProductColumns() : getCompositionColumns());

      // Aliases apenas para produtos (planilhas do estoque variam bastante)
      const aliasMap: Record<string, string[]> = importMode === 'produtos' ? {
        sku_interno: ['sku', 'sku interno', 'sku do produto', 'sku produto', 'sku estoque', 'sku_interno', 'sku-interno'],
        nome: ['nome', 'nome do produto', 'produto', 'titulo', 'título'],
        sku_pai: ['sku pai', 'sku_pai', 'sku-pai', 'pai', 'produto pai'],
      } : {};

      // Mapeamento tolerante usando os cabeçalhos da planilha
      const mappedData = (XLSX.utils.sheet_to_json(worksheet) as any[]).map((row: any, rowIndex: number) => {
        const mappedRow: any = {};
        const headerMap: Record<string, string> = {};
        Object.keys(row).forEach((h) => { headerMap[normalize(h)] = h; });

        // 🔍 DEBUG: Log dos cabeçalhos da planilha (primeira linha apenas)
        if (rowIndex === 0) {
          console.log('🔍 [IMPORT DEBUG] Cabeçalhos originais da planilha:', Object.keys(row));
          console.log('🔍 [IMPORT DEBUG] Cabeçalhos normalizados:', Object.keys(headerMap));
          console.log('🔍 [IMPORT DEBUG] Colunas esperadas:', columnsToUse.map(c => ({ key: c.key, label: c.label, normalized: normalize(c.label) })));
        }

        columnsToUse.forEach(col => {
          let value: any = '';
          const primary = headerMap[normalize(col.label)];
          if (primary) {
            value = row[primary];
          } else if (aliasMap[col.key]) {
            for (const alias of aliasMap[col.key]) {
              const key = headerMap[normalize(alias)];
              if (key) { value = row[key]; break; }
            }
          }
          mappedRow[col.key] = value ?? '';
          
          // 🔍 DEBUG: Log do mapeamento (primeira linha apenas)
          if (rowIndex === 0 && (col.key === 'sku_interno' || col.key === 'nome')) {
            console.log(`🔍 [IMPORT DEBUG] Mapeamento ${col.key}:`, {
              label: col.label,
              labelNormalized: normalize(col.label),
              foundHeader: primary,
              value: value
            });
          }
        });
        return mappedRow;
      });

      // Validar dados
      let allErrors: string[] = [];
      const validRows: any[] = [];
      const failedRows: { row: number; data: any; error: string }[] = [];

      let warnings: string[] = [];
      let rowsToCreate: any[] = [];
      let rowsToReactivate: { id: string; data: any }[] = [];
      // Armazenar pais (kits) detectados durante o pré-processamento das composições
      let parentRows: Record<string, { nome: string; categoria_principal: string | null }> = {};
      let existingMap: Record<string, any> = {}; // ✅ Declarar fora do if para ficar acessível
      
      if (importMode === 'produtos') {
        // Verificar SKUs duplicados na planilha
        const skus = mappedData.map(row => row.sku_interno).filter(Boolean);
        const duplicateSkus = skus.filter((sku, index) => skus.indexOf(sku) !== index);
        if (duplicateSkus.length > 0) {
          allErrors.push(`SKUs duplicados na planilha: ${[...new Set(duplicateSkus)].join(', ')}`);
          setResult({ success: 0, errors: allErrors, warnings: [], failed: [] });
          return;
        }

        // Verificar SKUs existentes no banco (apenas da organização atual, respeitando RLS)
        const uniqueSkus = Array.from(new Set(skus));
        const { data: existingProducts, error: existingError } = await supabase
          .from('produtos')
          .select('*')  // ✅ Buscar TODOS os campos para fazer merge inteligente
          .in('sku_interno', uniqueSkus);
          
        if (existingError) {
          console.error('Erro ao buscar produtos existentes:', existingError);
          throw new Error('Erro ao verificar produtos existentes');
        }
        
        existingMap = Object.fromEntries(
          (existingProducts || []).map((p: any) => [p.sku_interno, p])
        );
        
        const existingSkusList = Object.keys(existingMap);
        
        console.log('SKUs no arquivo:', skus);
        console.log('SKUs existentes no sistema:', existingSkusList);
        
        // ✅ MODO UPSERT: Atualizar existentes + Criar novos
        if (existingSkusList.length > 0) {
          warnings.push(
            `📝 ${existingSkusList.length} SKU(s) já existem e serão ATUALIZADOS com os novos dados da planilha. ` +
            `Campos vazios na planilha manterão os valores atuais do sistema.`
          );
        }

        mappedData.forEach((row, index) => {
          const rowErrors = validateRow(row, index, 'produtos');
          const existing = existingMap[row.sku_interno];
          
          // 🔍 DEBUG: Log cada linha processada (COMPLETO)
          if (index < 5) {
            console.log(`🔍 [LINHA ${index + 2}] Dados mapeados:`, {
              sku_interno: `"${row.sku_interno}"`,
              nome: `"${row.nome}"`,
              sku_pai: `"${row.sku_pai}"`,
              temSku: !!row.sku_interno,
              temNome: !!row.nome,
              tipoSku: typeof row.sku_interno,
              tipoNome: typeof row.nome,
              errors: rowErrors
            });
          }
          
          // Montar categoria completa hierárquica
          const categoriaParts = [];
          if (row.categoria_principal?.trim()) categoriaParts.push(row.categoria_principal.trim());
          if (row.categoria?.trim()) categoriaParts.push(row.categoria.trim());  
          const categoriaCompleta = categoriaParts.length > 0 ? categoriaParts.join(" → ") : null;
          
          // ✅ MERGE INTELIGENTE: Planilha sobrescreve, mas mantém valores existentes se campo vazio
          const mergeField = (newValue: any, existingValue: any, isNumeric = false) => {
            // Se há valor na planilha, usar ele
            if (newValue !== null && newValue !== undefined && newValue !== '') {
              return isNumeric ? Number(newValue) : newValue;
            }
            // Se planilha está vazia mas existe valor no banco, manter valor do banco
            if (existing && existingValue !== null && existingValue !== undefined) {
              return existingValue;
            }
            // Se ambos vazios, usar valor padrão
            return isNumeric ? 0 : null;
          };
          
          const normalized = {
            sku_interno: row.sku_interno?.trim(),
            nome: row.nome?.trim() || (existing?.nome || ''),
            sku_pai: row.sku_pai?.trim() || null,
            categoria: categoriaCompleta || existing?.categoria || null,
            descricao: mergeField(row.descricao?.trim(), existing?.descricao),
            url_imagem: mergeField(row.url_imagem?.trim(), existing?.url_imagem),
            quantidade_atual: mergeField(row.quantidade_atual, existing?.quantidade_atual, true),
            estoque_minimo: mergeField(row.estoque_minimo, existing?.estoque_minimo, true),
            estoque_maximo: mergeField(row.estoque_maximo, existing?.estoque_maximo, true),
            preco_custo: row.preco_custo !== '' && row.preco_custo !== undefined 
              ? Number(row.preco_custo) 
              : (existing?.preco_custo || null),
            preco_venda: row.preco_venda !== '' && row.preco_venda !== undefined 
              ? Number(row.preco_venda) 
              : (existing?.preco_venda || null),
            codigo_barras: mergeField(row.codigo_barras?.trim(), existing?.codigo_barras),
            localizacao: mergeField(row.localizacao?.trim(), existing?.localizacao),
            status: 'ativo',
            ativo: true,
          };
          
          if (rowErrors.length === 0) {
            if (!existing) {
              // ✅ Produto novo: criar
              console.log(`✅ Produto novo (será criado): ${normalized.sku_interno}`);
              rowsToCreate.push(normalized);
            } else if (!existing.ativo) {
              // ✅ Produto inativo: reativar e atualizar
              console.log(`🔄 Produto inativo (será reativado): ${normalized.sku_interno}`);
              rowsToReactivate.push({ id: existing.id, data: normalized });
            } else {
              // ✅ Produto ativo: atualizar (UPSERT)
              console.log(`🔄 Produto ativo (será atualizado): ${normalized.sku_interno}`);
              rowsToReactivate.push({ id: existing.id, data: normalized });
            }
          } else {
            console.error(`❌ Linha ${index + 1} com erros:`, rowErrors);
            allErrors.push(...rowErrors);
            failedRows.push({
              row: index + 2,
              data: row,
              error: rowErrors.join('; ')
            });
          }
        });

        console.log(`A reativar: ${rowsToReactivate.length} | A criar: ${rowsToCreate.length}`);
        
        // 🔍 DEBUG: Mostrar primeiros produtos a criar COM SKU PAI
        if (rowsToCreate.length > 0) {
          console.log('✅ Produtos VÁLIDOS a criar:', rowsToCreate.slice(0, 3).map(p => ({
            sku: p.sku_interno,
            nome: p.nome,
            sku_pai: p.sku_pai
          })));
        } else {
          console.warn('⚠️ NENHUM produto válido para criar!');
        }
        
        if (rowsToReactivate.length > 0) {
          console.log('✅ Produtos a atualizar:', rowsToReactivate.slice(0, 3).map(r => r.data));
        }

        if (allErrors.length > 0) {
          console.error('❌ Erros de validação encontrados:', allErrors);
          setResult({ success: 0, errors: allErrors, warnings: [], failed: failedRows });
          return;
        }
        
        // 🔍 DEBUG: Verificar se há produtos para processar
        if (rowsToCreate.length === 0 && rowsToReactivate.length === 0) {
          console.error('❌ PROBLEMA: Nenhum produto para processar!', {
            mappedDataLength: mappedData.length,
            skusLength: skus.length,
            existingMapSize: Object.keys(existingMap).length
          });
        }
      } else {
        // Para composições, processar múltiplos componentes por linha
        const expandedData: any[] = [];
        // Guardar informações do SKU Pai (kit) para cadastrar em produtos_composicoes
        mappedData.forEach((row, index) => {
          const rowErrors = validateRow(row, index);
          if (rowErrors.length > 0) {
            allErrors.push(...rowErrors);
            failedRows.push({ row: index + 2, data: row, error: rowErrors.join('; ') });
          }
          
          // Registrar informações do SKU Pai (apenas se não existir ainda)
          if (row.sku_pai && row.produto && !parentRows[row.sku_pai.trim()]) {
            parentRows[row.sku_pai.trim()] = {
              nome: row.produto.trim(),
              categoria_principal: (row.categoria_principal?.trim() || null)
            };
          }
          
          // Expandir cada linha em múltiplas composições
          for (let i = 1; i <= 10; i++) {
            const skuComponente = row[`sku_componente_${i}`];
            const nomeComponente = row[`nome_componente_${i}`];
            const quantidade = row[`quantidade_${i}`];
            const uniMedida = row[`uni_medida_${i}`];
            
            if (skuComponente && skuComponente.trim() !== '' && quantidade && Number(quantidade) > 0) {
              expandedData.push({
                sku_produto: row.sku_pai.trim(),
                sku_componente: skuComponente.trim(),
                nome_componente: nomeComponente?.trim() || skuComponente.trim(),
                quantidade: Number(quantidade),
                unidade_medida_id: uniMedida?.trim() || null,
              });
            }
          }
        });

        if (allErrors.length > 0) {
          setResult({ success: 0, errors: allErrors, warnings: [], failed: failedRows });
          return;
        }
        
        // Atualizar mappedData com os dados expandidos
        mappedData.length = 0;
        mappedData.push(...expandedData);
        
        // Obter organização do usuário atual (para upsert de pais e componentes)
      }

      if (tipo === 'produtos') {
        // Processar produtos válidos
        let successCount = 0;
        let errorCount = 0;
        const processingErrors: string[] = [];

        const totalToProcess = rowsToReactivate.length + rowsToCreate.length;
        let processed = 0;

        console.log('📊 Iniciando processamento:', {
          atualizar: rowsToReactivate.length,
          criar: rowsToCreate.length,
          total: totalToProcess
        });
        
        if (rowsToCreate.length > 0) {
          console.log('📝 Primeiros 3 produtos a criar:', rowsToCreate.slice(0, 3).map(p => ({
            sku: p.sku_interno,
            nome: p.nome,
            quantidade: p.quantidade_atual
          })));
        }

        // ✅ BUSCAR DADOS DO USUÁRIO E LOCAL PRINCIPAL UMA VEZ SÓ (FORA DO LOOP)
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        
        let localPrincipalId: string | null = null;
        let orgId: string | null = null;
        
        if (userId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('organizacao_id')
            .eq('id', userId)
            .single();
          
          orgId = profileData?.organizacao_id || null;
          
          if (orgId) {
            // Buscar apenas o LOCAL PRINCIPAL (tipo = 'principal')
            const { data: localPrincipal } = await supabase
              .from('locais_estoque')
              .select('id, nome')
              .eq('organization_id', orgId)
              .eq('tipo', 'principal')
              .eq('ativo', true)
              .maybeSingle();
            
            localPrincipalId = localPrincipal?.id || null;
            
            if (localPrincipalId) {
              console.log(`✅ Local Principal encontrado: ${localPrincipal.nome}`);
            } else {
              console.warn('⚠️ Nenhum local principal encontrado. Produtos serão criados sem estoque_por_local.');
            }
          }
        }

        // 🆕 CRIAR PRODUTOS PAI AUTOMATICAMENTE SE NÃO EXISTIREM
        const skusPaiUnicos = [...new Set(
          [...rowsToCreate, ...rowsToReactivate.map(r => r.data)]
            .map(p => p.sku_pai)
            .filter(Boolean)
        )];

        if (skusPaiUnicos.length > 0) {
          console.log('👨‍👧‍👦 SKUs Pai detectados:', skusPaiUnicos);
          
          // Verificar quais SKUs Pai JÁ existem
          const { data: paiExistentes } = await supabase
            .from('produtos')
            .select('sku_interno')
            .in('sku_interno', skusPaiUnicos);
          
          const skusPaiExistentes = new Set((paiExistentes || []).map(p => p.sku_interno));
          const skusPaiFaltantes = skusPaiUnicos.filter(sku => !skusPaiExistentes.has(sku));

          if (skusPaiFaltantes.length > 0) {
            console.log('🔨 Criando produtos pai automaticamente:', skusPaiFaltantes);
            
            for (const skuPai of skusPaiFaltantes) {
              // Pegar o primeiro filho para extrair o nome base
              const primeiroFilho = [...rowsToCreate, ...rowsToReactivate.map(r => r.data)]
                .find(p => p.sku_pai === skuPai);
              
              if (primeiroFilho) {
                // Remover variação do nome (ex: "KIT XYZ - AZUL" -> "KIT XYZ")
                let nomePai = primeiroFilho.nome;
                // Remover últimas palavras que parecem variações (cores, números, etc)
                nomePai = nomePai.replace(/\s*-\s*[A-Z]+\s*(ESCURO|CLARO)?$/i, '');
                
                try {
                  await createProduct({
                    sku_interno: skuPai,
                    nome: nomePai,
                    categoria: primeiroFilho.categoria || null,
                    descricao: `Produto pai criado automaticamente`,
                    codigo_barras: null,
                    quantidade_atual: 0, // Pai não tem estoque próprio
                    estoque_minimo: 0,
                    estoque_maximo: 0,
                    preco_custo: primeiroFilho.preco_custo || null,
                    preco_venda: primeiroFilho.preco_venda || null,
                    localizacao: null,
                    unidade_medida_id: primeiroFilho.unidade_medida_id || null,
                    status: 'ativo',
                    ativo: true,
                    url_imagem: null,
                    sku_pai: null,
                    eh_produto_pai: true
                  });
                  console.log(`✅ Produto pai criado: ${skuPai} - ${nomePai}`);
                  warnings.push(`✨ Produto pai "${skuPai}" foi criado automaticamente`);
                } catch (error: any) {
                  console.error(`❌ Erro ao criar produto pai ${skuPai}:`, error);
                  warnings.push(`⚠️ Não foi possível criar produto pai "${skuPai}" automaticamente. Vincule manualmente depois.`);
                }
              }
            }
          }
        }

        // Atualizar/Reativar produtos existentes (UPSERT)
        for (let i = 0; i < rowsToReactivate.length; i++) {
          const { id, data: updates } = rowsToReactivate[i];
          try {
            const existingProduct = Object.values(existingMap).find((p: any) => p.id === id) as any;
            const action = existingProduct?.ativo ? 'Atualizando' : 'Reativando';
            console.log(`${action} produto ${i + 1}/${rowsToReactivate.length}: ${updates.sku_interno}`);
            
            const { error } = await supabase
              .from('produtos')
              .update({ ...updates, ativo: true, status: 'ativo' })
              .eq('id', id);
            if (error) throw error;
            
            // ✅ CRIAR/ATUALIZAR estoque_por_local APENAS NO ESTOQUE PRINCIPAL
            if (localPrincipalId && orgId) {
              const { error: estoqueError } = await supabase
                .from('estoque_por_local')
                .upsert({
                  produto_id: id,
                  local_id: localPrincipalId,
                  quantidade: updates.quantidade_atual || 0,
                  organization_id: orgId
                }, { 
                  onConflict: 'produto_id,local_id',
                  ignoreDuplicates: false 
                });
              
              if (estoqueError) {
                console.warn('⚠️ Erro ao atualizar estoque_por_local:', estoqueError);
              }
            }
            
            successCount++;
          } catch (error: any) {
            errorCount++;
            processingErrors.push(`Erro ao atualizar produto ${rowsToReactivate[i].data.sku_interno}: ${error.message || 'Erro desconhecido'}`);
          } finally {
            processed++;
            setProgress((processed / Math.max(1, totalToProcess)) * 100);
          }
        }

        // Criar novos produtos  
        // ✅ createProduct já cria estoque_por_local automaticamente
        for (let i = 0; i < rowsToCreate.length; i++) {
          try {
            console.log(`🔨 Criando produto ${i + 1}/${rowsToCreate.length}:`, {
              sku: rowsToCreate[i].sku_interno,
              nome: rowsToCreate[i].nome,
              sku_pai: rowsToCreate[i].sku_pai,
              quantidade: rowsToCreate[i].quantidade_atual
            });
            
            const resultado = await createProduct(rowsToCreate[i]);
            console.log(`✅ Produto criado com sucesso:`, resultado);
            successCount++;
          } catch (error: any) {
            errorCount++;
            console.error(`❌ ERRO ao criar produto ${rowsToCreate[i].sku_interno}:`, {
              error,
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            });
            
            if (error.code === '23505') {
              // Chave duplicada - mantemos como aviso silencioso
              console.warn('Chave duplicada detectada (23505)');
            } else {
              processingErrors.push(`❌ Erro ao criar produto ${rowsToCreate[i].sku_interno}: ${error.message || 'Erro desconhecido'}`);
            }
          } finally {
            processed++;
            setProgress((processed / Math.max(1, totalToProcess)) * 100);
          }
        }

        setResult({
          success: successCount,
          errors: processingErrors,
          warnings: warnings,
          failed: []
        });

        const updatedCount = rowsToReactivate.length;
        const createdCount = rowsToCreate.length;
        
        if (successCount > 0) {
          const detalhes = [];
          if (createdCount > 0) detalhes.push(`${createdCount} criado(s)`);
          if (updatedCount > 0) detalhes.push(`${updatedCount} atualizado(s)`);
          
          toast({
            title: "✅ Importação concluída!",
            description: `${successCount} produto(s) processado(s): ${detalhes.join(', ')}\n\n⚠️ IMPORTANTE: Se não aparecerem:\n1. Verifique filtros (categoria, status, busca)\n2. Confirme local de estoque selecionado`,
            duration: 8000,
          });
          onSuccess();
        } else if (errorCount === 0 && totalToProcess === 0) {
          toast({
            title: "⚠️ Nenhum produto processado",
            description: "Não havia produtos válidos para importar na planilha.",
            variant: "destructive",
            duration: 8000,
          });
        }
      } else {
        // Processar composições
        let successCount = 0;
        const processingErrors: string[] = [];
        
        // Verificar se os SKUs de componentes existem no cadastro de produtos
        const componentSkus = [...new Set(
          mappedData.map(row => row.sku_componente).filter(Boolean)
        )];
        
        const { data: existingComponents, error: existingError } = await supabase
          .from('produtos')
          .select('sku_interno')
          .in('sku_interno', componentSkus);
        
        if (existingError) {
          throw new Error('Erro ao verificar componentes existentes');
        }
        
        const existingSkuSet = new Set((existingComponents || []).map(p => p.sku_interno));
        
        // Identificar componentes não cadastrados para avisos (mas não impedir importação)
        const parentSkus = new Set(Object.keys(parentRows));
        const missingComponents = new Set<string>();
        
        for (let i = 0; i < mappedData.length; i++) {
          const row = mappedData[i];
          // SKU componente deve existir no cadastro OU ser um SKU pai OU ser auto-referência (componente == produto)
          const isSelfReference = row.sku_componente === row.sku_produto;
          if (!existingSkuSet.has(row.sku_componente) && !parentSkus.has(row.sku_componente) && !isSelfReference) {
            missingComponents.add(row.sku_componente);
            // Para componentes não encontrados, usar o próprio SKU como nome (para aparecer como "NÃO CADASTRADO" na UI)
            row.nome_componente = row.sku_componente;
          }
        }
        
        if (missingComponents.size > 0) {
          warnings.push(
            `⚠️ ${missingComponents.size} componente(s) não encontrado(s) no controle de estoque serão importados como "NÃO CADASTRADO": ${Array.from(missingComponents).join(', ')}. ` +
            `Use o botão "+ Cadastrar" para registrá-los no estoque.`
          );
        }
        
        // Apenas interromper se há outros tipos de erros (não relacionados a componentes não encontrados)
        const nonComponentErrors = allErrors.filter(error => !error.includes('SKU Componente não encontrado'));
        if (nonComponentErrors.length > 0) {
          setResult({ success: 0, errors: nonComponentErrors, warnings: [], failed: failedRows });
          return;
        }
        
        // Converter "Uni medida" textual para ID da unidade de medida
        try {
          const { data: unidades } = await supabase
            .from('unidades_medida')
            .select('id, nome, abreviacao')
            .eq('ativo', true);

          const unidadeMap = new Map<string, string>();
          (unidades || []).forEach((u: any) => {
            if (u.nome) unidadeMap.set(String(u.nome).trim().toLowerCase(), u.id);
            if (u.abreviacao) unidadeMap.set(String(u.abreviacao).trim().toLowerCase(), u.id);
          });

          mappedData.forEach((row: any) => {
            if (row.unidade_medida_id) {
              const key = String(row.unidade_medida_id).trim().toLowerCase();
              const id = unidadeMap.get(key);
              if (id) {
                row.unidade_medida_id = id;
              } else {
                warnings.push(`Unidade de medida "${row.unidade_medida_id}" não encontrada para ${row.sku_produto} -> ${row.sku_componente}. Definido como vazio.`);
                row.unidade_medida_id = null;
              }
            }
          });
        } catch (e) {
          console.warn('Não foi possível mapear unidades de medida, prosseguindo sem ID.', e);
        }

        // Buscar organization_id do usuário atual
        const { data: profileData } = await supabase
          .from('profiles')
          .select('organizacao_id')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();
          
        if (!profileData?.organizacao_id) {
          throw new Error('Organização não encontrada');
        }

        // Cadastrar/atualizar os SKUs Pai em produtos_composicoes (apenas após validação)
        const parentsToUpsert = Object.entries(parentRows).map(([sku, info]) => ({
          sku_interno: sku,
          nome: info.nome,
          categoria_principal: info.categoria_principal,
          organization_id: profileData.organizacao_id,
        }));
        if (parentsToUpsert.length > 0) {
          const { error: upsertParentsError } = await supabase
            .from('produtos_composicoes')
            .upsert(parentsToUpsert, { onConflict: 'sku_interno,organization_id' });
          if (upsertParentsError) throw upsertParentsError;
        }

        // Processar cada composição
        for (let i = 0; i < mappedData.length; i++) {
          const row = mappedData[i];
          try {
            // Verificar se localId está presente
            if (!localId) {
              console.warn(`Linha ${i + 1}: Local de estoque não definido`);
              successCount++;
              continue;
            }

            const { error } = await supabase
              .from('produto_componentes')
              .upsert({
                sku_produto: row.sku_produto.trim(),
                sku_componente: row.sku_componente.trim(),
                nome_componente: row.sku_componente.trim(),
                quantidade: Number(row.quantidade),
                unidade_medida_id: row.unidade_medida_id?.trim() || null,
                organization_id: profileData.organizacao_id,
                local_id: localId
              }, {
                onConflict: 'organization_id,sku_produto,sku_componente,local_id'
              });
              
            if (error) throw error;
            successCount++;
          } catch (error: any) {
            processingErrors.push(`Erro ao processar linha ${i + 2} (${row.sku_produto} -> ${row.sku_componente}): ${error.message}`);
            failedRows.push({ row: i + 2, data: row, error: error.message || 'Erro desconhecido' });
          }
          
          setProgress(((i + 1) / mappedData.length) * 100);
        }
        
        setResult({
          success: successCount,
          errors: processingErrors,
          warnings: warnings,
          failed: failedRows
        });

        if (successCount > 0) {
          toast({
            title: "Importação concluída",
            description: `${successCount} composição(ões) importada(s) com sucesso.`,
          });
          onSuccess();
        }
      }

    } catch (error) {
      console.error('Erro na importação:', error);
      setResult({
        success: 0,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
        warnings: [],
        failed: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setImportOnlyValid(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetModal();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar {tipo === 'produtos' ? 'Produtos' : 'Composições'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instruções */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>📋 Formato do Arquivo:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Use apenas arquivos Excel (.xlsx ou .xls)</li>
                {tipo === 'produtos' ? (
                  <>
                    <li><strong>Campos OBRIGATÓRIOS:</strong> "SKU Interno" e "Nome"</li>
                    <li><strong>Todos os outros campos são OPCIONAIS</strong> (deixe vazio se não souber)</li>
                    <li>SKUs devem ser únicos <strong>dentro da planilha</strong></li>
                    <li>Se SKU já existe no sistema → <strong>ATUALIZA</strong> o produto</li>
                    <li>Campos vazios na planilha → <strong>MANTÉM</strong> valores do sistema</li>
                    <li>Produtos vão para <strong>Estoque Principal</strong> automaticamente</li>
                    <li>Números podem usar ponto ou vírgula: 10.5 ou 10,5</li>
                    <li>URL da Imagem deve ser link completo ou vazio</li>
                  </>
                ) : (
                  <>
                    <li>SKU Pai (kit), SKU Componente e Quantidade são obrigatórios</li>
                    <li>SKU Pai não precisa existir no cadastro; será criado/atualizado em "Composições"</li>
                    <li>SKU Componente deve existir no cadastro de produtos</li>
                    <li>Quantidade deve ser um número maior que 0</li>
                  </>
                )}
                <li><strong className="text-primary">💡 Baixe o template</strong> para ver o formato correto</li>
                <li className="text-muted-foreground mt-2 pt-2 border-t">
                  <strong>Exemplo mínimo:</strong> Apenas "SKU Interno" e "Nome" são obrigatórios!
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload do Arquivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={isProcessing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {file ? file.name : "Selecionar Arquivo"}
                </Button>

                {file && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Arquivo selecionado: {file.name}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle>Processando...</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">
                  {progress.toFixed(0)}% concluído
                </p>
              </CardContent>
            </Card>
          )}

          {/* Opção de importação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Modo de Importação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="importOnlyValid"
                  checked={importOnlyValid}
                  onChange={(e) => setImportOnlyValid(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="importOnlyValid" className="text-sm">
                  Importar apenas itens válidos (ignorar erros)
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {importOnlyValid 
                  ? "Itens com erro serão ignorados e apenas os válidos serão importados"
                  : "Se houver qualquer erro, nenhum item será importado (modo padrão)"
                }
              </p>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  Resultado da Importação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.success > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {result.success} produto(s) importado(s) com sucesso!
                    </AlertDescription>
                  </Alert>
                )}

                {result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Erros encontrados:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {result.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                      
                      {/* Botão para baixar relatório de erros */}
                      {result.failed && result.failed.length > 0 && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                          <Button 
                            variant="outline"
                            onClick={() => downloadFailedItemsReport(
                              result.failed, 
                              `itens_com_erro_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`
                            )}
                            className="w-full"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar Relatório de Erros ({result.failed.length} itens)
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            O relatório contém os dados originais e a descrição dos erros para correção.
                          </p>
                        </div>
                      )}

                      {/* Botão para importar apenas válidos quando há erros */}
                      {result.success === 0 && importOnlyValid && (
                        <div className="mt-4 pt-4 border-t">
                          <Button 
                            onClick={processImport}
                            disabled={isProcessing}
                            className="w-full"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Importando apenas válidos...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Importar Apenas Itens Válidos
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {result.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Avisos:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {result.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {result.failed && result.failed.length > 0 && result.errors.length === 0 && (
                  <div className="mt-2 pt-4 border-t space-y-2">
                    <Button 
                      variant="outline"
                      onClick={() => downloadFailedItemsReport(
                        result.failed, 
                        `itens_com_erro_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`
                      )}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Relatório de Itens Ignorados ({result.failed.length} itens)
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Alguns itens foram ignorados durante a importação. Baixe o relatório para corrigi-los.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              {result ? "Fechar" : "Cancelar"}
            </Button>
            {file && !result && (
              <Button
                onClick={processImport}
                disabled={isProcessing}
              >
                {isProcessing ? "Processando..." : "Importar"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}