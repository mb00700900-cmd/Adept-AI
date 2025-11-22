import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Check, X, AlertCircle } from 'lucide-react';
import apiClient, { handleApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const InvitationPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);

      // Fetch invitation details
      const { data: invitationData } = await apiClient.get(`/team/invitations/by-token/${token}`);

      if (!invitationData) {
        setError('Invitation not found or has expired');
        return;
      }

      // Check if already accepted
      if (invitationData.accepted_at) {
        setError('This invitation has already been accepted');
        return;
      }

      // Check if expired
      if (new Date(invitationData.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      setInvitation(invitationData);

      // Fetch project details
      const { data: projectData } = await apiClient.get(`/projects/${invitationData.project_id}`);
      setProject(projectData);

    } catch (error: any) {
      console.error('Error fetching invitation:', error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      toast.error('Please log in to accept this invitation');
      navigate('/auth', { state: { returnTo: `/invitations/${token}` } });
      return;
    }

    if (user.email !== invitation.invited_email) {
      toast.error('Please log in with the invited email address');
      return;
    }

    setProcessing(true);
    try {
      await apiClient.post(`/team/invitations/${invitation.id}/accept`);

      toast.success(`You've joined ${project?.title} as ${invitation.role}`);
      navigate(`/project/${invitation.project_id}`);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(handleApiError(error));
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);
    try {
      await apiClient.delete(`/team/invitations/${invitation.id}`);

      toast.success('Invitation declined');
      navigate('/');
    } catch (error: any) {
      console.error('Error declining invitation:', error);
      toast.error(handleApiError(error));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Invitation</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const permissions = {
    Owner: ['View all tasks', 'Create new tasks', 'Edit and delete tasks', 'Manage team members', 'Project settings'],
    Editor: ['View all tasks', 'Create new tasks', 'Edit and delete tasks'],
    Viewer: ['View all tasks'],
  };

  const cannotDo = {
    Owner: [],
    Editor: ['Manage team members', 'Project settings'],
    Viewer: ['Create new tasks', 'Edit or delete tasks', 'Manage team members', 'Project settings'],
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Project Invitation</h1>
          <p className="text-muted-foreground">You've been invited to join a project!</p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="bg-muted p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Project</span>
                <span className="font-semibold text-foreground">{project?.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Your role</span>
                <Badge className="bg-primary text-primary-foreground">
                  {invitation?.role}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expires</span>
                <span className="text-sm text-foreground">
                  {formatDistanceToNow(new Date(invitation?.expires_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">What you can do:</h3>
            <ul className="space-y-2">
              {permissions[invitation?.role as keyof typeof permissions]?.map((perm, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-success flex-shrink-0" />
                  {perm}
                </li>
              ))}
            </ul>
          </div>

          {cannotDo[invitation?.role as keyof typeof cannotDo]?.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">What you cannot do:</h3>
              <ul className="space-y-2">
                {cannotDo[invitation?.role as keyof typeof cannotDo]?.map((perm, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4 text-destructive flex-shrink-0" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {user && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">You are logged in as:</p>
              <p className="font-medium text-foreground">{user.email}</p>
              {user.email !== invitation?.invited_email && (
                <p className="text-xs text-destructive mt-2">
                  ⚠️ This invitation was sent to {invitation?.invited_email}
                </p>
              )}
            </div>
          )}

          {!user && (
            <div className="bg-warning/10 p-4 rounded-lg border border-warning/20">
              <p className="text-sm text-foreground">
                Please log in with <strong>{invitation?.invited_email}</strong> to accept this invitation
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleAccept}
            disabled={processing || !user || user.email !== invitation?.invited_email}
            className="flex-1"
            size="lg"
          >
            <Check className="h-5 w-5 mr-2" />
            {processing ? 'Accepting...' : 'Accept Invitation'}
          </Button>
          <Button
            onClick={handleDecline}
            disabled={processing}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <X className="h-5 w-5 mr-2" />
            {processing ? 'Declining...' : 'Decline'}
          </Button>
        </div>

        {!user && (
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/auth', { state: { returnTo: `/invitations/${token}` } })}
            >
              Log in to accept
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default InvitationPage;
