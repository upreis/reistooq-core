import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Calculator, 
  Receipt, 
  FileText, 
  Info, 
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Percent
} from "lucide-react";

interface DadosFiscaisProps {
  formData: any;
  setFormData: (data: any) => void;
  readonly?: boolean;
}

export const DadosFiscais: React.FC<DadosFiscaisProps> = ({
  formData,
  setFormData,
  readonly = false
}) => {
  const [activeTab, setActiveTab] = useState('impostos');

  const updateFiscalData = (field: string, value: any) => {
    if (readonly) return;
    
    const newFiscalData = {
      ...formData.dados_fiscais,
      [field]: value
    };
    
    setFormData({
      ...formData,
      dados_fiscais: newFiscalData
    });

    // Recalcular totais se necessário
    if (['aliquota_icms', 'aliquota_ipi', 'aliquota_pis', 'aliquota_cofins'].includes(field)) {
      recalcularTotais(newFiscalData);
    }
  };

  const recalcularTotais = (fiscalData: any) => {
    const valorBase = formData.valor_total || 0;
    
    const icms = valorBase * (fiscalData.aliquota_icms || 0) / 100;
    const ipi = valorBase * (fiscalData.aliquota_ipi || 0) / 100;
    const pis = valorBase * (fiscalData.aliquota_pis || 0) / 100;
    const cofins = valorBase * (fiscalData.aliquota_cofins || 0) / 100;
    
    const totalImpostos = icms + ipi + pis + cofins;
    const valorComImpostos = valorBase + totalImpostos;

    updateFiscalData('valor_icms', icms);
    updateFiscalData('valor_ipi', ipi);
    updateFiscalData('valor_pis', pis);
    updateFiscalData('valor_cofins', cofins);
    updateFiscalData('total_impostos', totalImpostos);
    updateFiscalData('valor_total_com_impostos', valorComImpostos);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatPercent = (value: number) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Informações Fiscais
          <Badge variant="secondary">Opcional</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="impostos" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Impostos
            </TabsTrigger>
            <TabsTrigger value="documentos" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="resumo" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Resumo
            </TabsTrigger>
          </TabsList>

          {/* Aba Impostos */}
          <TabsContent value="impostos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ICMS */}
              <div>
                <Label htmlFor="aliquota_icms">Alíquota ICMS (%)</Label>
                <Input
                  id="aliquota_icms"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.dados_fiscais?.aliquota_icms || ''}
                  onChange={(e) => updateFiscalData('aliquota_icms', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  disabled={readonly}
                />
                {formData.dados_fiscais?.valor_icms > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Valor: {formatCurrency(formData.dados_fiscais.valor_icms)}
                  </p>
                )}
              </div>

              {/* IPI */}
              <div>
                <Label htmlFor="aliquota_ipi">Alíquota IPI (%)</Label>
                <Input
                  id="aliquota_ipi"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.dados_fiscais?.aliquota_ipi || ''}
                  onChange={(e) => updateFiscalData('aliquota_ipi', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  disabled={readonly}
                />
                {formData.dados_fiscais?.valor_ipi > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Valor: {formatCurrency(formData.dados_fiscais.valor_ipi)}
                  </p>
                )}
              </div>

              {/* PIS */}
              <div>
                <Label htmlFor="aliquota_pis">Alíquota PIS (%)</Label>
                <Input
                  id="aliquota_pis"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.dados_fiscais?.aliquota_pis || ''}
                  onChange={(e) => updateFiscalData('aliquota_pis', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  disabled={readonly}
                />
                {formData.dados_fiscais?.valor_pis > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Valor: {formatCurrency(formData.dados_fiscais.valor_pis)}
                  </p>
                )}
              </div>

              {/* COFINS */}
              <div>
                <Label htmlFor="aliquota_cofins">Alíquota COFINS (%)</Label>
                <Input
                  id="aliquota_cofins"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.dados_fiscais?.aliquota_cofins || ''}
                  onChange={(e) => updateFiscalData('aliquota_cofins', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  disabled={readonly}
                />
                {formData.dados_fiscais?.valor_cofins > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Valor: {formatCurrency(formData.dados_fiscais.valor_cofins)}
                  </p>
                )}
              </div>
            </div>

            {/* Regime Tributário */}
            <div className="space-y-2">
              <Label htmlFor="regime_tributario">Regime Tributário</Label>
              <Select 
                value={formData.dados_fiscais?.regime_tributario || ''} 
                onValueChange={(value) => updateFiscalData('regime_tributario', value)}
                disabled={readonly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime tributário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                  <SelectItem value="mei">MEI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observações fiscais */}
            <div>
              <Label htmlFor="observacoes_fiscais">Observações Fiscais</Label>
              <Textarea
                id="observacoes_fiscais"
                value={formData.dados_fiscais?.observacoes_fiscais || ''}
                onChange={(e) => updateFiscalData('observacoes_fiscais', e.target.value)}
                placeholder="Observações adicionais sobre aspectos fiscais"
                rows={3}
                disabled={readonly}
              />
            </div>
          </TabsContent>

          {/* Aba Documentos */}
          <TabsContent value="documentos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero_nf">Número da Nota Fiscal</Label>
                <Input
                  id="numero_nf"
                  value={formData.dados_fiscais?.numero_nf || ''}
                  onChange={(e) => updateFiscalData('numero_nf', e.target.value)}
                  placeholder="000000"
                  disabled={readonly}
                />
              </div>

              <div>
                <Label htmlFor="serie_nf">Série da NF</Label>
                <Input
                  id="serie_nf"
                  value={formData.dados_fiscais?.serie_nf || ''}
                  onChange={(e) => updateFiscalData('serie_nf', e.target.value)}
                  placeholder="1"
                  disabled={readonly}
                />
              </div>

              <div>
                <Label htmlFor="chave_acesso">Chave de Acesso</Label>
                <Input
                  id="chave_acesso"
                  value={formData.dados_fiscais?.chave_acesso || ''}
                  onChange={(e) => updateFiscalData('chave_acesso', e.target.value)}
                  placeholder="44 dígitos da chave de acesso"
                  maxLength={44}
                  disabled={readonly}
                />
              </div>

              <div>
                <Label htmlFor="data_emissao_nf">Data de Emissão da NF</Label>
                <Input
                  id="data_emissao_nf"
                  type="date"
                  value={formData.dados_fiscais?.data_emissao_nf || ''}
                  onChange={(e) => updateFiscalData('data_emissao_nf', e.target.value)}
                  disabled={readonly}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="nf_emitida"
                checked={formData.dados_fiscais?.nf_emitida || false}
                onCheckedChange={(checked) => updateFiscalData('nf_emitida', checked)}
                disabled={readonly}
              />
              <Label htmlFor="nf_emitida">Nota Fiscal já emitida</Label>
            </div>

            {formData.dados_fiscais?.nf_emitida && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Nota Fiscal Emitida</span>
                </div>
                <p className="text-sm mt-1">
                  Documento fiscal processado e registrado no sistema.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Aba Resumo */}
          <TabsContent value="resumo" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Valores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Valores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Base:</span>
                    <span className="font-medium">{formatCurrency(formData.valor_total || 0)}</span>
                  </div>
                  
                  {formData.dados_fiscais?.valor_icms > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ICMS:</span>
                      <span>{formatCurrency(formData.dados_fiscais.valor_icms)}</span>
                    </div>
                  )}
                  
                  {formData.dados_fiscais?.valor_ipi > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IPI:</span>
                      <span>{formatCurrency(formData.dados_fiscais.valor_ipi)}</span>
                    </div>
                  )}
                  
                  {formData.dados_fiscais?.valor_pis > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PIS:</span>
                      <span>{formatCurrency(formData.dados_fiscais.valor_pis)}</span>
                    </div>
                  )}
                  
                  {formData.dados_fiscais?.valor_cofins > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">COFINS:</span>
                      <span>{formatCurrency(formData.dados_fiscais.valor_cofins)}</span>
                    </div>
                  )}
                  
                  <hr />
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Impostos:</span>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(formData.dados_fiscais?.total_impostos || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Valor Final:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(formData.dados_fiscais?.valor_total_com_impostos || formData.valor_total || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Informações Fiscais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Informações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Regime Tributário:</span>
                    <p className="font-medium">
                      {formData.dados_fiscais?.regime_tributario 
                        ? formData.dados_fiscais.regime_tributario.replace('_', ' ').toUpperCase()
                        : 'Não informado'
                      }
                    </p>
                  </div>
                  
                  {formData.dados_fiscais?.numero_nf && (
                    <div>
                      <span className="text-sm text-muted-foreground">Nota Fiscal:</span>
                      <p className="font-medium">
                        {formData.dados_fiscais.numero_nf}
                        {formData.dados_fiscais.serie_nf && ` - Série ${formData.dados_fiscais.serie_nf}`}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {formData.dados_fiscais?.nf_emitida ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    )}
                    <span className="text-sm">
                      {formData.dados_fiscais?.nf_emitida ? 'NF Emitida' : 'NF Pendente'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alertas */}
            {(formData.dados_fiscais?.total_impostos || 0) > (formData.valor_total || 0) * 0.3 && (
              <div className="p-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Atenção: Alta Carga Tributária</span>
                </div>
                <p className="text-sm mt-1">
                  Os impostos representam mais de 30% do valor do pedido. Verifique as alíquotas aplicadas.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};