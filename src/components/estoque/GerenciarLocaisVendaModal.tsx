import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Store, Plus, Loader2 } from 'lucide-react';

interface GerenciarLocaisVendaModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

interface LocalEstoque {
  id: string;
  nome: string;
  tipo: string;
}

const TIPOS_LOCAL_VENDA = [
  { value: 'marketplace', label: 'Marketplace', icon: '🛒' },
  { value: 'loja_fisica', label: 'Loja Física', icon: '🏪' },
  { value: 'atacado', label: 'Atacado', icon: '📦' },
  { value: 'outro', label: 'Outro', icon: '📍' }
];

const ICONES_DISPONIVEIS = ['🛒', '🏪', '📦', '🛍️', '💻', '📱', '🏬', '🎯'];

export function GerenciarLocaisVendaModal({ trigger, onSuccess }: GerenciarLocaisVendaModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('marketplace');
  const [localEstoqueId, setLocalEstoqueId] = useState<string>('');
  const [descricao, setDescricao] = useState('');
  const [icone, setIcone] = useState('🛒');
  const [locaisEstoque, setLocaisEstoque] = useState<LocalEstoque[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      carregarLocaisEstoque();
    }
  }, [open]);

  const carregarLocaisEstoque = async () => {
    const { data, error } = await supabase
      .from('locais_estoque')
      .select('id, nome, tipo')
      .eq('ativo', true)
      .order('nome');

    if (!error && data) {
      setLocaisEstoque(data);
      // Selecionar o principal por padrão
      const principal = data.find(l => l.tipo === 'principal');
      if (principal) {
        setLocalEstoqueId(principal.id);
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setNome('');
      setTipo('marketplace');
      setLocalEstoqueId('');
      setDescricao('');
      setIcone('🛒');
    }
  };

  const criarLocalVenda = async () => {
    if (!nome.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Digite um nome para o local de venda.',
        variant: 'destructive'
      });
      return;
    }

    if (!localEstoqueId) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione um local de estoque vinculado.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organizacao_id) throw new Error('Organização não encontrada');

      // Verificar se já existe
      const { data: existente } = await supabase
        .from('locais_venda')
        .select('id, nome')
        .eq('organization_id', profile.organizacao_id)
        .ilike('nome', nome.trim())
        .maybeSingle();

      if (existente) {
        toast({
          title: 'Nome já existe',
          description: `Já existe um local de venda chamado "${existente.nome}".`,
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('locais_venda')
        .insert([{
          organization_id: profile.organizacao_id,
          nome: nome.trim(),
          tipo,
          local_estoque_id: localEstoqueId,
          descricao: descricao.trim() || null,
          icone,
          ativo: true
        }]);

      if (error) throw error;

      toast({
        title: 'Local de venda criado!',
        description: `${nome} foi criado. Agora você pode definir as composições específicas para este canal.`
      });

      window.dispatchEvent(new Event('reload-locais-venda'));
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar local de venda:', error);
      toast({
        title: 'Erro ao criar local de venda',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Local de Venda
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Criar Novo Local de Venda
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Locais de venda têm composições próprias. Cada canal pode gastar quantidades diferentes de insumos.
          </p>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="nome">Nome do Local de Venda *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Mercado Livre, Shopee, Loja Centro..."
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Select value={icone} onValueChange={setIcone} disabled={loading}>
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONES_DISPONIVEIS.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={tipo} onValueChange={setTipo} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_LOCAL_VENDA.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="localEstoque">Local de Estoque Vinculado *</Label>
            <Select value={localEstoqueId} onValueChange={setLocalEstoqueId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estoque de origem" />
              </SelectTrigger>
              <SelectContent>
                {locaisEstoque.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.tipo === 'principal' ? '🏢' : '📦'} {l.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Os insumos serão retirados deste local de estoque quando houver vendas.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (Opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Informações adicionais sobre este canal de venda..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>ℹ️ Como funciona:</strong>
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <li>• Cada local de venda pode ter <strong>composições diferentes</strong></li>
              <li>• Ex: ML gasta 2 embalagens, Shopee gasta 1</li>
              <li>• As composições são definidas após criar o local</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={criarLocalVenda}
            disabled={loading || !nome.trim() || !localEstoqueId}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Criar Local de Venda
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
