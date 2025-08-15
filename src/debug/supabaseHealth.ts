import { supabase } from "@/integrations/supabase/client";

interface HealthCheckResult {
  session: any;
  user: any;
  lastApiError: any;
  envCheck: {
    url: string;
    anonKey: string;
  };
}

export const runSupabaseHealthCheck = async (context: string): Promise<HealthCheckResult> => {
  console.debug(`🔍 Supabase Health Check - Context: ${context}`);
  
  // 1. Check session and user
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  const user = session?.session?.user || null;
  
  console.debug('Supabase session:', {
    user: user ? { id: user.id, email: user.email } : null,
    sessionError: sessionError?.message
  });

  // 2. Check environment variables (masked)
  const supabaseUrl = 'https://tdjyfqnxvjgossuncpwm.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk';
  
  const envCheck = {
    url: `${supabaseUrl.substring(0, 8)}...${supabaseUrl.substring(supabaseUrl.length - 3)}`,
    anonKey: `${anonKey.substring(0, 3)}...${anonKey.substring(anonKey.length - 3)}`
  };
  
  console.debug('SUPABASE_URL (masked):', envCheck.url);
  console.debug('ANON_KEY (masked):', envCheck.anonKey);

  // 3. Test probe - try to access mapeamentos_depara table
  let lastApiError = null;
  try {
    const { data, error, count } = await supabase
      .from('mapeamentos_depara')
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    
    if (error) {
      lastApiError = error;
      console.error('Probe mapeamentos_depara error:', {
        code: error.code,
        message: error.message,
        hint: error.hint,
        details: error.details
      });
    } else {
      console.debug('Probe mapeamentos_depara: success, count =', count);
    }
  } catch (err: any) {
    lastApiError = err;
    console.error('Probe mapeamentos_depara exception:', err);
  }

  return {
    session: session?.session,
    user,
    lastApiError,
    envCheck
  };
};

export const isRLSError = (error: any): boolean => {
  return error && (error.code === '401' || error.code === '403' || error.code === 42501);
};

export const getRLSErrorMessage = (error: any): string => {
  if (!error) return 'Erro desconhecido';
  
  const code = error.code || 'N/A';
  const message = error.message || error.hint || error.details || 'sem detalhes';
  
  return `${code} – ${message}`;
};