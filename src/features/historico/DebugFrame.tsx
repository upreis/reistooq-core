import React from 'react';
import { useLocation } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { History } from 'lucide-react';

const BUILD_STAMP = new Date().toISOString();

type ProbeResult = {
  table: string;
  ok: boolean;
  code?: string | number;
  message?: string;
  count?: number | null;
};

async function runSupabaseHealthCheckV2(context: string) {
  console.info("Running Supabase Health Check v2", context);
  
  // Get session
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session ?? null;
  const user = session?.user ?? null;

  async function probe(table: string): Promise<ProbeResult> {
    try {
      const { error, count } = await (supabase as any)
        .from(table)
        .select('id', { head: true, count: 'exact' })
        .limit(1);
      
      if (error) {
        return {
          table,
          ok: false,
          code: (error as any).code ?? (error as any).status,
          message: error.message
        };
      }
      
      return { table, ok: true, count: count ?? null };
    } catch (e: any) {
      return {
        table,
        ok: false,
        code: e?.code ?? 'unknown',
        message: e?.message || String(e)
      };
    }
  }

  const probes = await Promise.all([
    probe('historico_vendas'),
    probe('pedidos'),
    probe('itens_pedidos'),
    probe('produtos'),
    probe('mapeamentos_depara')
  ]);

  return {
    context,
    sessionOk: !!session,
    user: user ? { id: user.id, email: (user as any).email } : null,
    probes
  };
}

export const HistoricoDebugFrame: React.FC = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [healthCheck, setHealthCheck] = React.useState<any>(null);

  React.useEffect(() => {
    console.info("HISTÓRICO v3 mounted", BUILD_STAMP);
    
    runSupabaseHealthCheckV2('historico').then((result) => {
      console.debug('Health Check Result:', result);
      setHealthCheck(result);
    });
  }, []);

  const isRLSCode = (code: any) => {
    return code === '401' || code === '403' || code === 401 || code === 403 || code === 42501;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header com banner de debug */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Histórico de Vendas</h1>
              <div 
                data-testid="hv-stamp" 
                className="text-sm bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded text-amber-600 inline-block"
              >
                HISTÓRICO v3 — {BUILD_STAMP}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Path: {location.pathname}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 container py-6 space-y-6">
        {/* Debug — Supabase */}
        <Card>
          <CardHeader>
            <CardTitle>Debug — Supabase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm">
                <strong>Session:</strong> {healthCheck?.sessionOk ? 'OK' : 'NULL'} — 
                <strong>User:</strong> {healthCheck?.user?.email || '—'} ({healthCheck?.user?.id || '—'})
              </div>

              {healthCheck?.probes && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {healthCheck.probes.map((probe: ProbeResult, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-sm">{probe.table}</TableCell>
                        <TableCell>
                          {probe.ok ? (
                            <Badge variant="outline" className="text-green-600">OK</Badge>
                          ) : (
                            <div className="flex gap-1">
                              <Badge variant="destructive">ERRO</Badge>
                              {isRLSCode(probe.code) && (
                                <Badge variant="outline" className="text-orange-600">RLS</Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{probe.count ?? '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{probe.code ?? '—'}</TableCell>
                        <TableCell className="text-xs max-w-xs truncate" title={probe.message}>
                          {probe.message ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Manager — sempre visível */}
        <section data-testid="hv-file-manager">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📂 Gerenciamento de Arquivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  onClick={() => toast({
                    title: "Template",
                    description: "Download template (stub)"
                  })}
                >
                  📥 Download Template
                </Button>
                <Button 
                  onClick={() => toast({
                    title: "Importar",
                    description: "Abrir wizard (stub)"
                  })}
                >
                  📤 Importar Dados
                </Button>
                <Button 
                  onClick={() => toast({
                    title: "Exportar",
                    description: "Export filtrado (stub)"
                  })}
                >
                  📊 Exportar
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Placeholder para dados futuros */}
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>📊 Dados e filtros serão reintroduzidos por etapas</p>
            <p className="text-sm mt-2">Por enquanto, apenas UI básica + debug funcional</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};