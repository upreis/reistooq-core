import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wand2, 
  RefreshCw, 
  Copy, 
  Settings2,
  Hash,
  Calendar,
  Type,
  Shuffle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SKUGeneratorProps {
  onSKUGenerated: (sku: string) => void;
  categoria?: string;
  organizationId?: string;
  disabled?: boolean;
}

interface SKUConfig {
  prefixo: string;
  usarCategoria: boolean;
  usarData: boolean;
  usarAleatorio: boolean;
  formatoData: 'DDMM' | 'MMDD' | 'AAAA' | 'AA';
  digitos: number;
  separador: string;
  maiusculo: boolean;
}

const CATEGORIAS_PREFIXOS: Record<string, string> = {
  'Acessórios para Veículos': 'VEC',
  'Alimentos e Bebidas': 'ALM',
  'Beleza e Cuidado Pessoal': 'BLZ',
  'Brinquedos e Hobbies': 'BRQ',
  'Calçados, Roupas e Bolsas': 'CRB',
  'Casa, Móveis e Decoração': 'CAS',
  'Eletrônicos, Áudio e Vídeo': 'ELE',
  'Esportes e Fitness': 'ESP',
  'Ferramentas e Construção': 'FER',
  'Informática': 'INF',
  'Livros': 'LIV',
  'Saúde': 'SAU'
};

