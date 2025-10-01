import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  RotateCcw,
  FileImage,
  ShoppingCart,
  RefreshCw
} from 'lucide-react';
import { obterCorrecoesPendentes, limparCorrecoesPendentes } from '@/hooks/useCotacoesValidacoes';

interface CorrecaoItem {
  arquivo: string;
  skuLinha: string;
  linha: number;
  timestamp: Date;
  status?: 'pendente' | 'corrigido' | 'ignorado';
  skuCorreto?: string;
}

interface CotacoesCorrecaoManualProps {
  isOpen: boolean;
  onClose: () => void;
  onAplicarCorrecoes: (correcoes: CorrecaoItem[]) => void;
}

export const CotacoesCorrecaoManual: React.FC<CotacoesCorrecaoManualProps> = ({
  isOpen,
  onClose,
  onAplicarCorrecoes
}) => {
  const [correcoes, setCorrecoes] = useState<CorrecaoItem[]>([]);
  const [correcaoEditando, setCorrecaoEditando] = useState<number | null>(null);
  const [skuTemporario, setSkuTemporario] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      carregarCorrecoesPendentes();
    }
  }, [isOpen]);

  const carregarCorrecoesPendentes = () => {
    const pendentes = obterCorrecoesPendentes();
    const correcoesComStatus = pendentes.map(p => ({
      ...p,
      status: 'pendente' as const
    }));
    setCorrecoes(correcoesComStatus);
    console.log(`🔧 [CORREÇÃO] Carregadas ${correcoesComStatus.length} correções pendentes`);
  };

  const iniciarEdicao = (index: number) => {
    setCorrecaoEditando(index);
    setSkuTemporario(correcoes[index].skuCorreto || correcoes[index].skuLinha);
  };

  const salvarEdicao = (index: number) => {
    const novasCorrecoes = [...correcoes];
    novasCorrecoes[index] = {
      ...novasCorrecoes[index],
      skuCorreto: skuTemporario,
      status: 'corrigido'
    };
    setCorrecoes(novasCorrecoes);
    setCorrecaoEditando(null);
    setSkuTemporario('');
    
    toast.success(`SKU corrigido para: ${skuTemporario}`);
    console.log(`✅ [CORREÇÃO] SKU editado:`, novasCorrecoes[index]);
  };

  const cancelarEdicao = () => {
    setCorrecaoEditando(null);
    setSkuTemporario('');
  };

  const marcarComoIgnorado = (index: number) => {
    const novasCorrecoes = [...correcoes];
    novasCorrecoes[index] = {
      ...novasCorrecoes[index],
      status: 'ignorado'
    };
    setCorrecoes(novasCorrecoes);
    toast.info('Correção marcada como ignorada');
  };

  const aplicarTodasCorrecoes = () => {
    const correcoesParaAplicar = correcoes.filter(c => c.status === 'corrigido');
    
    if (correcoesParaAplicar.length === 0) {
      toast.warning('Nenhuma correção foi definida');
      return;
    }

    onAplicarCorrecoes(correcoesParaAplicar);
    limparCorrecoesPendentes();
    toast.success(`${correcoesParaAplicar.length} correções aplicadas com sucesso`);
    onClose();
  };

  const limparTudo = () => {
    setCorrecoes([]);
    limparCorrecoesPendentes();
    toast.info('Todas as correções pendentes foram removidas');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'corrigido':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'ignorado':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'corrigido':
        return <Badge variant="default" className="bg-green-100 text-green-800">Corrigido</Badge>;
      case 'ignorado':
        return <Badge variant="secondary">Ignorado</Badge>;
      default:
        return <Badge variant="destructive">Pendente</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Interface de Correção Manual
          </DialogTitle>
          <DialogDescription>
            Revise e corrija os mapeamentos que podem estar incorretos. 
            O sistema identificou possíveis incompatibilidades entre nomes de arquivo e SKUs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Pendentes</p>
                    <p className="text-2xl font-bold">{correcoes.filter(c => c.status === 'pendente').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Corrigidos</p>
                    <p className="text-2xl font-bold">{correcoes.filter(c => c.status === 'corrigido').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Ignorados</p>
                    <p className="text-2xl font-bold">{correcoes.filter(c => c.status === 'ignorado').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Correções */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Correções Identificadas</CardTitle>
              <CardDescription>
                {correcoes.length === 0 
                  ? 'Nenhuma correção pendente encontrada.'
                  : `${correcoes.length} item(ns) precisam de revisão.`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {correcoes.length > 0 && (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {correcoes.map((correcao, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(correcao.status || 'pendente')}
                              {getStatusBadge(correcao.status || 'pendente')}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <FileImage className="h-4 w-4 text-blue-500" />
                                <div>
                                  <p className="font-medium">Arquivo:</p>
                                  <p className="text-gray-600">{correcao.arquivo.split('/').pop()}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-green-500" />
                                <div>
                                  <p className="font-medium">SKU na Linha {correcao.linha}:</p>
                                  <p className="text-gray-600">{correcao.skuLinha}</p>
                                </div>
                              </div>
                            </div>

                            {correcaoEditando === index ? (
                              <div className="flex items-center gap-2 mt-3">
                                <Label htmlFor={`sku-${index}`}>SKU Correto:</Label>
                                <Input
                                  id={`sku-${index}`}
                                  value={skuTemporario}
                                  onChange={(e) => setSkuTemporario(e.target.value)}
                                  placeholder="Digite o SKU correto"
                                  className="max-w-xs"
                                />
                                <Button size="sm" onClick={() => salvarEdicao(index)}>
                                  Salvar
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelarEdicao}>
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-3">
                                {correcao.skuCorreto && (
                                  <div className="flex items-center gap-2">
                                    <Label>SKU Corrigido:</Label>
                                    <Badge variant="outline">{correcao.skuCorreto}</Badge>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            {correcao.status === 'pendente' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => iniciarEdicao(index)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => marcarComoIgnorado(index)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={carregarCorrecoesPendentes}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
              <Button variant="destructive" onClick={limparTudo}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar Tudo
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={aplicarTodasCorrecoes}
                disabled={correcoes.filter(c => c.status === 'corrigido').length === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Aplicar Correções ({correcoes.filter(c => c.status === 'corrigido').length})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};