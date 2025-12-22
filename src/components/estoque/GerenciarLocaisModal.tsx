import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, Loader2, Copy } from 'lucide-react';
import { TipoLocalEstoque } from '@/features/estoque/types/locais.types';

interface GerenciarLocaisModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

// ✅ IMPORTANTE: 'principal' removido - só pode existir um Estoque Principal por organização (criado automaticamente pelo sistema)
const TIPOS_LOCAL = [
  { value: 'fullfilment', label: 'Fullfilment', icon: '📦' },
  { value: 'inhouse', label: 'In-house', icon: '🏠' },
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
  const [clonarEstoquePrincipal, setClonarEstoquePrincipal] = useState(false);
  const { toast } = useToast();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setNome('');
      setTipo('outro');
      setEndereco('');
      setDescricao('');
      setClonarEstoquePrincipal(false);
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

      // ✅ VALIDAÇÃO: Verificar se já existe um local com o mesmo nome na mesma organização
      const { data: locaisExistentes, error: checkError } = await supabase
        .from('locais_estoque')
        .select('id, nome, tipo')
        .eq('organization_id', profile.organizacao_id)
        .eq('ativo', true);

      if (checkError) {
        throw checkError;
      }

      // Comparação case-insensitive manual
      const localExistente = (locaisExistentes || []).find(
        l => l.nome.toLowerCase().trim() === nome.toLowerCase().trim()
      );

      if (localExistente) {
        toast({
          title: 'Nome já existe',
          description: `Já existe um local de estoque chamado "${localExistente.nome}". Por favor, escolha outro nome.`,
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

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

      // ✅ Se opção de clonar estiver ativada, copiar itens do Estoque Principal
      let produtosClonados = 0;
      if (clonarEstoquePrincipal) {
        // Encontrar o Estoque Principal
        const localPrincipal = (locaisExistentes || []).find(l => l.tipo === 'principal');
        
        if (localPrincipal) {
          // Buscar todos os itens do Estoque Principal
          const { data: itensPrincipal, error: itensError } = await supabase
            .from('estoque_por_local')
            .select('produto_id, quantidade')
            .eq('local_id', localPrincipal.id)
            .eq('organization_id', profile.organizacao_id);

          if (itensError) {
            console.error('Erro ao buscar itens do estoque principal:', itensError);
          } else if (itensPrincipal && itensPrincipal.length > 0) {
            // Inserir os mesmos itens no novo local
            const novosItens = itensPrincipal.map(item => ({
              organization_id: profile.organizacao_id,
              local_id: novoLocal.id,
              produto_id: item.produto_id,
              quantidade: item.quantidade
            }));

            const { error: insertError } = await supabase
              .from('estoque_por_local')
              .insert(novosItens);

            if (insertError) {
              console.error('Erro ao clonar itens:', insertError);
              toast({
                title: 'Aviso',
                description: 'Local criado, mas houve um erro ao clonar os itens do estoque principal.',
                variant: 'destructive'
              });
            } else {
              produtosClonados = itensPrincipal.length;
            }
          }
        }
      }
      
      const mensagem = clonarEstoquePrincipal && produtosClonados > 0
        ? `${nome} foi criado com ${produtosClonados} produto${produtosClonados > 1 ? 's' : ''} clonado${produtosClonados > 1 ? 's' : ''} do Estoque Principal.`
        : `${nome} foi criado. Use transferências para mover produtos para este local.`;

      toast({
        title: 'Local criado com sucesso!',
        description: mensagem
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
            Local de Estoque
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
            Crie um novo local de estoque. Você pode começar vazio ou clonar do Estoque Principal.
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

          {/* Opção de clonar do Estoque Principal */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <Copy className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="clonar" className="text-sm font-medium cursor-pointer">
                  Clonar do Estoque Principal
                </Label>
                <p className="text-xs text-muted-foreground">
                  Copiar todos os itens e quantidades
                </p>
              </div>
            </div>
            <Switch
              id="clonar"
              checked={clonarEstoquePrincipal}
              onCheckedChange={setClonarEstoquePrincipal}
              disabled={loading}
            />
          </div>

          <div className={`p-3 rounded-lg border ${clonarEstoquePrincipal ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'}`}>
            {clonarEstoquePrincipal ? (
              <>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>⚡ Modo clonar:</strong>
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                  <li>• Todos os produtos do Estoque Principal serão copiados</li>
                  <li>• As quantidades serão <strong>idênticas</strong> ao principal</li>
                  <li>• Ideal para iniciar um novo local com estoque completo</li>
                </ul>
              </>
            ) : (
              <>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>ℹ️ Como funciona:</strong>
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                  <li>• O local será criado <strong>vazio</strong></li>
                  <li>• Produtos são adicionados automaticamente ao <strong>transferir estoque</strong></li>
                  <li>• Composições são criadas conforme necessário no local</li>
                </ul>
              </>
            )}
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
                {clonarEstoquePrincipal ? 'Clonando...' : 'Criando...'}
              </>
            ) : (
              <>
                {clonarEstoquePrincipal ? <Copy className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {clonarEstoquePrincipal ? 'Criar e Clonar' : 'Criar Local'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
