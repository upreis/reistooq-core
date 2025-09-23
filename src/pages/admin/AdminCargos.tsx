import { RoleManager } from '@/features/admin/components/RoleManager';
import { PermissionsDebug } from '@/components/debug/PermissionsDebug';
import { UserPermissionAssigner } from '@/components/admin/UserPermissionAssigner';
import { PermissionsGuide } from '@/components/admin/PermissionsGuide';

export default function AdminCargos() {
  return (
    <div className="space-y-6">
      <PermissionsDebug />
      <UserPermissionAssigner />
      <PermissionsGuide />
      <RoleManager />
    </div>
  );
}