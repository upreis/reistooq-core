// 🔐 Formulário de Reset de Senha

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthEnterpriseService } from '@/services/AuthEnterpriseService';
import { Mail, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PasswordResetFormProps {
  mode?: 'request' | 'reset';
  onBack?: () => void;
}

export function PasswordResetForm({ mode = 'request', onBack }: PasswordResetFormProps) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<{
    valid: boolean;
    score: number;
    feedback: string[];
  } | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const result = await AuthEnterpriseService.requestPasswordReset(email);
      
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });

      if (result.success) {
        setEmail('');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro inesperado. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (password: string) => {
    setNewPassword(password);
    const strength = AuthEnterpriseService.validatePasswordStrength(password);
    setPasswordStrength(strength);
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) return;
    
    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'As senhas não coincidem'
      });
      return;
    }

    if (!passwordStrength?.valid) {
      setMessage({
        type: 'error',
        text: 'A senha não atende aos critérios de segurança'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await AuthEnterpriseService.confirmPasswordReset(newPassword);
      
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });

      if (result.success) {
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro inesperado. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'request') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Esqueceu sua senha?</CardTitle>
          <CardDescription>
            Digite seu email para receber instruções de redefinição
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            {message && (
              <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !email.trim()}
              >
                {loading ? 'Enviando...' : 'Enviar instruções'}
              </Button>

              {onBack && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={onBack}
                  disabled={loading}
                >
                  Voltar ao login
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>
        <CardTitle>Redefinir senha</CardTitle>
        <CardDescription>
          Digite sua nova senha
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleConfirmReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Digite sua nova senha"
              value={newPassword}
              onChange={(e) => handlePasswordChange(e.target.value)}
              autoComplete="new-password"
              required
              disabled={loading}
            />
            
            {passwordStrength && newPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Força da senha</span>
                  <span className={passwordStrength.score >= 80 ? 'text-green-600' : 'text-red-600'}>
                    {passwordStrength.score}%
                  </span>
                </div>
                <Progress value={passwordStrength.score} className="h-2" />
                
                {passwordStrength.feedback.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {passwordStrength.feedback.map((item, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirme sua nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={loading}
            />
          </div>

          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !newPassword || !confirmPassword || !passwordStrength?.valid}
          >
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}