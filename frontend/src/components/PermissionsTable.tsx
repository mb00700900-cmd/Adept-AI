import { Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const PermissionsTable = () => {
  const permissions = [
    { name: 'View Tasks', owner: true, editor: true, viewer: true },
    { name: 'Create Tasks', owner: true, editor: true, viewer: false },
    { name: 'Edit Tasks', owner: true, editor: true, viewer: false },
    { name: 'Delete Tasks', owner: true, editor: true, viewer: false },
    { name: 'Manage Team', owner: true, editor: false, viewer: false },
    { name: 'Project Settings', owner: true, editor: false, viewer: false },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Role Permissions</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">
                Permission
              </th>
              <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">
                Owner
              </th>
              <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">
                Editor
              </th>
              <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">
                Viewer
              </th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission, index) => (
              <tr key={index} className="border-b border-border last:border-0">
                <td className="py-3 px-3 text-sm text-foreground">{permission.name}</td>
                <td className="py-3 px-3 text-center">
                  {permission.owner ? (
                    <Check className="h-5 w-5 text-success inline-block" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground inline-block" />
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  {permission.editor ? (
                    <Check className="h-5 w-5 text-success inline-block" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground inline-block" />
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  {permission.viewer ? (
                    <Check className="h-5 w-5 text-success inline-block" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground inline-block" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
