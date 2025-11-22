import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Plus, Loader2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { TaskCard } from '@/components/TaskCard';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { Sidebar } from '@/components/Sidebar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Project, Task } from '@/lib/types';

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectAndTasks();
    }
  }, [projectId]);

  const fetchProjectAndTasks = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        apiClient.get<Project>(`/projects/${projectId}`),
        apiClient.get<Task[]>(`/projects/${projectId}/tasks`)
      ]);

      setProject(projectRes.data);
      setTasks(tasksRes.data || []);
    } catch (error: any) {
      toast.error(handleApiError(error));
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleTasksCreated = () => {
    fetchProjectAndTasks();
  };

  const handleTaskUpdated = async (taskId: string, updates: Partial<Task>) => {
    try {
      await apiClient.put(`/tasks/${taskId}`, updates);

      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
      toast.success('Task updated');
    } catch (error: any) {
      toast.error(handleApiError(error));
    }
  };

  const handleTaskDeleted = async (taskId: string) => {
    try {
      await apiClient.delete(`/tasks/${taskId}`);

      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch (error: any) {
      toast.error(handleApiError(error));
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const totalEffort = tasks.reduce((sum, t) => sum + (t.effort_estimate || 0), 0);
  const completedEffort = doneTasks.reduce((sum, t) => sum + (t.effort_estimate || 0), 0);
  const progressPercent = totalEffort > 0 ? Math.round((completedEffort / totalEffort) * 100) : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 md:ml-64">
        <main className="p-6 md:p-8">
          <Breadcrumb 
            items={[
              { label: 'Dashboard', href: '/' },
              { label: project.title }
            ]} 
          />

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
                {project.description && (
                  <p className="text-muted-foreground mt-1">{project.description}</p>
                )}
              </div>
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button 
                onClick={() => navigate(`/project/${projectId}/team`)}
                variant="outline"
                size="lg"
                className="gap-2 flex-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Team
              </Button>
              <Button 
                onClick={() => navigate(`/project/${projectId}/ai-generate`)}
                size="lg"
                className="gap-2 flex-1 bg-accent hover:bg-accent/90"
              >
                <Sparkles className="h-5 w-5" />
                Generate AI Tasks
              </Button>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                variant="outline"
                size="lg"
                className="gap-2 flex-1"
              >
                <Plus className="h-5 w-5" />
                Add Task Manually
              </Button>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground font-medium">Progress</span>
                    <span className="font-bold text-foreground">{progressPercent}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  <span className="font-semibold text-foreground">{completedEffort}h</span> / {totalEffort}h
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-3 w-3 rounded-full bg-muted" />
                <h3 className="text-lg font-semibold text-foreground">
                  To Do <span className="text-muted-foreground">({todoTasks.length})</span>
                </h3>
              </div>
              <div className="space-y-3">
                {todoTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No tasks yet
                  </div>
                ) : (
                  todoTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={handleTaskUpdated}
                      onDelete={handleTaskDeleted}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-3 w-3 rounded-full bg-status-in-progress" />
                <h3 className="text-lg font-semibold text-foreground">
                  In Progress <span className="text-muted-foreground">({inProgressTasks.length})</span>
                </h3>
              </div>
              <div className="space-y-3">
                {inProgressTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No tasks yet
                  </div>
                ) : (
                  inProgressTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={handleTaskUpdated}
                      onDelete={handleTaskDeleted}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-3 w-3 rounded-full bg-status-done" />
                <h3 className="text-lg font-semibold text-foreground">
                  Done <span className="text-muted-foreground">({doneTasks.length})</span>
                </h3>
              </div>
              <div className="space-y-3">
                {doneTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No tasks yet
                  </div>
                ) : (
                  doneTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={handleTaskUpdated}
                      onDelete={handleTaskDeleted}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        projectId={projectId!}
        onTaskCreated={handleTasksCreated}
      />
    </div>
  );
};

export default ProjectDetail;
