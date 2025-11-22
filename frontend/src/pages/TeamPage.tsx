import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import apiClient, { handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TeamMemberCard } from '@/components/TeamMemberCard';
import { InviteMemberForm } from '@/components/InviteMemberForm';
import { PendingInvitation } from '@/components/PendingInvitation';
import { PermissionsTable } from '@/components/PermissionsTable';
import { toast } from 'sonner';
import { ProjectMember, ProjectInvitation, Project } from '@/lib/types';

interface TeamMember {
  user_id: string;
  email: string;
  username?: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  joined_at: string;
}

interface Invitation {
  id: string;
  invited_email: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  created_at: string;
  expires_at: string;
  invitation_token: string;
}

const TeamPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<'Owner' | 'Editor' | 'Viewer'>('Viewer');

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get current user from context (already available through useAuth)
      const { data: currentUserData } = await apiClient.get('/auth/me');
      if (!currentUserData) {
        navigate('/auth');
        return;
      }
      setCurrentUserId(currentUserData.id);

      // Fetch project
      const { data: projectData } = await apiClient.get<Project>(`/projects/${projectId}`);
      setProject(projectData);

      // Fetch team members
      const { data: membersData } = await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`);

      const membersWithEmails = membersData?.map(member => ({
        user_id: member.user_id,
        email: member.email || '',
        username: member.username,
        role: member.role as 'Owner' | 'Editor' | 'Viewer',
        joined_at: member.joined_at,
      })) || [];

      setMembers(membersWithEmails);

      // Set current user role
      const currentMember = membersWithEmails.find(m => m.user_id === currentUserData.id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      }

      // Fetch pending invitations
      const { data: invitationsData } = await apiClient.get<ProjectInvitation[]>(`/projects/${projectId}/invitations`);
      setPendingInvitations(invitationsData || []);

    } catch (error: any) {
      console.error('Error fetching team data:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'Owner' | 'Editor' | 'Viewer') => {
    try {
      await apiClient.put(`/projects/${projectId}/members/${userId}`, { role: newRole });

      toast.success('Member role updated successfully');
      fetchData();
    } catch (error: any) {
      toast.error(handleApiError(error));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await apiClient.delete(`/projects/${projectId}/members/${userId}`);

      toast.success('Member removed successfully');
      fetchData();
    } catch (error: any) {
      toast.error(handleApiError(error));
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await apiClient.post(`/team/invitations/${invitationId}/resend`);
      toast.success('Invitation resent successfully');
    } catch (error: any) {
      toast.error(handleApiError(error));
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await apiClient.delete(`/team/invitations/${invitationId}`);

      toast.success('Invitation cancelled');
      fetchData();
    } catch (error: any) {
      toast.error(handleApiError(error));
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  const isOwner = currentUserRole === 'Owner';

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 overflow-y-auto">
        <div className="p-8">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/' },
              { label: project?.title || 'Project', href: `/project/${projectId}` },
              { label: 'Team' },
            ]}
          />

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/project/${projectId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Users className="h-8 w-8" />
                  Team Members
                </h1>
                <p className="text-muted-foreground mt-1">{project?.title}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Section - Current Team */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Current Team ({members.length} {members.length === 1 ? 'member' : 'members'})
                </h2>
                <div className="space-y-3">
                  {members.map((member) => (
                    <TeamMemberCard
                      key={member.user_id}
                      member={member}
                      isCurrentUser={member.user_id === currentUserId}
                      currentUserRole={currentUserRole}
                      onChangeRole={handleChangeRole}
                      onRemove={handleRemoveMember}
                    />
                  ))}
                </div>
              </div>

              <PermissionsTable />
            </div>

            {/* Right Section - Invite & Pending */}
            <div className="space-y-6">
              {isOwner && (
                <InviteMemberForm
                  projectId={projectId!}
                  onInviteSent={fetchData}
                />
              )}

              {pendingInvitations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Pending Invitations ({pendingInvitations.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation) => (
                      <PendingInvitation
                        key={invitation.id}
                        invitation={invitation}
                        onResend={handleResendInvitation}
                        onCancel={handleCancelInvitation}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!isOwner && (
                <div className="p-6 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Only project owners can invite new members and manage the team.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamPage;
