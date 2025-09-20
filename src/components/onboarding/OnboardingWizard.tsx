import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowRight, ArrowLeft, Building2, Users, Zap, Rocket } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<OnboardingStepProps>;
}

interface OnboardingStepProps {
  onNext: (data?: any) => void;
  onBack: () => void;
  data: any;
  setData: (data: any) => void;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao REISTOQ',
    description: 'Vamos configurar sua conta em poucos passos',
    icon: <Rocket className="h-6 w-6" />,
    component: WelcomeStep
  },
  {
    id: 'organization',
    title: 'Configure sua Organização',
    description: 'Informações da sua empresa',
    icon: <Building2 className="h-6 w-6" />,
    component: OrganizationStep
  },
  {
    id: 'profile',
    title: 'Complete seu Perfil',
    description: 'Suas informações pessoais',
    icon: <Users className="h-6 w-6" />,
    component: ProfileStep
  },
  {
    id: 'integrations',
    title: 'Conecte suas Integrações',
    description: 'Mercado Livre, Shopee e outras plataformas',
    icon: <Zap className="h-6 w-6" />,
    component: IntegrationsStep
  },
  {
    id: 'complete',
    title: 'Tudo Pronto!',
    description: 'Sua conta está configurada',
    icon: <CheckCircle className="h-6 w-6" />,
    component: CompleteStep
  }
];

export const OnboardingWizard = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [onboardingData, setOnboardingData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = async (stepData?: any) => {
    if (stepData) {
      setOnboardingData(prev => ({ ...prev, ...stepData }));
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Marcar onboarding como completo
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      logger.info('Onboarding completed successfully', { userId: user?.id });
      toast.success('Configuração concluída com sucesso!');
      
      // Redirecionar para dashboard
      window.location.href = '/';
    } catch (error) {
      logger.error('Failed to complete onboarding', error);
      toast.error('Erro ao finalizar configuração');
    } finally {
      setIsLoading(false);
    }
  };

  const StepComponent = currentStep.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Configuração Inicial
          </h1>
          <p className="text-muted-foreground">
            Vamos preparar tudo para você começar a usar o REISTOQ
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Passo {currentStepIndex + 1} de {steps.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% concluído
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              {currentStep.icon}
            </div>
            <CardTitle className="text-xl">{currentStep.title}</CardTitle>
            <p className="text-muted-foreground">{currentStep.description}</p>
          </CardHeader>
          <CardContent>
            <StepComponent
              onNext={handleNext}
              onBack={handleBack}
              data={onboardingData}
              setData={setOnboardingData}
            />
          </CardContent>
        </Card>

        {/* Step Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`h-2 w-8 rounded-full transition-colors ${
                index <= currentStepIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Step Components
function WelcomeStep({ onNext }: OnboardingStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <p className="text-lg">
          Bem-vindo ao <strong>REISTOQ</strong>! 🎉
        </p>
        <p className="text-muted-foreground">
          Sua plataforma completa para gerenciar vendas online, 
          estoque e integrações com marketplaces.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <div className="p-4 border rounded-lg">
          <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-medium">Multi-tenant</h3>
          <p className="text-sm text-muted-foreground">
            Cada organização isolada e segura
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-medium">Integrações</h3>
          <p className="text-sm text-muted-foreground">
            Mercado Livre, Shopee e mais
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <Users className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-medium">Equipe</h3>
          <p className="text-sm text-muted-foreground">
            Convide e gerencie usuários
          </p>
        </div>
      </div>

      <Button onClick={() => onNext()} className="w-full">
        Vamos Começar
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function OrganizationStep({ onNext, onBack, data, setData }: OnboardingStepProps) {
  const [formData, setFormData] = useState({
    nome: data.organizationName || '',
    descricao: data.organizationDescription || '',
    website: data.organizationWebsite || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome da organização é obrigatório');
      return;
    }

    try {
      // Salvar dados da organização
      const { error } = await supabase
        .from('organizacoes')
        .update({
          nome: formData.nome,
          descricao: formData.descricao,
          website: formData.website
        })
        .eq('id', data.organizationId);

      if (error) throw error;

      onNext({
        organizationName: formData.nome,
        organizationDescription: formData.descricao,
        organizationWebsite: formData.website
      });
    } catch (error) {
      logger.error('Failed to save organization data', error);
      toast.error('Erro ao salvar dados da organização');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome da Organização *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            placeholder="Ex: Minha Loja Online"
            required
          />
        </div>

        <div>
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            placeholder="Descreva brevemente sua empresa..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            placeholder="https://www.meusite.com.br"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button type="submit" className="flex-1">
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

function ProfileStep({ onNext, onBack, data, setData }: OnboardingStepProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nome_completo: data.fullName || user?.user_metadata?.full_name || '',
    telefone: data.phone || '',
    cargo: data.position || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome_completo: formData.nome_completo,
          telefone: formData.telefone,
          cargo: formData.cargo
        })
        .eq('id', user?.id);

      if (error) throw error;

      onNext({
        fullName: formData.nome_completo,
        phone: formData.telefone,
        position: formData.cargo
      });
    } catch (error) {
      logger.error('Failed to save profile data', error);
      toast.error('Erro ao salvar perfil');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nome_completo">Nome Completo</Label>
          <Input
            id="nome_completo"
            value={formData.nome_completo}
            onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
            placeholder="Seu nome completo"
          />
        </div>

        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <Label htmlFor="cargo">Cargo/Função</Label>
          <Input
            id="cargo"
            value={formData.cargo}
            onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
            placeholder="Ex: Gerente, Proprietário, Analista..."
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button type="submit" className="flex-1">
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

function IntegrationsStep({ onNext, onBack }: OnboardingStepProps) {
  const integrations = [
    {
      name: 'Mercado Livre',
      description: 'Sincronize pedidos e produtos do ML',
      icon: '🛒',
      available: true
    },
    {
      name: 'Shopee',
      description: 'Integração com marketplace Shopee',
      icon: '🛍️',
      available: true
    },
    {
      name: 'Tiny ERP',
      description: 'Sistema de gestão empresarial',
      icon: '📊',
      available: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Você pode conectar suas integrações agora ou fazer isso depois.
        </p>
      </div>

      <div className="space-y-3">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className={`p-4 border rounded-lg flex items-center justify-between ${
              !integration.available ? 'opacity-50' : 'hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{integration.icon}</span>
              <div>
                <h3 className="font-medium">{integration.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {integration.description}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!integration.available}
            >
              {integration.available ? 'Conectar' : 'Em Breve'}
            </Button>
          </div>
        ))}
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          💡 <strong>Dica:</strong> Você pode configurar as integrações a qualquer momento 
          através do menu Configurações → Integrações.
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={() => onNext()} className="flex-1">
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CompleteStep({ onNext }: OnboardingStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <h3 className="text-xl font-semibold">Parabéns! 🎉</h3>
        
        <p className="text-muted-foreground">
          Sua conta está configurada e pronta para uso. 
          Agora você pode começar a gerenciar seus pedidos, 
          estoque e integrações.
        </p>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <h4 className="font-medium">Próximos passos sugeridos:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Configure suas integrações com marketplaces</li>
          <li>• Importe seu catálogo de produtos</li>
          <li>• Convide membros da sua equipe</li>
          <li>• Explore o dashboard e relatórios</li>
        </ul>
      </div>

      <Button onClick={() => onNext()} className="w-full" size="lg">
        Ir para o Dashboard
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}