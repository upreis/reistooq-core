// 🔐 Página de Reset de Senha

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
// import { Logo } from '@/components/ui/logo';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Verifica diferentes tipos de parâmetros que o Supabase pode enviar
  const token = searchParams.get('token');
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const type = searchParams.get('type');

  useEffect(() => {
    // Se não há nenhum token ou se o tipo não é recovery, redirecionar para solicitar reset
    if (!token && !accessToken && type !== 'recovery') {
      navigate('/auth');
    }
  }, [token, accessToken, type, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="h-12 w-12 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-bold">R</div>
          <h1 className="text-2xl font-bold text-foreground">REISTOQ</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sistema de Gestão Empresarial
          </p>
        </div>

        {/* Formulário de Reset */}
        <PasswordResetForm 
          mode={token || accessToken || type === 'recovery' ? 'reset' : 'request'}
          onBack={() => navigate('/auth')}
        />

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>© 2024 REISTOQ. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}