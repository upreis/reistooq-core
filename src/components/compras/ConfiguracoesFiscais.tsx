import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Receipt, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Building,
  Calculator
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConfiguracoesFiscaisProps {
  organizationId?: string;
}

export const ConfiguracoesFiscais: React.FC<ConfiguracoesFiscaisProps> = ({
  organizationId
}) => {
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState({
    // Configurações Gerais
    regime_tributario: 'simples_nacional',
    cnpj: '',
    inscricao_estadual: '',
    inscricao_municipal: '',
    
    // Alíquotas Padrão
    aliquota_icms_padrao: 18,
    aliquota_ipi_padrao: 0,
    aliquota_pis_padrao: 1.65,
    aliquota_cofins_padrao: 7.6,
    
    // Configurações de Notas Fiscais
    serie_nf_padrao: '1',
    proximo_numero_nf: 1,
    ambiente_nfe: 'homologacao', // ou 'producao'
    
    // Configurações Automáticas
    calcular_impostos_automaticamente: true,
    aplicar_aliquotas_padrao: true,
    validar_cnpj_fornecedor: false,
    
    // Observações Padrão
    observacoes_fiscais_padrao: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    carregarConfiguracoes();
  }, [organizationId]);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      // Aqui seria feita a busca das configurações no banco
      // Por enquanto usando dados mock
      
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Configurações carregadas",
        description: "Configurações fiscais carregadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações fiscais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracoes = async () => {
    try {
      setLoading(true);
      
      // Validações básicas
      if (configs.cnpj && !validarCNPJ(configs.cnpj)) {
        toast({
          title: "CNPJ inválido",
          description: "Por favor, verifique o CNPJ informado.",
          variant: "destructive",
        });
        return;
      }
      
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações salvas",
        description: "Configurações fiscais salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validarCNPJ = (cnpj: string): boolean => {
    // Implementação básica de validação de CNPJ
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.length === 14;
  };

  const formatCNPJ = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const updateConfig = (field: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações Fiscais
          </h2>
          <p className="text-muted-foreground">
            Configure as informações fiscais da sua empresa
          </p>
        </div>
        
        <Button 
          onClick={salvarConfiguracoes} 
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </div>

      {/* Informações da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informações da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={configs.cnpj}
                onChange={(e) => updateConfig('cnpj', formatCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>
            
            <div>
              <Label htmlFor="regime_tributario">Regime Tributário *</Label>
              <Select 
                value={configs.regime_tributario} 
                onValueChange={(value) => updateConfig('regime_tributario', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                  <SelectItem value="mei">MEI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
              <Input
                id="inscricao_estadual"
                value={configs.inscricao_estadual}
                onChange={(e) => updateConfig('inscricao_estadual', e.target.value)}
                placeholder="000.000.000.000"
              />
            </div>
            
            <div>
              <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
              <Input
                id="inscricao_municipal"
                value={configs.inscricao_municipal}
                onChange={(e) => updateConfig('inscricao_municipal', e.target.value)}
                placeholder="00000000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alíquotas Padrão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Alíquotas Padrão (%)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="aliquota_icms_padrao">ICMS</Label>
              <Input
                id="aliquota_icms_padrao"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={configs.aliquota_icms_padrao}
                onChange={(e) => updateConfig('aliquota_icms_padrao', parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label htmlFor="aliquota_ipi_padrao">IPI</Label>
              <Input
                id="aliquota_ipi_padrao"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={configs.aliquota_ipi_padrao}
                onChange={(e) => updateConfig('aliquota_ipi_padrao', parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label htmlFor="aliquota_pis_padrao">PIS</Label>
              <Input
                id="aliquota_pis_padrao"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={configs.aliquota_pis_padrao}
                onChange={(e) => updateConfig('aliquota_pis_padrao', parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label htmlFor="aliquota_cofins_padrao">COFINS</Label>
              <Input
                id="aliquota_cofins_padrao"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={configs.aliquota_cofins_padrao}
                onChange={(e) => updateConfig('aliquota_cofins_padrao', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de NF-e */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Nota Fiscal Eletrônica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="serie_nf_padrao">Série Padrão</Label>
              <Input
                id="serie_nf_padrao"
                value={configs.serie_nf_padrao}
                onChange={(e) => updateConfig('serie_nf_padrao', e.target.value)}
                placeholder="1"
              />
            </div>
            
            <div>
              <Label htmlFor="proximo_numero_nf">Próximo Número</Label>
              <Input
                id="proximo_numero_nf"
                type="number"
                min="1"
                value={configs.proximo_numero_nf}
                onChange={(e) => updateConfig('proximo_numero_nf', parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div>
              <Label htmlFor="ambiente_nfe">Ambiente</Label>
              <Select 
                value={configs.ambiente_nfe} 
                onValueChange={(value) => updateConfig('ambiente_nfe', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homologacao">Homologação</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {configs.ambiente_nfe === 'producao' && (
            <div className="p-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Ambiente de Produção</span>
              </div>
              <p className="text-sm mt-1">
                Notas fiscais emitidas neste ambiente têm validade legal.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações Automáticas */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Automáticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="calcular_impostos_automaticamente">Calcular impostos automaticamente</Label>
              <p className="text-sm text-muted-foreground">
                Calcula automaticamente os impostos baseado nas alíquotas padrão
              </p>
            </div>
            <Switch
              id="calcular_impostos_automaticamente"
              checked={configs.calcular_impostos_automaticamente}
              onCheckedChange={(checked) => updateConfig('calcular_impostos_automaticamente', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="aplicar_aliquotas_padrao">Aplicar alíquotas padrão em novos pedidos</Label>
              <p className="text-sm text-muted-foreground">
                Preenche automaticamente as alíquotas padrão ao criar novos pedidos
              </p>
            </div>
            <Switch
              id="aplicar_aliquotas_padrao"
              checked={configs.aplicar_aliquotas_padrao}
              onCheckedChange={(checked) => updateConfig('aplicar_aliquotas_padrao', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="validar_cnpj_fornecedor">Validar CNPJ do fornecedor</Label>
              <p className="text-sm text-muted-foreground">
                Verifica se o CNPJ do fornecedor é válido antes de salvar
              </p>
            </div>
            <Switch
              id="validar_cnpj_fornecedor"
              checked={configs.validar_cnpj_fornecedor}
              onCheckedChange={(checked) => updateConfig('validar_cnpj_fornecedor', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status das Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Configurações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {configs.cnpj ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              )}
              <span className="text-sm">
                CNPJ {configs.cnpj ? 'configurado' : 'não configurado'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {configs.regime_tributario ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              )}
              <span className="text-sm">
                Regime tributário {configs.regime_tributario ? 'configurado' : 'não configurado'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                Alíquotas padrão configuradas
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};