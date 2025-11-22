import { useState } from 'react';
import { Mail, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import apiClient, { handleApiError } from '@/lib/api';
import { toast } from 'sonner';

interface InviteMemberFormProps {
  projectId: string;
  onInviteSent: () => void;
}

export const InviteMemberForm = ({ projectId, onInviteSent }: InviteMemberFormProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Owner' | 'Editor' | 'Viewer'>('Editor');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post(`/projects/${projectId}/invitations`, {
        invited_email: email.trim(),
        role: role
      });

      toast.success(`Invitation sent to ${email}`);
      setEmail('');
      setRole('Editor');
      onInviteSent();
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Invite New Member</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(value: any) => setRole(value)} disabled={isLoading}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Owner">
                <div>
                  <div className="font-medium">Owner</div>
                  <div className="text-xs text-muted-foreground">Full access + admin rights</div>
                </div>
              </SelectItem>
              <SelectItem value="Editor">
                <div>
                  <div className="font-medium">Editor</div>
                  <div className="text-xs text-muted-foreground">Can create and edit tasks</div>
                </div>
              </SelectItem>
              <SelectItem value="Viewer">
                <div>
                  <div className="font-medium">Viewer</div>
                  <div className="text-xs text-muted-foreground">Read-only access</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleInvite}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Send Invitation'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          They'll receive an email with a link to join this project
        </p>
      </div>
    </Card>
  );
};
