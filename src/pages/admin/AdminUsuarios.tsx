import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Mail } from 'lucide-react';
import { UserManager } from '@/features/admin/components/UserManager';
import { RoleManager } from '@/features/admin/components/RoleManager';
import { InvitationManager } from '@/features/admin/components/InvitationManager';

export default function AdminUsuarios() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determina a aba ativa baseada na rota
  const getActiveTab = () => {
    if (location.pathname === '/admin/convites') return 'convites';
    if (location.pathname === '/admin/cargos') return 'cargos';
    return 'usuarios';
  };

  const handleTabChange = (value: string) => {
    if (value === 'convites') {
      navigate('/admin/convites');
    } else if (value === 'cargos') {
      navigate('/admin/cargos');
    } else {
      navigate('/admin/usuarios');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="cargos" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Cargos
          </TabsTrigger>
          <TabsTrigger value="convites" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Convites
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="usuarios" className="mt-6">
          <UserManager />
        </TabsContent>
        
        <TabsContent value="cargos" className="mt-6">
          <RoleManager />
        </TabsContent>
        
        <TabsContent value="convites" className="mt-6">
          <InvitationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}