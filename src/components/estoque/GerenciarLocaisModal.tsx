import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, Loader2 } from 'lucide-react';
import { TipoLocalEstoque } from '@/features/estoque/types/locais.types';

interface GerenciarLocaisModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const TIPOS_LOCAL = [
  { value: 'principal', label: 'Estoque Principal', icon: '🏢' },
  { value: 'fullfilment_ml', label: 'Fullfilment Mercado Livre', icon: '📦' },
  { value: 'fullfilment_shopee', label: 'Fullfilment Shopee', icon: '🛍️' },
  { value: 'filial', label: 'Filial', icon: '🏪' },
  { value: 'outro', label: 'Outro', icon: '📍' }
];

export function GerenciarLocaisModal({ trigger, onSuccess }: GerenciarLocaisModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoLocalEstoque>('outro');
  const [endereco, setEndereco] = useState('');
  const [descricao, setDescricao] = useState('');
  const { toast } = useToast();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setNome('');
      setTipo('outro');
      setEndereco('');
      setDescricao('');
    }
  };

  const criarLocal = async () => {
    if (!nome.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Digite um nome para o local de estoque.',
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

      // Criar o local
      const { data: novoLocal, error: localError } = await supabase
        .from('locais_estoque')
        .insert([{
          organization_id: profile.organizacao_id,
          nome: nome.trim(),
          tipo,
          endereco: endereco.trim() || null,
          descricao: descricao.trim() || null,
          ativo: true
        }])
        .select()
        .single();

      if (localError) throw localError;

      // Buscar todos os produtos ativos da organização (produtos)
      const { data: produtosAtivos, error: produtosError } = await supabase
        .from('produtos')
        .select('id')
        .eq('organization_id', profile.organizacao_id)
        .eq('ativo', true);

      if (produtosError) throw produtosError;

      // Buscar todos os produtos composições ativos
      const { data: composicoesAtivas, error: composicoesError } = await supabase
        .from('produtos_composicoes')
        .select('id')
        .eq('organization_id', profile.organizacao_id)
        .eq('ativo', true);

      if (composicoesError) throw composicoesError;

      // Criar registros de estoque_por_local com quantidade 0 para cada produto e composição
      const estoqueInicial = [];

      if (produtosAtivos && produtosAtivos.length > 0) {
        estoqueInicial.push(...produtosAtivos.map(produto => ({
          produto_id: produto.id,
          local_id: novoLocal.id,
          quantidade: 0,
          organization_id: profile.organizacao_id
        })));
      }

      if (composicoesAtivas && composicoesAtivas.length > 0) {
        estoqueInicial.push(...composicoesAtivas.map(composicao => ({
          produto_id: composicao.id,
          local_id: novoLocal.id,
          quantidade: 0,
          organization_id: profile.organizacao_id
        })));
      }

      if (estoqueInicial.length > 0) {
        const { error: estoqueError } = await supabase
          .from('estoque_por_local')
          .insert(estoqueInicial);

        if (estoqueError) throw estoqueError;
      }

      toast({
        title: 'Local criado com sucesso!',
        description: `${nome} foi criado com ${estoqueInicial.length} itens (produtos + composições) com quantidades zeradas.`
      });

      // Disparar evento para recarregar lista de locais
      window.dispatchEvent(new Event('reload-locais-estoque'));

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar local:', error);
      toast({
        title: 'Erro ao criar local',
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
            Novo Local de Estoque
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Criar Novo Local de Estoque
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Crie um novo local de estoque com produtos iniciando em quantidade zero
          </p>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Local *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Fullfilment Mercado Livre, Filial SP..."
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Local *</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoLocalEstoque)} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_LOCAL.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço (Opcional)</Label>
            <Input
              id="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro, cidade..."
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (Opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Informações adicionais sobre este local..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>ℹ️ Como funciona:</strong>
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <li>• Todos os produtos serão adicionados com <strong>quantidade ZERO</strong></li>
              <li>• Use transferências para mover estoque entre locais</li>
              <li>• Cada local funciona de forma independente</li>
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
            onClick={criarLocal}
            disabled={loading || !nome.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Criar Local
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
