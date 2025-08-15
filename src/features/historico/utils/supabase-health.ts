export const HC_ENABLED = false;           // kill-switch global
export const HC_TABLES = ['historico_vendas','mapeamentos_depara','produtos']; // REMOVED problematic tables

export const runSupabaseHealthCheck = async (context: string) => {
  if (!HC_ENABLED) {
    return { 
      sessionOk: true, 
      user: null, 
      probes: [] 
    };
  }
  
  // Implementation would go here when enabled
  return { sessionOk: true, user: null, probes: [] };
};