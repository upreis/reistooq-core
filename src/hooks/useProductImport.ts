import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from 'xlsx';

export interface ImportLog {
  id: string;
  organization_id: string;
  nome_arquivo: string;
  produtos_processados: number;
  produtos_sucesso: number;
  produtos_erro: number;
  tipo_operacao: string;
  detalhes_erro?: any;
  dados_originais?: any;
  usuario_id?: string;
  created_at: string;
}

export interface ImportResult {
  total: number;
  success: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data: any;
  }>;
}

export const useProductImport = () => {
  const { createProduct } = useProducts();
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const columnMapping = {
    'SKU': 'sku_interno',
    'IMAGEM': 'url_imagem',
    'IMAGEM DO FORNECEDOR': 'imagem_fornecedor', 
    'MATERIAL': 'material',
    'COR': 'cor',
    'Nome do Produto': 'nome',
    'DESCRIÇÃO': 'descricao',
    'PACKAGE': 'package',
    'PREÇO': 'preco_venda',
    'UNIT': 'unit',
    'PCS/CTN': 'pcs_ctn',
    'Quantidade': 'quantidade_atual',
    'PESO UNITARIO(g)': 'peso_unitario_g',
    'Peso cx Master (KG)': 'peso_cx_master_kg',
    'Comprimento': 'comprimento_cm',
    'Largura': 'largura_cm',
    'Altura': 'altura_cm',
    'OBS': 'observacoes',
    'Codigo de Barras': 'codigo_barras'
  };

  const validateRow = (row: any, index: number): string[] => {
    const errors: string[] = [];
    
    if (!row['SKU'] || row['SKU'].toString().trim() === '') {
      errors.push(`SKU é obrigatório`);
    }
    
    if (!row['Nome do Produto'] || row['Nome do Produto'].toString().trim() === '') {
      errors.push(`Nome do Produto é obrigatório`);
    }
    
    if (row['PREÇO'] && (isNaN(parseFloat(row['PREÇO'])) || parseFloat(row['PREÇO']) < 0)) {
      errors.push(`Preço deve ser um número válido`);
    }
    
    if (row['Quantidade'] && (isNaN(parseInt(row['Quantidade'])) || parseInt(row['Quantidade']) < 0)) {
      errors.push(`Quantidade deve ser um número inteiro válido`);
    }

    return errors;
  };

  const convertRowToProduct = (row: any) => {
    const product: any = {
      ativo: true,
      status: 'ativo',
      estoque_minimo: 0,
      estoque_maximo: 1000,
      preco_custo: 0,
      localizacao: '',
      unidade_medida_id: null,
      categoria: null
    };

    Object.entries(columnMapping).forEach(([excelCol, productField]) => {
      const value = row[excelCol];
      if (value !== undefined && value !== null && value !== '') {
        if (['preco_venda', 'peso_unitario_g', 'peso_cx_master_kg', 'comprimento_cm', 'largura_cm', 'altura_cm'].includes(productField)) {
          product[productField] = parseFloat(value) || 0;
        } else if (['quantidade_atual', 'pcs_ctn'].includes(productField)) {
          product[productField] = parseInt(value) || 0;
        } else {
          product[productField] = value.toString();
        }
      }
    });

    return product;
  };

  const createImportLog = async (fileName: string, totalLines: number) => {
    // Usar a função RPC para obter org_id
    const { data: orgId } = await supabase.rpc('get_current_org_id');
    
    const { data, error } = await supabase
      .from('historico_importacoes')
      .insert({
        organization_id: orgId,
        nome_arquivo: fileName,
        produtos_processados: totalLines,
        produtos_sucesso: 0,
        produtos_erro: 0,
        tipo_operacao: 'importacao_produtos',
        dados_originais: null,
        usuario_id: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateImportLog = async (logId: string, updates: Partial<ImportLog>) => {
    const { error } = await supabase
      .from('historico_importacoes')
      .update(updates)
      .eq('id', logId);

    if (error) throw error;
  };

  const processImport = useCallback(async (file: File, data: any[]): Promise<ImportResult> => {
    setImporting(true);
    setProgress(0);

    const result: ImportResult = {
      total: data.length,
      success: 0,
      errors: []
    };

    let importLog;
    try {
      importLog = await createImportLog(file.name, data.length);
    } catch (error) {
      console.error('Erro ao criar log de importação:', error);
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      const validationErrors = validateRow(row, i);
      if (validationErrors.length > 0) {
        result.errors.push({
          row: i + 2,
          field: 'validation',
          message: validationErrors.join(', '),
          data: row
        });
        setProgress(((i + 1) / data.length) * 100);
        continue;
      }

      try {
        const productData = convertRowToProduct(row);
        await createProduct(productData);
        result.success++;
      } catch (error: any) {
        result.errors.push({
          row: i + 2,
          field: 'creation',
          message: error.message || 'Erro ao criar produto',
          data: row
        });
      }
      
      setProgress(((i + 1) / data.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Atualizar log de importação
    if (importLog) {
      try {
        await updateImportLog(importLog.id, {
          produtos_processados: data.length,
          produtos_erro: result.errors.length,
          produtos_sucesso: result.success,
          detalhes_erro: result.errors.length > 0 ? result.errors : null
        });
      } catch (error) {
        console.error('Erro ao atualizar log de importação:', error);
      }
    }

    setImporting(false);
    return result;
  }, [createProduct]);

  const readExcelFile = useCallback((file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const downloadTemplate = useCallback(() => {
    const templateColumns = [
      'SKU', 'IMAGEM', 'IMAGEM DO FORNECEDOR', 'MATERIAL', 'COR', 
      'Nome do Produto', 'DESCRIÇÃO', 'PACKAGE', 'PREÇO', 'UNIT', 
      'PCS/CTN', 'Quantidade', 'PESO UNITARIO(g)', 'Peso cx Master (KG)', 
      'Comprimento', 'Largura', 'Altura', 'OBS', 'Codigo de Barras'
    ];

    const exampleData = [
      {
        'SKU': 'PROD-001',
        'IMAGEM': 'https://exemplo.com/imagem1.jpg',
        'IMAGEM DO FORNECEDOR': 'https://fornecedor.com/img1.jpg',
        'MATERIAL': 'Poliéster',
        'COR': 'Azul',
        'Nome do Produto': 'Chapéu Aeronáutica',
        'DESCRIÇÃO': 'Chapéu aeronáutica 28*21*16cm',
        'PACKAGE': 'Caixa',
        'PREÇO': '25.00',
        'UNIT': 'pç',
        'PCS/CTN': '240',
        'Quantidade': '100',
        'PESO UNITARIO(g)': '90',
        'Peso cx Master (KG)': '22.60',
        'Comprimento': '28',
        'Largura': '21',
        'Altura': '16',
        'OBS': 'Produto premium',
        'Codigo de Barras': '7891234567890'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');
    
    const colWidths = templateColumns.map(() => ({ wch: 15 }));
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, 'template_produtos.xlsx');
  }, []);

  const getImportHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from('historico_importacoes')
      .select('*')
      .eq('tipo_operacao', 'importacao_produtos')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ImportLog[];
  }, []);

  return {
    importing,
    progress,
    processImport,
    readExcelFile,
    downloadTemplate,
    getImportHistory,
    validateRow,
    convertRowToProduct
  };
};