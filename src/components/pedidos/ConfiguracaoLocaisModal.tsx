import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit2, Save, X, MapPin, Check, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  listarLocaisEstoque,
  listarMapeamentosLocais,
  criarMapeamentoLocal,
  atualizarMapeamentoLocal,
  deletarMapeamentoLocal,
  LocalEstoque,
  MapeamentoLocalEstoque
} from '@/services/LocalEstoqueService';

interface ConfiguracaoLocaisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresasSelecionadas?: string[]; // Empresas vindas do filtro
  contasML?: Array<{ id: string; name: string; nickname?: string; }>;
}

export function ConfiguracaoLocaisModal({ 
  open, 
  onOpenChange, 
  empresasSelecionadas = [],
  contasML = []
}: ConfiguracaoLocaisModalProps) {
  const [locais, setLocais] = useState<LocalEstoque[]>([]);
  const [mapeamentos, setMapeamentos] = useState<MapeamentoLocalEstoque[]>([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [empresaSelectorOpen, setEmpresaSelectorOpen] = useState(false);
  const [tipoLogisticoOpen, setTipoLogisticoOpen] = useState(false);
  const [customTipoLogistico, setCustomTipoLogistico] = useState('');
  // Form state
  const [novoMapeamento, setNovoMapeamento] = useState({
    empresa: '',
    tipo_logistico: '',
    marketplace: '',
    local_estoque_id: '',
    observacoes: ''
  });

  useEffect(() => {
    if (open) {
      carregarDados();
      
      // Preencher automaticamente a empresa se houver apenas uma selecionada
      if (empresasSelecionadas.length === 1 && !editando) {
        const empresaNome = contasML.find(c => c.id === empresasSelecionadas[0])?.nickname || 
                           contasML.find(c => c.id === empresasSelecionadas[0])?.name || 
                           empresasSelecionadas[0];
        setNovoMapeamento(prev => ({ ...prev, empresa: empresaNome }));
      }
      // Se for um novo mapeamento, abrir o seletor de empresa
      if (!editando && !novoMapeamento.empresa) {
        setEmpresaSelectorOpen(true);
      }
    }
  }, [open, empresasSelecionadas, contasML]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [locaisData, mapeamentosData] = await Promise.all([
        listarLocaisEstoque(),
        listarMapeamentosLocais()
      ]);
      setLocais(locaisData);
      setMapeamentos(mapeamentosData);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!novoMapeamento.empresa || !novoMapeamento.tipo_logistico || 
        !novoMapeamento.marketplace || !novoMapeamento.local_estoque_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      if (editando) {
        await atualizarMapeamentoLocal(editando, {
          ...novoMapeamento,
          ativo: true
        });
        toast.success('Mapeamento atualizado!');
      } else {
        await criarMapeamentoLocal({
          ...novoMapeamento,
          ativo: true
        });
        toast.success('Mapeamento criado!');
      }
      
      setNovoMapeamento({
        empresa: '',
        tipo_logistico: '',
        marketplace: '',
        local_estoque_id: '',
        observacoes: ''
      });
      setEditando(null);
      await carregarDados();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (mapeamento: MapeamentoLocalEstoque) => {
    setNovoMapeamento({
      empresa: mapeamento.empresa,
      tipo_logistico: mapeamento.tipo_logistico,
      marketplace: mapeamento.marketplace,
      local_estoque_id: mapeamento.local_estoque_id,
      observacoes: mapeamento.observacoes || ''
    });
    setEditando(mapeamento.id);
  };

  const handleDeletar = async (id: string) => {
    if (!confirm('Deseja realmente excluir este mapeamento?')) return;
    
    try {
      setLoading(true);
      await deletarMapeamentoLocal(id);
      toast.success('Mapeamento excluído!');
      await carregarDados();
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
      marketplace: '',
      local_estoque_id: '',
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
            Configure de qual local o estoque será retirado com base em: Empresa + Tipo Logístico + Marketplace
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
                    {contasML.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nenhuma conta disponível
                      </div>
                    ) : (
                      contasML.map((conta) => (
                        <SelectItem key={conta.id} value={conta.nickname || conta.name}>
                          <div className="flex flex-col">
                            <span className="font-medium">{conta.nickname || conta.name}</span>
                            {conta.nickname && conta.name && conta.nickname !== conta.name && (
                              <span className="text-xs text-muted-foreground">{conta.name}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo Logístico *</Label>
                <Popover open={tipoLogisticoOpen} onOpenChange={setTipoLogisticoOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={tipoLogisticoOpen}
                      className="w-full justify-between"
                    >
                      {novoMapeamento.tipo_logistico 
                        ? ([
                            { value: 'fulfillment', label: 'Fulfillment (Full)' },
                            { value: 'self_service', label: 'Envios Flex' },
                            { value: 'cross_docking', label: 'Cross Docking' },
                            { value: 'drop_off', label: 'Drop Off' },
                            { value: 'xd_drop_off', label: 'XD Drop Off' },
                            { value: 'FBM', label: 'FBM (Full by Merchant)' },
                            { value: 'FLEX', label: 'FLEX (Mercado Envios Flex)' },
                            { value: 'Padrão', label: 'Padrão' },
                            { value: 'Expresso', label: 'Expresso' },
                            { value: 'Normal', label: 'Normal' },
                          ].find(t => t.value === novoMapeamento.tipo_logistico)?.label || novoMapeamento.tipo_logistico)
                        : "Selecione ou digite..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-background border border-border" style={{ zIndex: 9999 }}>
                    <Command>
                      <CommandInput 
                        placeholder="Digite ou busque..." 
                        value={customTipoLogistico}
                        onValueChange={setCustomTipoLogistico}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setNovoMapeamento({ ...novoMapeamento, tipo_logistico: customTipoLogistico });
                              setTipoLogisticoOpen(false);
                              setCustomTipoLogistico('');
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Usar "{customTipoLogistico}"
                          </Button>
                        </CommandEmpty>
                        <CommandGroup heading="Tipos Conhecidos">
                          {[
                            { value: 'fulfillment', label: 'Fulfillment (Full)' },
                            { value: 'self_service', label: 'Envios Flex' },
                            { value: 'cross_docking', label: 'Cross Docking' },
                            { value: 'drop_off', label: 'Drop Off' },
                            { value: 'xd_drop_off', label: 'XD Drop Off' },
                            { value: 'FBM', label: 'FBM (Full by Merchant)' },
                            { value: 'FLEX', label: 'FLEX (Mercado Envios Flex)' },
                            { value: 'Padrão', label: 'Padrão' },
                            { value: 'Expresso', label: 'Expresso' },
                            { value: 'Normal', label: 'Normal' },
                          ].map((tipo) => (
                            <CommandItem
                              key={tipo.value}
                              value={tipo.value}
                              className="cursor-pointer"
                              onSelect={(value) => {
                                setNovoMapeamento({ ...novoMapeamento, tipo_logistico: value });
                                setTipoLogisticoOpen(false);
                                setCustomTipoLogistico('');
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  novoMapeamento.tipo_logistico === tipo.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {tipo.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Marketplace *</Label>
                <Select
                  value={novoMapeamento.marketplace}
                  onValueChange={(value) => setNovoMapeamento({ ...novoMapeamento, marketplace: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mercado Livre">Mercado Livre</SelectItem>
                    <SelectItem value="Shopee">Shopee</SelectItem>
                    <SelectItem value="Tiny">Tiny</SelectItem>
                    <SelectItem value="Interno">Interno / Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Local de Estoque *</Label>
                <Select
                  value={novoMapeamento.local_estoque_id}
                  onValueChange={(value) => setNovoMapeamento({ ...novoMapeamento, local_estoque_id: value })}
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
                        <Badge variant="outline">{mapeamento.tipo_logistico}</Badge>
                        <Badge>{mapeamento.marketplace}</Badge>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">→ Local: </span>
                        <span className="font-medium">
                          {mapeamento.locais_estoque?.nome || 'Local não encontrado'}
                        </span>
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
