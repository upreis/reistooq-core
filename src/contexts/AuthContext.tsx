import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Verificação de segurança para React
if (!React || typeof React.useState !== 'function') {
  console.error('🚨 CRITICAL: React or useState not available!', { React: typeof React, useState: typeof React?.useState });
  throw new Error('React not properly loaded');
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signIn: async () => ({ error: new Error('AuthContext não inicializado') }),
  signUp: async () => ({ error: new Error('AuthContext não inicializado') }),
  signOut: async () => ({ error: new Error('AuthContext não inicializado') }),
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('🔧 AuthProvider: Starting render...', { 
    React: typeof React, 
    useState: typeof useState,
    children: !!children 
  });

  // Verificação adicional de segurança antes de usar hooks
  if (typeof useState !== 'function') {
    console.error('🚨 useState não está disponível no AuthProvider!');
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>🚨 Erro de Hook</h1>
          <p>useState não está disponível</p>
          <button onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      </div>
    );
  }

  try {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    console.log('🔧 AuthProvider: State initialized successfully');

    useEffect(() => {
      console.log('🔧 AuthProvider: useEffect starting...');
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('🔧 Auth state change:', event);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // Handle auth events
          if (event === 'SIGNED_IN') {
            toast.success("Login realizado com sucesso! Bem-vindo ao REISTOQ");
          } else if (event === 'SIGNED_OUT') {
            toast.error("Logout realizado. Até logo!");
          }
        }
      );

      // THEN check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('🔧 Initial session check:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(`Erro no login: ${error.message}`);
      }
      
      return { error };
    } catch (error: any) {
      toast.error("Erro no login: Ocorreu um erro inesperado");
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Email já cadastrado: Este email já possui uma conta. Tente fazer login.");
        } else {
          toast.error(`Erro no cadastro: ${error.message}`);
        }
      } else {
        toast.success("Cadastro realizado! Verifique seu email para confirmar a conta.");
      }
      
      return { error };
    } catch (error: any) {
      toast.error("Erro no cadastro: Ocorreu um erro inesperado");
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

    const value = {
      user,
      session,
      signIn,
      signUp,
      signOut,
      loading,
    };

    console.log('🔧 AuthProvider: Rendering with value:', { user: !!user, session: !!session, loading });

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  } catch (error) {
    console.error('🚨 Error in AuthProvider:', error);
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>🚨 Erro no AuthProvider</h1>
          <p>{error?.toString()}</p>
          <button onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      </div>
    );
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('useAuth usado fora do AuthProvider - usando valores padrão');
    return {
      user: null,
      session: null,
      signIn: async () => ({ error: new Error('AuthContext não disponível') }),
      signUp: async () => ({ error: new Error('AuthContext não disponível') }),
      signOut: async () => ({ error: new Error('AuthContext não disponível') }),
      loading: false,
    };
  }
  return context;
}