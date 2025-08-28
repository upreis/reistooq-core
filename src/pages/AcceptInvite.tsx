import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'validating' | 'accepting' | 'error' | 'done'>('validating');
  const [message, setMessage] = useState<string>('Validando convite...');

  useEffect(() => {
    if (!token) {
      navigate('/auth', { replace: true });
      return;
    }

    const run = async () => {
      try {
        // 1) Validate token first (secure function does not expose PII)
        const { data: validData, error: validErr } = await supabase
          .rpc('validate_invitation_token_secure', { p_token: token });

        if (validErr || !validData?.[0]?.is_valid) {
          setStatus('error');
          setMessage('Convite inválido ou expirado.');
          return;
        }

        // 2) If user is not authenticated, send them to auth with invite param
        if (!user) {
          navigate(`/auth?invite=${token}`, { replace: true });
          return;
        }

        // 3) Accept invitation when user is authenticated
        setStatus('accepting');
        setMessage('Aceitando convite...');
        const { error } = await supabase.rpc('accept_invitation_secure', { _token: token });
        if (error) {
          setStatus('error');
          setMessage('Não foi possível aceitar o convite.');
          return;
        }

        setStatus('done');
        setMessage('Convite aceito com sucesso! Redirecionando...');
        navigate('/', { replace: true });
      } catch (e) {
        setStatus('error');
        setMessage('Erro ao processar o convite.');
      }
    };

    run();
  }, [token, user, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <section className="text-center space-y-2">
        <h1 className="text-xl font-semibold text-foreground">Convite</h1>
        <p className="text-muted-foreground">{message}</p>
      </section>
    </main>
  );
}
