import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { handleApiError } from '@/lib/api';
import type { Project, Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, LogOut, Sparkles, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { CreateProjectDialog } from '@/components/CreateProjectDialog';
import { ProjectCard } from '@/components/ProjectCard';
import { Sidebar } from '@/components/Sidebar';
import { StatisticsCards } from '@/components/StatisticsCards';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TaskStats {
  completed: number;
  in_progress: number;
  todo: number;
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [taskStats, setTaskStats] = useState<TaskStats>({ completed: 0, in_progress: 0, todo: 0 });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchTaskStats();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data } = await apiClient.get<Project[]>('/projects');
      setProjects(data || []);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskStats = async () => {
    try {
      // Fetch all tasks for current user's projects
      const { data: allProjects } = await apiClient.get<Project[]>('/projects');
      
      let allTasks: Task[] = [];
      for (const project of allProjects) {
        const { data: projectTasks } = await apiClient.get<Task[]>(`/projects/${project.id}/tasks`);
        allTasks = [...allTasks, ...projectTasks];
      }

      const stats = allTasks.reduce((acc, task) => {
        if (task.status === 'done') acc.completed++;
        else if (task.status === 'in_progress') acc.in_progress++;
        else acc.todo++;
        return acc;
      }, { completed: 0, in_progress: 0, todo: 0 });

      setTaskStats(stats);
    } catch (error) {
      console.error('Error fetching task stats:', error);
    }
  };

  const handleProjectCreated = () => {
    fetchProjects();
    fetchTaskStats();
    setShowCreateDialog(false);
  };

  const handleProjectDeleted = async (projectId: string) => {
    try {
      await apiClient.delete(`/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      toast.error(handleApiError(error));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getUserInitials = () => {
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 md:ml-64">
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="md:hidden flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Adept</h1>
            </div>
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-card z-50" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">My Account</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-6 md:p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-1">
              Welcome back, {user?.email?.split('@')[0]}
            </h2>
            <p className="text-muted-foreground">
              Manage your projects with AI-powered task planning
            </p>
          </div>

          <div className="mb-8">
            <StatisticsCards
              totalProjects={projects.length}
              completedTasks={taskStats.completed}
              inProgressTasks={taskStats.in_progress}
              pendingTasks={taskStats.todo}
            />
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-foreground">Your Projects</h3>
            <Button onClick={() => setShowCreateDialog(true)} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <Card className="text-center py-12">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Sparkles className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardTitle>No projects yet</CardTitle>
                <CardDescription className="mt-2">
                  Create your first project and let AI help you break it down into manageable tasks
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center">
                <Button onClick={() => setShowCreateDialog(true)} size="lg" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleProjectDeleted}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default Dashboard;
