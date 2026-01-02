import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Store, Loader2, Warehouse, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocalEstoque {
  id: string;
  nome: string;
  tipo: string;
}

interface LocalVenda {
  id: string;
  nome: string;
  tipo: string;
  icone: string;
  local_estoque_id: string;
}

interface LocalEstoqueOMSSelectorProps {
  value: string;
  onChange: (localEstoqueId: string, localVendaId?: string) => void;
  localVendaId?: string;
}

export function LocalEstoqueOMSSelector({ value, onChange, localVendaId }: LocalEstoqueOMSSelectorProps) {
  const [locaisEstoque, setLocaisEstoque] = useState<LocalEstoque[]>([]);
  const [locaisVenda, setLocaisVenda] = useState<LocalVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocalVendaId, setSelectedLocalVendaId] = useState<string | undefined>(localVendaId);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [estoquesRes, vendasRes] = await Promise.all([
        supabase
          .from('locais_estoque')
          .select('id, nome, tipo')
          .eq('ativo', true)
          .order('tipo')
          .order('nome'),
        supabase
          .from('locais_venda')
          .select('id, nome, tipo, icone, local_estoque_id')
          .eq('ativo', true)
          .order('nome')
      ]);

      if (estoquesRes.error) throw estoquesRes.error;
      if (vendasRes.error) throw vendasRes.error;

      const estoques = estoquesRes.data || [];
      const vendas = vendasRes.data || [];

      setLocaisEstoque(estoques);
      setLocaisVenda(vendas);

      // Lógica de seleção automática:
      // 1. Priorizar estoque "inhouse" que tenha locais de venda
      // 2. Se não houver, usar estoque "principal"
      if (!value) {
        const inhouseComVendas = estoques.find(e => 
          e.tipo === 'inhouse' && vendas.some(v => v.local_estoque_id === e.id)
        );
        
        if (inhouseComVendas) {
          const primeiroLocalVenda = vendas.find(v => v.local_estoque_id === inhouseComVendas.id);
          onChange(inhouseComVendas.id, primeiroLocalVenda?.id);
          setSelectedLocalVendaId(primeiroLocalVenda?.id);
        } else {
          const principal = estoques.find(e => e.tipo === 'principal');
          if (principal) {
            onChange(principal.id);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar locais:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se o estoque selecionado é inhouse e tem locais de venda
  const localEstoqueSelecionado = useMemo(() => 
    locaisEstoque.find(e => e.id === value),
    [locaisEstoque, value]
  );

  const locaisVendaDoEstoque = useMemo(() => 
    locaisVenda.filter(v => v.local_estoque_id === value),
    [locaisVenda, value]
  );

  const isInhouseComVendas = localEstoqueSelecionado?.tipo === 'inhouse' && locaisVendaDoEstoque.length > 0;

  const handleLocalEstoqueChange = (newValue: string) => {
    const novoEstoque = locaisEstoque.find(e => e.id === newValue);
    const vendasDoNovoEstoque = locaisVenda.filter(v => v.local_estoque_id === newValue);
    
    if (novoEstoque?.tipo === 'inhouse' && vendasDoNovoEstoque.length > 0) {
      const primeiroLocalVenda = vendasDoNovoEstoque[0];
      setSelectedLocalVendaId(primeiroLocalVenda.id);
      onChange(newValue, primeiroLocalVenda.id);
    } else {
      setSelectedLocalVendaId(undefined);
      onChange(newValue);
    }
  };

  const handleLocalVendaChange = (localVenda: LocalVenda) => {
    setSelectedLocalVendaId(localVenda.id);
    onChange(value, localVenda.id);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }

  // Agrupar estoques por tipo para exibição
  const inhouseEstoques = locaisEstoque.filter(e => e.tipo === 'inhouse');
  const outrosEstoques = locaisEstoque.filter(e => e.tipo !== 'inhouse');

  return (
    <div className="space-y-3">
      <div>
        <Label>Local de Estoque</Label>
        <Select value={value} onValueChange={handleLocalEstoqueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o estoque" />
          </SelectTrigger>
          <SelectContent>
            {inhouseEstoques.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  In-House (Prioridade)
                </div>
                {inhouseEstoques.map(l => {
                  const temVendas = locaisVenda.some(v => v.local_estoque_id === l.id);
                  return (
                    <SelectItem key={l.id} value={l.id}>
                      <span className="flex items-center gap-2">
                        🏢 {l.nome}
                        {temVendas && <span className="text-xs text-primary">(+locais de venda)</span>}
                      </span>
                    </SelectItem>
                  );
                })}
              </>
            )}
            {outrosEstoques.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-1">
                  <Warehouse className="h-3 w-3" />
                  Outros Estoques
                </div>
                {outrosEstoques.map(l => (
                  <SelectItem key={l.id} value={l.id}>
                    <span className="flex items-center gap-2">
                      {l.tipo === 'principal' ? '📦' : l.tipo === 'fullfilment' ? '🚀' : '📍'} {l.nome}
                      <span className="text-xs text-muted-foreground">({l.tipo})</span>
                    </span>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Se for inhouse com locais de venda, mostrar seletor de local de venda */}
      {isInhouseComVendas && (
        <div>
          <Label className="flex items-center gap-1.5 mb-2">
            <Store className="h-3.5 w-3.5 text-primary" />
            Local de Venda (Insumos)
          </Label>
          <div className="flex items-center gap-2 flex-wrap">
            {locaisVendaDoEstoque.map((local) => {
              const isActive = selectedLocalVendaId === local.id;
              
              return (
                <Button
                  key={local.id}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLocalVendaChange(local)}
                  className={cn(
                    "flex items-center gap-1.5 transition-all h-8 px-3 text-xs",
                    isActive && "shadow-md"
                  )}
                >
                  <span>{local.icone}</span>
                  <span className="font-medium">{local.nome}</span>
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Os insumos serão baixados conforme configurado em <a href="/estoque/composicoes" className="text-primary underline hover:text-primary/80">/estoque/composicoes</a>
          </p>
        </div>
      )}
    </div>
  );
}
