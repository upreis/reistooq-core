import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield } from 'lucide-react';
import { UserManager } from '@/features/admin/components/UserManager';
import { RoleManager } from '@/features/admin/components/RoleManager';

export default function AdminUsuarios() {
  const [activeTab, setActiveTab] = useState('usuarios');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="cargos" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Cargos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="usuarios" className="mt-6">
          <UserManager />
        </TabsContent>
        
        <TabsContent value="cargos" className="mt-6">
          <RoleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}