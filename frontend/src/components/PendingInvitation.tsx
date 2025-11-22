import { useState } from 'react';
import { Clock, Mail, RefreshCw, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  invited_email: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  created_at: string;
  expires_at: string;
  invitation_token: string;
}

interface PendingInvitationProps {
  invitation: Invitation;
  onResend: (invitationId: string) => Promise<void>;
  onCancel: (invitationId: string) => Promise<void>;
}

export const PendingInvitation = ({ invitation, onResend, onCancel }: PendingInvitationProps) => {
  const [isLoading, setIsLoading] = useState(false);

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

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await onResend(invitation.id);
      toast.success('Invitation resent successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await onCancel(invitation.id);
      toast.success('Invitation cancelled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const isExpired = new Date(invitation.expires_at) < new Date();

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-foreground truncate">{invitation.invited_email}</p>
              <Badge className={getRoleBadgeColor(invitation.role)}>
                {invitation.role}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1 space-y-1">
              <p>
                Invited {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
              </p>
              {isExpired ? (
                <p className="text-destructive font-medium">Expired</p>
              ) : (
                <p>
                  Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={isLoading}
            title="Resend invitation email"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
            title="Cancel invitation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
