import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building, MapPin, Phone, Mail, Globe, User, FileText, Upload, Save, Loader2, Camera } from 'lucide-react';
import { AvatarSelectionModal } from '@/components/admin/AvatarSelectionModal';

interface OrganizationData {
  id: string;
  nome: string;
  fantasia: string;
  razao_social: string;
  cnpj: string;
  slug: string;
  endereco: string;
  endereco_numero: string;
  bairro: string;
  complemento: string;
  cidade: string;
  cep: string;
  uf: string;
  telefone: string;
  fax: string;
  celular: string;
  email: string;
  website: string;
  segmento: string;
  tipo_pessoa: string;
  inscricao_estadual: string;
  ie_isento: boolean;
  inscricao_municipal: string;
  cnae: string;
  regime_tributario: string;
  logo_url: string;
  admin_nome: string;
  admin_email: string;
  admin_celular: string;
  onboarding_completed: boolean;
  plano: string;
}

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const SEGMENTOS = [
  'Comércio Varejista',
  'Comércio Atacadista',
  'Indústria',
  'Serviços',
  'Tecnologia',
  'Alimentação',
  'Moda e Vestuário',
  'Saúde',
  'Educação',
  'Construção',
  'Automóveis',
  'Outros'
];

const REGIMES_TRIBUTARIOS = [
  'Simples Nacional',
  'Lucro Presumido',
  'Lucro Real',
  'MEI',
  'Regime Normal'
];

