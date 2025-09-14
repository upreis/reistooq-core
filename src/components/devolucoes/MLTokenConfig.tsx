import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { MLApiService } from '@/services/mlApiService';
import { toast } from 'sonner';

interface MLTokenConfigProps {
  onTokenValidated?: (isValid: boolean) => void;
}

export function MLTokenConfig({ onTokenValidated }: MLTokenConfigProps) {
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const [userInfo, setUserInfo] = useState<any>(null);
  
  const mlService = new MLApiService();

  useEffect(() => {
    // Verificar se já existe um token salvo
    const savedToken = mlService.getAccessToken();
    if (savedToken) {
      setToken(savedToken);
      validateExistingToken();
    }
  }, []);

  const validateExistingToken = async () => {
    setIsValidating(true);
    try {
      const isValid = await mlService.validateToken();
      if (isValid) {
        const info = await mlService.getUserInfo();
        setUserInfo(info);
        setTokenStatus('valid');
        onTokenValidated?.(true);
      } else {
        setTokenStatus('invalid');
        onTokenValidated?.(false);
      }
    } catch (error) {
      setTokenStatus('invalid');
      onTokenValidated?.(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveToken = async () => {
    if (!token.trim()) {
      toast.error('Por favor, insira um token válido');
      return;
    }

    setIsValidating(true);
    
    try {
      mlService.setAccessToken(token.trim());
      
      // Validar o token
      const isValid = await mlService.validateToken();
      
      if (isValid) {
        const info = await mlService.getUserInfo();
        setUserInfo(info);
        setTokenStatus('valid');
        toast.success('Token configurado com sucesso!');
        onTokenValidated?.(true);
      } else {
        setTokenStatus('invalid');
        mlService.clearToken();
        toast.error('Token inválido. Verifique se o token está correto.');
        onTokenValidated?.(false);
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      setTokenStatus('invalid');
      mlService.clearToken();
      toast.error('Erro ao validar token. Verifique se está correto.');
      onTokenValidated?.(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearToken = () => {
    mlService.clearToken();
    setToken('');
    setTokenStatus('unknown');
    setUserInfo(null);
    onTokenValidated?.(false);
    toast.success('Token removido com sucesso');
  };

  const getStatusBadge = () => {
    switch (tokenStatus) {
      case 'valid':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Token Válido
          </Badge>
        );
      case 'invalid':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Token Inválido
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Não Configurado
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configuração Token Mercado Livre
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tokenStatus === 'valid' && userInfo ? (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-800">Token Configurado</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearToken}
                className="text-red-600 hover:text-red-700"
              >
                Remover Token
              </Button>
            </div>
            <div className="space-y-1 text-sm text-green-700">
              <p><strong>Usuário:</strong> {userInfo.nickname}</p>
              <p><strong>ID:</strong> {userInfo.id}</p>
              <p><strong>Site:</strong> {userInfo.site_id}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Para sincronizar dados das devoluções, você precisa configurar seu token de acesso do Mercado Livre.
                <Button
                  variant="link"
                  className="p-0 h-auto ml-1 text-blue-600"
                  onClick={() => window.open('https://developers.mercadolibre.com/pt_br/aplicacoes', '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Como obter o token
                </Button>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label htmlFor="ml-token" className="text-sm font-medium">Access Token do Mercado Livre</label>
              <div className="flex gap-2">
                <Input
                  id="ml-token"
                  type="password"
                  placeholder="APP_USR-1234567890-123456-abcdef123456789-123456"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleSaveToken}
                  disabled={isValidating || !token.trim()}
                >
                  {isValidating ? 'Validando...' : 'Salvar'}
                </Button>
              </div>
              {tokenStatus === 'invalid' && (
                <p className="text-sm text-red-600">
                  Token inválido. Verifique se o token está correto e possui as permissões necessárias.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}