export const SKUGenerator: React.FC<SKUGeneratorProps> = ({
  onSKUGenerated,
  categoria,
  organizationId,
  disabled = false
}) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<SKUConfig>({
    prefixo: 'PROD',
    usarCategoria: true,
    usarData: false,
    usarAleatorio: false,
    formatoData: 'DDMM',
    digitos: 6,
    separador: '-',
    maiusculo: true
  });
  const [skuGerado, setSKUGerado] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Gerar SKU automaticamente quando configurações mudarem
  useEffect(() => {
    generateSKU();
  }, [config, categoria]);

  const generateSKU = async () => {
    if (!organizationId) return;
    
    setIsGenerating(true);
    
    try {
      let partes: string[] = [];
      
      // Prefixo base
      let prefixo = config.prefixo;
      
      // Adicionar categoria se habilitado
      if (config.usarCategoria && categoria) {
        const categoriaPrefixo = CATEGORIAS_PREFIXOS[categoria] || categoria.substring(0, 3).toUpperCase();
        prefixo = categoriaPrefixo;
      }
      
      partes.push(prefixo);
      
      // Adicionar data se habilitado
      if (config.usarData) {
        const agora = new Date();
        let dataStr = '';
        
        switch (config.formatoData) {
          case 'DDMM':
            dataStr = String(agora.getDate()).padStart(2, '0') + String(agora.getMonth() + 1).padStart(2, '0');
            break;
          case 'MMDD':
            dataStr = String(agora.getMonth() + 1).padStart(2, '0') + String(agora.getDate()).padStart(2, '0');
            break;
          case 'AAAA':
            dataStr = String(agora.getFullYear());
            break;
          case 'AA':
            dataStr = String(agora.getFullYear()).substring(2);
            break;
        }
        
        partes.push(dataStr);
      }
      
      // Gerar número sequencial ou aleatório
      let numero: string;
      
      if (config.usarAleatorio) {
        // Número aleatório
        const max = Math.pow(10, config.digitos) - 1;
        numero = Math.floor(Math.random() * max).toString().padStart(config.digitos, '0');
      } else {
        // Usar função do banco para gerar sequencial
        const prefixoCompleto = partes.join(config.separador);
        const { data, error } = await supabase.rpc('gerar_sku_automatico', {
          org_id: organizationId,
          prefixo: prefixoCompleto
        });
        
        if (error) throw error;
        
        // Extrair apenas o número da função
        const skuCompleto = data as string;
        numero = skuCompleto.split(config.separador).pop() || '000001';
      }
      
      partes.push(numero);
      
      // Montar SKU final
      let skuFinal = partes.join(config.separador);
      
      if (config.maiusculo) {
        skuFinal = skuFinal.toUpperCase();
      }
      
      setSKUGerado(skuFinal);
      
    } catch (error) {
      console.error('Erro ao gerar SKU:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar SKU",
        description: "Não foi possível gerar o SKU automaticamente."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copySKU = () => {
    navigator.clipboard.writeText(skuGerado);
    toast({
      title: "SKU copiado!",
      description: "O SKU foi copiado para a área de transferência."
    });
  };

  const useSKU = () => {
    onSKUGenerated(skuGerado);
    toast({
      title: "SKU aplicado!",
      description: "O SKU foi aplicado ao produto."
    });
  };

  const getPreview = () => {
    if (!skuGerado) return 'Gerando...';
    return skuGerado;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Gerador de SKU
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preview do SKU */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">SKU Gerado</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Gerando...
                    </div>
                  ) : (
                    getPreview()
                  )}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copySKU}
                disabled={!skuGerado || isGenerating}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateSKU}
                disabled={isGenerating}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Configurações avançadas */}
        {showConfig && (
          <>
            <Separator />
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prefixo">Prefixo Base</Label>
                  <Input
                    id="prefixo"
                    value={config.prefixo}
                    onChange={(e) => setConfig({ ...config, prefixo: e.target.value })}
                    placeholder="PROD"
                    maxLength={10}
                  />
                </div>
                
                <div>
                  <Label htmlFor="separador">Separador</Label>
                  <Select
                    value={config.separador}
                    onValueChange={(value) => setConfig({ ...config, separador: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">Hífen (-)</SelectItem>
                      <SelectItem value="_">Underscore (_)</SelectItem>
                      <SelectItem value=".">Ponto (.)</SelectItem>
                      <SelectItem value="">Sem separador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="digitos">Dígitos do Número</Label>
                  <Select
                    value={String(config.digitos)}
                    onValueChange={(value) => setConfig({ ...config, digitos: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 dígitos</SelectItem>
                      <SelectItem value="5">5 dígitos</SelectItem>
                      <SelectItem value="6">6 dígitos</SelectItem>
                      <SelectItem value="8">8 dígitos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.usarData && (
                  <div>
                    <Label htmlFor="formatoData">Formato da Data</Label>
                    <Select
                      value={config.formatoData}
                      onValueChange={(value: any) => setConfig({ ...config, formatoData: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DDMM">DD/MM</SelectItem>
                        <SelectItem value="MMDD">MM/DD</SelectItem>
                        <SelectItem value="AAAA">AAAA</SelectItem>
                        <SelectItem value="AA">AA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    <Label htmlFor="categoria">Usar Categoria</Label>
                  </div>
                  <Switch
                    id="categoria"
                    checked={config.usarCategoria}
                    onCheckedChange={(checked) => setConfig({ ...config, usarCategoria: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <Label htmlFor="data">Incluir Data</Label>
                  </div>
                  <Switch
                    id="data"
                    checked={config.usarData}
                    onCheckedChange={(checked) => setConfig({ ...config, usarData: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shuffle className="h-4 w-4" />
                    <Label htmlFor="aleatorio">Número Aleatório</Label>
                  </div>
                  <Switch
                    id="aleatorio"
                    checked={config.usarAleatorio}
                    onCheckedChange={(checked) => setConfig({ ...config, usarAleatorio: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <Label htmlFor="maiusculo">Maiúsculas</Label>
                  </div>
                  <Switch
                    id="maiusculo"
                    checked={config.maiusculo}
                    onCheckedChange={(checked) => setConfig({ ...config, maiusculo: checked })}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            onClick={useSKU}
            disabled={!skuGerado || isGenerating || disabled}
            className="flex-1"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Usar SKU
          </Button>
          
          <Button
            variant="outline"
            onClick={generateSKU}
            disabled={isGenerating}
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};