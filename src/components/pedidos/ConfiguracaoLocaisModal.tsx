import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Save, X, MapPin, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  listarLocaisEstoque,
  listarMapeamentosLocais,
  listarLocaisVenda,
  criarMapeamentoLocal,
  atualizarMapeamentoLocal,
  deletarMapeamentoLocal,
  LocalEstoque,
  LocalVenda,
  MapeamentoLocalEstoque
} from '@/services/LocalEstoqueService';
import { translateLogisticType } from '@/lib/translations';
import { supabase } from '@/integrations/supabase/client';

interface ConfiguracaoLocaisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresasSelecionadas?: string[]; // Empresas vindas do filtro
  contasML?: Array<{ id: string; name: string; nickname?: string; }>;
  onSuccess?: () => void; // Callback para notificar mudanças
}

export function ConfiguracaoLocaisModal({ 
  open, 
  onOpenChange, 
  empresasSelecionadas = [],
  contasML = [],
  onSuccess
}: ConfiguracaoLocaisModalProps) {
  const [locais, setLocais] = useState<LocalEstoque[]>([]);
  const [locaisVenda, setLocaisVenda] = useState<LocalVenda[]>([]);
  const [mapeamentos, setMapeamentos] = useState<MapeamentoLocalEstoque[]>([]);
  const [tiposLogisticosDinamicos, setTiposLogisticosDinamicos] = useState<string[]>([]);
  const [empresasShopee, setEmpresasShopee] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [empresaSelectorOpen, setEmpresaSelectorOpen] = useState(false);
  const [mostrarCustomTipoLogistico, setMostrarCustomTipoLogistico] = useState(false);
  // Form state
  const [novoMapeamento, setNovoMapeamento] = useState({
    empresa: '',
    tipo_logistico: '',
    marketplace: 'default', // Valor fixo, campo removido da UI
    local_estoque_id: '',
    local_venda_id: '' as string | null,
    observacoes: ''
  });

  useEffect(() => {
    if (open) {
      carregarDados();
    }
  }, [open]);

  // 🔄 Se algum local for criado/editado em outra tela, este modal se atualiza automaticamente
  useEffect(() => {
    if (!open) return;

    const handleReload = () => {
      carregarDados();
    };

    window.addEventListener('reload-locais-estoque', handleReload);
    window.addEventListener('reload-locais-venda', handleReload);

    return () => {
      window.removeEventListener('reload-locais-estoque', handleReload);
      window.removeEventListener('reload-locais-venda', handleReload);
    };
  }, [open]);

  // Efeito separado para preencher empresa quando modal abre pela primeira vez (sem edição)
  useEffect(() => {
    if (open && !editando) {
      // Preencher automaticamente a empresa se houver apenas uma selecionada
      if (empresasSelecionadas.length === 1) {
        const empresaNome = contasML.find(c => c.id === empresasSelecionadas[0])?.nickname || 
                           contasML.find(c => c.id === empresasSelecionadas[0])?.name || 
                           empresasSelecionadas[0];
        setNovoMapeamento(prev => ({ ...prev, empresa: empresaNome }));
      }
      // Se for um novo mapeamento e empresa não preenchida, abrir seletor
      if (!novoMapeamento.empresa) {
        setEmpresaSelectorOpen(true);
      }
    }
  }, [open, empresasSelecionadas, contasML, editando]);

  async function carregarDados() {
    try {
      setLoading(true);
      const [locaisData, mapeamentosData, locaisVendaData, tiposLogisticosData, empresasShopeeData] = await Promise.all([
        listarLocaisEstoque(),
        listarMapeamentosLocais(),
        listarLocaisVenda(),
        // Buscar tipos logísticos únicos dos pedidos Shopee
        supabase
          .from('pedidos_shopee')
          .select('tipo_logistico')
          .not('tipo_logistico', 'is', null)
          .not('tipo_logistico', 'eq', '')
          .limit(1000),
        // Buscar empresas únicas dos pedidos Shopee
        supabase
          .from('pedidos_shopee')
          .select('empresa')
          .not('empresa', 'is', null)
          .not('empresa', 'eq', '')
          .limit(1000)
      ]);
      setLocais(locaisData);
      setMapeamentos(mapeamentosData);
      setLocaisVenda(locaisVendaData);

      // Extrair tipos únicos dos pedidos Shopee
      if (tiposLogisticosData.data) {
        const tiposUnicos = [...new Set(
          tiposLogisticosData.data
            .map(row => row.tipo_logistico)
            .filter((t): t is string => !!t && t.trim() !== '')
        )].sort();
        setTiposLogisticosDinamicos(tiposUnicos);
      }

      // Extrair empresas únicas dos pedidos Shopee
      if (empresasShopeeData.data) {
        const empresasUnicas = [...new Set(
          empresasShopeeData.data
            .map(row => row.empresa)
            .filter((e): e is string => !!e && e.trim() !== '')
        )].sort();
        setEmpresasShopee(empresasUnicas);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSalvar = async () => {
    console.log('🔍 Tentando salvar mapeamento:', novoMapeamento);
    
    if (!novoMapeamento.empresa || !novoMapeamento.tipo_logistico || !novoMapeamento.local_estoque_id) {
      console.error('❌ Campos faltando:', {
        empresa: !novoMapeamento.empresa,
        tipo_logistico: !novoMapeamento.tipo_logistico,
        local_estoque_id: !novoMapeamento.local_estoque_id
      });
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      console.log('✅ Salvando mapeamento...');
      
      if (editando) {
        await atualizarMapeamentoLocal(editando, {
          ...novoMapeamento,
          ativo: true
        });
        toast.success('Mapeamento atualizado!');
      } else {
        const resultado = await criarMapeamentoLocal({
          ...novoMapeamento,
          ativo: true
        });
        console.log('✅ Mapeamento criado:', resultado);
        toast.success('Mapeamento criado!');
      }
      
      setNovoMapeamento({
        empresa: '',
        tipo_logistico: '',
        marketplace: 'default',
        local_estoque_id: '',
        local_venda_id: null,
        observacoes: ''
      });
      setEditando(null);
      setMostrarCustomTipoLogistico(false);
      await carregarDados();
      // Notificar componente pai sobre a mudança
      onSuccess?.();
    } catch (error: any) {
      console.error('❌ Erro ao salvar mapeamento:', error);
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (mapeamento: MapeamentoLocalEstoque) => {
    console.log('🔍 [Editar] Mapeamento clicado:', mapeamento);
    setNovoMapeamento({
      empresa: mapeamento.empresa,
      tipo_logistico: mapeamento.tipo_logistico,
      marketplace: mapeamento.marketplace || 'default',
      local_estoque_id: mapeamento.local_estoque_id,
      local_venda_id: mapeamento.local_venda_id || null,
      observacoes: mapeamento.observacoes || ''
    });
    setEditando(mapeamento.id);
    // Fechar seletor de empresa que pode abrir automaticamente
    setEmpresaSelectorOpen(false);
  };

  const handleDeletar = async (id: string) => {
    if (!confirm('Deseja realmente excluir este mapeamento?')) return;
    
    try {
      setLoading(true);
      await deletarMapeamentoLocal(id);
      toast.success('Mapeamento excluído!');
      await carregarDados();
      // Notificar componente pai sobre a mudança
      onSuccess?.();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    setNovoMapeamento({
      empresa: '',
      tipo_logistico: '',
      marketplace: 'default',
      local_estoque_id: '',
      local_venda_id: null,
      observacoes: ''
    });
    setEditando(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Configuração de Locais de Estoque
          </DialogTitle>
          <DialogDescription>
            Configure de qual local o estoque será retirado com base em: Empresa + Tipo Logístico
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              {editando ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editando ? 'Editar Mapeamento' : 'Novo Mapeamento'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Empresa / Nome do Vendedor *</Label>
                <Select
                  value={novoMapeamento.empresa}
                  onValueChange={(value) => setNovoMapeamento({ ...novoMapeamento, empresa: value })}
                  open={empresaSelectorOpen}
                  onOpenChange={setEmpresaSelectorOpen}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-[9999]">
                    {contasML.length === 0 && empresasShopee.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nenhuma conta disponível
                      </div>
                    ) : (
                      <>
                        {/* Contas Mercado Livre */}
                        {contasML.length > 0 && (
                          <>
                            <div className="px-2 py-1 text-xs text-muted-foreground font-semibold bg-muted/50">
                              🟡 Mercado Livre
                            </div>
                            {contasML.map((conta) => (
                              <SelectItem key={`ml-${conta.id}`} value={conta.nickname || conta.name}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{conta.nickname || conta.name}</span>
                                  {conta.nickname && conta.name && conta.nickname !== conta.name && (
                                    <span className="text-xs text-muted-foreground">{conta.name}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {/* Empresas Shopee */}
                        {empresasShopee.length > 0 && (
                          <>
                            <div className="px-2 py-1 text-xs text-muted-foreground font-semibold bg-muted/50 mt-1">
                              🟠 Shopee
                            </div>
                            {empresasShopee.map((empresa) => (
                              <SelectItem key={`shopee-${empresa}`} value={empresa}>
                                <span className="font-medium">{empresa}</span>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo Logístico *</Label>
                {mostrarCustomTipoLogistico ? (
                  <div className="space-y-2">
                    <Input
                      value={novoMapeamento.tipo_logistico}
                      onChange={(e) => setNovoMapeamento({ ...novoMapeamento, tipo_logistico: e.target.value })}
                      placeholder="Digite o tipo logístico..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMostrarCustomTipoLogistico(false);
                        setNovoMapeamento({ ...novoMapeamento, tipo_logistico: '' });
                      }}
                    >
                      Voltar para lista
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={novoMapeamento.tipo_logistico}
                    onValueChange={(value) => {
                      if (value === '__custom__') {
                        setMostrarCustomTipoLogistico(true);
                        setNovoMapeamento({ ...novoMapeamento, tipo_logistico: '' });
                      } else {
                        setNovoMapeamento({ ...novoMapeamento, tipo_logistico: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-[9999]">
                      {tiposLogisticosDinamicos.length > 0 ? (
                        tiposLogisticosDinamicos.map(tipo => {
                          const traduzido = translateLogisticType(tipo);
                          // Mostrar tradução + valor original se forem diferentes
                          const label = traduzido !== tipo 
                            ? `${traduzido} (${tipo})`
                            : tipo;
                          return (
                            <SelectItem key={tipo} value={tipo}>
                              {label}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <>
                          <SelectItem value="fulfillment">Full (fulfillment)</SelectItem>
                          <SelectItem value="self_service">Envios Flex (self_service)</SelectItem>
                          <SelectItem value="cross_docking">Cross Docking (cross_docking)</SelectItem>
                          <SelectItem value="drop_off">Drop Off (drop_off)</SelectItem>
                          <SelectItem value="xd_drop_off">Ponto de Coleta (xd_drop_off)</SelectItem>
                        </>
                      )}
                      <SelectItem value="__custom__">✏️ Digitar outro...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>


              <div>
                <Label>Local de Estoque *</Label>
                <Select
                  value={novoMapeamento.local_estoque_id}
                  onValueChange={(value) => {
                    setNovoMapeamento({ ...novoMapeamento, local_estoque_id: value, local_venda_id: null });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o local..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locais.map(local => (
                      <SelectItem key={local.id} value={local.id}>
                        {local.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1.5">
                  <Store className="h-3 w-3" />
                  Local de Venda (Composições)
                </Label>
                <Select
                  value={novoMapeamento.local_venda_id || '_none'}
                  onValueChange={(value) => {
                    const selectedLocal = locaisVenda.find(lv => lv.id === value);
                    if (value === '_none') {
                      setNovoMapeamento({ ...novoMapeamento, local_venda_id: null });
                    } else if (selectedLocal) {
                      // Quando seleciona um local de venda, preenche automaticamente o estoque vinculado
                      setNovoMapeamento({ 
                        ...novoMapeamento, 
                        local_venda_id: value,
                        local_estoque_id: selectedLocal.local_estoque_id || novoMapeamento.local_estoque_id
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Usar composição padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Usar composição padrão do estoque</SelectItem>
                    {locaisVenda
                      .filter(lv => !novoMapeamento.local_estoque_id || lv.local_estoque_id === novoMapeamento.local_estoque_id)
                      .map(local => (
                        <SelectItem key={local.id} value={local.id}>
                          {local.icone} {local.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Quando selecionado, usará as composições específicas deste canal de venda
                </p>
              </div>

              <div className="col-span-2">
                <Label>Observações (opcional)</Label>
                <Input
                  value={novoMapeamento.observacoes}
                  onChange={(e) => setNovoMapeamento({ ...novoMapeamento, observacoes: e.target.value })}
                  placeholder="Notas adicionais sobre este mapeamento..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleSalvar} disabled={loading} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {editando ? 'Atualizar' : 'Salvar'}
              </Button>
              {editando && (
                <Button onClick={handleCancelar} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          {/* Lista de mapeamentos */}
          <div>
            <h3 className="text-sm font-semibold mb-3">
              Mapeamentos Configurados ({mapeamentos.length})
            </h3>
            
            {mapeamentos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum mapeamento configurado ainda.
              </div>
            ) : (
              <div className="space-y-2">
                {mapeamentos.map(mapeamento => (
                  <div key={mapeamento.id} className="border rounded-lg p-3 flex items-start justify-between hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{mapeamento.empresa}</Badge>
                        <Badge variant="outline">{translateLogisticType(mapeamento.tipo_logistico)}</Badge>
                      </div>
                      <div className="text-sm space-y-0.5">
                        <div>
                          <span className="text-muted-foreground">→ Estoque: </span>
                          <span className="font-medium">
                            {mapeamento.locais_estoque?.nome || 'Local não encontrado'}
                          </span>
                        </div>
                        {mapeamento.locais_venda && (
                          <div>
                            <span className="text-muted-foreground">→ Composição: </span>
                            <span className="font-medium text-primary">
                              {mapeamento.locais_venda.icone} {mapeamento.locais_venda.nome}
                            </span>
                          </div>
                        )}
                      </div>
                      {mapeamento.observacoes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {mapeamento.observacoes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditar(mapeamento)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletar(mapeamento.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
