import { useState } from 'react';
import { User, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface TeamMember {
  user_id: string;
  email: string;
  username?: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  joined_at: string;
}

interface TeamMemberCardProps {
  member: TeamMember;
  isCurrentUser: boolean;
  currentUserRole: 'Owner' | 'Editor' | 'Viewer';
  onChangeRole: (userId: string, newRole: 'Owner' | 'Editor' | 'Viewer') => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}

export const TeamMemberCard = ({
  member,
  isCurrentUser,
  currentUserRole,
  onChangeRole,
  onRemove,
}: TeamMemberCardProps) => {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canManage = currentUserRole === 'Owner' && !isCurrentUser;
  const isOwner = member.role === 'Owner';

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Owner':
        return 'bg-primary text-primary-foreground';
      case 'Editor':
        return 'bg-secondary text-secondary-foreground';
      case 'Viewer':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleChangeRole = async (newRole: 'Owner' | 'Editor' | 'Viewer') => {
    setIsLoading(true);
    try {
      await onChangeRole(member.user_id, newRole);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await onRemove(member.user_id);
      setShowRemoveDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground truncate">
                  {member.username || member.email.split('@')[0]}
                  {isCurrentUser && <span className="text-muted-foreground ml-1">(You)</span>}
                </p>
                <Badge className={getRoleBadgeColor(member.role)}>
                  {member.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{member.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isLoading}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Manage Member</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isOwner && (
                  <>
                    <DropdownMenuItem onClick={() => handleChangeRole('Owner')}>
                      Change to Owner
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleChangeRole('Editor')}>
                      Change to Editor
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleChangeRole('Viewer')}>
                      Change to Viewer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => setShowRemoveDialog(true)}
                  className="text-destructive"
                  disabled={isOwner}
                >
                  Remove Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {isOwner && isCurrentUser && (
            <Badge variant="outline" className="ml-2">Project Owner</Badge>
          )}
        </div>
      </Card>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {member.username || member.email} from this project?
              They will lose all access to project tasks and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={isLoading}>
              {isLoading ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
