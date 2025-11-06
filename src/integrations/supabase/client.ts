import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { config } from '@/config/environment';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': `${config.app.name}/${config.app.version}`
      }
    },
    db: {
      schema: 'public'
    }
  }
);