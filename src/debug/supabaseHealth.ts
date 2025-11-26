import { supabase } from "@/integrations/supabase/client";

export type ProbeResult = {
  table: string;
  ok: boolean;
  count?: number | null;
  code?: string | number;
  message?: string;
  hint?: string;
  details?: string;
  path?: string;
};

export async function runSupabaseHealthCheck(context: string) {
  // Session and user
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session ?? null;
  const user = session?.user ?? null;

  // Env masking (Lovable does not use VITE_* envs; show placeholders)
  const mask = (v: string) => (v && v.length > 8 ? `${v.slice(0, 4)}…${v.slice(-4)}` : v);
  const env = {
    url: mask('https://supabase-client-config'),
    anon: mask('anon-key-client-config')
  };

  // Optional org id from global context if available
  interface WindowWithOrgId extends Window {
    __ORG_ID__?: string | null;
  }
  const orgId = (window as WindowWithOrgId).__ORG_ID__ ?? null;

  async function probe(table: string, withOrg?: boolean): Promise<ProbeResult> {
    const path = `/rest/v1/${table}`;
    try {
      let q: any = (supabase as any).from(table).select('id', { head: true, count: 'exact' }).limit(1);
      if (withOrg && orgId) q = q.eq('organization_id', orgId);
      const { error, count } = await q;
      if (error) {
        const code: any = (error as any).code ?? (error as any).status ?? undefined;
        const message = (error as any).message as string | undefined;
        const hint = (error as any).hint as string | undefined;
        const details = (error as any).details as string | undefined;
        return { table, ok: false, code, message, hint, details, path };
      }
      return { table, ok: true, count: count ?? null, path };
    } catch (e: any) {
      return { table, ok: false, code: e?.code, message: e?.message || String(e), path };
    }
  }

  const probes = await Promise.all([
    probe('historico_vendas', true),
    probe('mapeamentos_depara', true),
    probe('depara', true),
    probe('pedidos', true),
    probe('produtos', true),
    probe('movimentacoes_estoque', true),
    probe('itens_pedidos', true),
    // probe('te_estoque_minimo', true), // ✅ REMOVIDO: tabela não existe
    probe('profiles', true),
    probe('estoque', true)
  ]);

  return {
    context,
    sessionOk: !!session,
    user: user ? { id: user.id, email: (user as any).email } : null,
    env,
    orgId: orgId ?? 'NULL',
    probes,
  };
}

export const isRLSError = (code?: any) => code === '401' || code === '403' || code === 401 || code === 403 || code === 42501;

export const getRLSErrorMessage = (error: any): string => {
  if (!error) return 'Erro desconhecido';
  const code = error.code || 'N/A';
  const message = error.message || error.hint || error.details || 'sem detalhes';
  return `${code} – ${message}`;
};