export default function AdminPerfil() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Partial<OrganizationData>>({});
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      const { data: orgData, error } = await supabase.rpc('get_current_organization_data');
      
      if (error) {
        console.error('Error loading organization data:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      if (orgData) {
        setData(orgData as unknown as OrganizationData);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof OrganizationData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: result, error } = await supabase.rpc('update_organization_data', {
        p_data: data
      });

      if (error) {
        throw error;
      }

      const resultObj = result as { success: boolean; error?: string };
      if (!resultObj.success) {
        throw new Error(resultObj.error || 'Erro ao salvar');
      }

      toast({
        title: 'Dados salvos',
        description: 'Os dados da empresa foram atualizados com sucesso.',
      });

      // Reload to get updated slug
      await loadOrganizationData();
    } catch (err) {
      console.error('Error saving:', err);
      toast({
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 14);
    }
    return cleaned
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header com Proprietário */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar do Proprietário - Clicável */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setAvatarModalOpen(true)}
                className="relative group cursor-pointer"
              >
                <Avatar className="w-24 h-24 border-4 border-background shadow-lg transition-transform group-hover:scale-105">
                  <AvatarImage src={data.logo_url || undefined} alt={data.admin_nome || 'Proprietário'} />
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    {data.admin_nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'AD'}
                  </AvatarFallback>
                </Avatar>
                {/* Overlay com ícone de câmera */}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>
            
            {/* Dados do Proprietário */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <h1 className="text-2xl font-bold">{data.admin_nome || 'Nome do Proprietário'}</h1>
                <p className="text-muted-foreground">{data.fantasia || 'Nome da Empresa'}</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 text-sm text-muted-foreground">
                {data.admin_email && (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Mail className="w-4 h-4" />
                    <span>{data.admin_email}</span>
                  </div>
                )}
                {data.admin_celular && (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Phone className="w-4 h-4" />
                    <span>{data.admin_celular}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Botão Salvar */}
            <div className="flex-shrink-0">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Administrador - Editáveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Dados do Proprietário
          </CardTitle>
          <CardDescription>
            Informações pessoais do sócio ou responsável pela empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin_nome_top">Nome Completo</Label>
              <Input
                id="admin_nome_top"
                value={data.admin_nome || ''}
                onChange={(e) => handleChange('admin_nome', e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_email_top">E-mail</Label>
              <Input
                id="admin_email_top"
                type="email"
                value={data.admin_email || ''}
                onChange={(e) => handleChange('admin_email', e.target.value)}
                placeholder="admin@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_celular_top">Celular</Label>
              <Input
                id="admin_celular_top"
                value={data.admin_celular || ''}
                onChange={(e) => handleChange('admin_celular', formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Dados Principais
          </CardTitle>
          <CardDescription>
            Informações básicas da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="razao_social">Razão Social</Label>
              <Input
                id="razao_social"
                value={data.razao_social || ''}
                onChange={(e) => handleChange('razao_social', e.target.value)}
                placeholder="Nome completo da empresa"
              />
              <p className="text-xs text-muted-foreground">Nome completo da empresa</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fantasia">Fantasia *</Label>
              <Input
                id="fantasia"
                value={data.fantasia || ''}
                onChange={(e) => handleChange('fantasia', e.target.value)}
                placeholder="Nome fantasia"
                className="font-medium"
              />
              <p className="text-xs text-muted-foreground">
                Usado para logins: <strong className="text-primary">{data.slug || 'fantasia'}</strong>.usuario
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tipo da Pessoa</Label>
              <Select
                value={data.tipo_pessoa || 'PJ'}
                onValueChange={(value) => handleChange('tipo_pessoa', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={data.cnpj || ''}
                onChange={(e) => handleChange('cnpj', formatCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
              <Input
                id="inscricao_estadual"
                value={data.inscricao_estadual || ''}
                onChange={(e) => handleChange('inscricao_estadual', e.target.value)}
                placeholder="Inscrição Estadual"
                disabled={data.ie_isento}
              />
            </div>

            <div className="flex items-end pb-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ie_isento"
                  checked={data.ie_isento || false}
                  onCheckedChange={(checked) => handleChange('ie_isento', checked)}
                />
                <Label htmlFor="ie_isento" className="text-sm">IE Isento</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
              <Input
                id="inscricao_municipal"
                value={data.inscricao_municipal || ''}
                onChange={(e) => handleChange('inscricao_municipal', e.target.value)}
                placeholder="Inscrição Municipal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnae">CNAE</Label>
              <Input
                id="cnae"
                value={data.cnae || ''}
                onChange={(e) => handleChange('cnae', e.target.value)}
                placeholder="0000-0/00"
              />
            </div>

            <div className="space-y-2">
              <Label>Regime Tributário</Label>
              <Select
                value={data.regime_tributario || ''}
                onValueChange={(value) => handleChange('regime_tributario', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {REGIMES_TRIBUTARIOS.map(regime => (
                    <SelectItem key={regime} value={regime}>{regime}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Segmento de Atuação</Label>
              <Select
                value={data.segmento || ''}
                onValueChange={(value) => handleChange('segmento', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENTOS.map(seg => (
                    <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Área de atuação que melhor representa sua empresa</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={data.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="www.suaempresa.com.br"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={data.endereco || ''}
                onChange={(e) => handleChange('endereco', e.target.value)}
                placeholder="Rua, Avenida, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco_numero">Número</Label>
              <Input
                id="endereco_numero"
                value={data.endereco_numero || ''}
                onChange={(e) => handleChange('endereco_numero', e.target.value)}
                placeholder="123"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={data.bairro || ''}
                onChange={(e) => handleChange('bairro', e.target.value)}
                placeholder="Bairro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={data.complemento || ''}
                onChange={(e) => handleChange('complemento', e.target.value)}
                placeholder="Sala, Andar, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={data.cidade || ''}
                onChange={(e) => handleChange('cidade', e.target.value)}
                placeholder="Cidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={data.cep || ''}
                onChange={(e) => handleChange('cep', formatCEP(e.target.value))}
                placeholder="00000-000"
              />
            </div>

            <div className="space-y-2">
              <Label>UF</Label>
              <Select
                value={data.uf || ''}
                onValueChange={(value) => handleChange('uf', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {UF_OPTIONS.map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={data.telefone || ''}
                onChange={(e) => handleChange('telefone', formatPhone(e.target.value))}
                placeholder="(00) 0000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fax">Fax</Label>
              <Input
                id="fax"
                value={data.fax || ''}
                onChange={(e) => handleChange('fax', formatPhone(e.target.value))}
                placeholder="(00) 0000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                value={data.celular || ''}
                onChange={(e) => handleChange('celular', formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={data.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contato@suaempresa.com.br"
            />
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-end gap-2 sticky bottom-4">
        <Button variant="outline" onClick={loadOrganizationData}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </>
          )}
        </Button>
      </div>

      {/* Modal de Seleção de Avatar */}
      <AvatarSelectionModal
        open={avatarModalOpen}
        onOpenChange={setAvatarModalOpen}
        currentAvatar={data.logo_url}
        onAvatarChange={(avatarUrl) => handleChange('logo_url', avatarUrl)}
        userName={data.admin_nome || 'Proprietário'}
      />
    </div>
  );
}
