import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { handleApiError } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Project } from '@/lib/types';

interface KPIData {
  totalProjects: number;
  projectsTrend: number;
  totalTasks: number;
  completionRate: number;
  avgProjectDuration: number;
  aiAccuracy: number;
}

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [kpiData, setKpiData] = useState<KPIData>({
    totalProjects: 0,
    projectsTrend: 0,
    totalTasks: 0,
    completionRate: 0,
    avgProjectDuration: 0,
    aiAccuracy: 0,
  });
  const [taskTrendData, setTaskTrendData] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, selectedProject, dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProjects(),
        fetchKPIData(),
        fetchTaskTrends(),
        fetchPriorityDistribution(),
        fetchStatusDistribution(),
      ]);
    } catch (error: any) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data } = await apiClient.get<Project[]>('/projects');
      setProjects(data || []);
    } catch (error) {
      throw error;
    }
  };

  const fetchKPIData = async () => {
    try {
      const params: any = { days: parseInt(dateRange) };
      if (selectedProject !== 'all') {
        params.project_id = selectedProject;
      }

      const { data } = await apiClient.get('/analytics/kpis', { params });

      setKpiData({
        totalProjects: data.total_projects || 0,
        projectsTrend: data.projects_trend || 0,
        totalTasks: data.total_tasks || 0,
        completionRate: data.completion_rate || 0,
        avgProjectDuration: data.avg_project_duration || 0,
        aiAccuracy: data.ai_accuracy || 0,
      });
    } catch (error) {
      throw error;
    }
  };

  const fetchTaskTrends = async () => {
    try {
      const params: any = { days: parseInt(dateRange) };
      if (selectedProject !== 'all') {
        params.project_id = selectedProject;
      }

      const { data } = await apiClient.get('/analytics/task-trends', { params });
      setTaskTrendData(data || []);
    } catch (error) {
      throw error;
    }
  };

  const fetchPriorityDistribution = async () => {
    try {
      const params: any = { days: parseInt(dateRange) };
      if (selectedProject !== 'all') {
        params.project_id = selectedProject;
      }

      const { data } = await apiClient.get('/analytics/priority-distribution', { params });
      
      const formattedData = [
        { name: 'High', value: data?.high || 0, color: 'hsl(var(--priority-high))' },
        { name: 'Medium', value: data?.medium || 0, color: 'hsl(var(--priority-medium))' },
        { name: 'Low', value: data?.low || 0, color: 'hsl(var(--priority-low))' },
      ];

      setPriorityData(formattedData);
    } catch (error) {
      throw error;
    }
  };

  const fetchStatusDistribution = async () => {
    try {
      const params: any = { days: parseInt(dateRange) };
      if (selectedProject !== 'all') {
        params.project_id = selectedProject;
      }

      const { data } = await apiClient.get('/analytics/status-distribution', { params });
      
      const formattedData = [
        { name: 'Todo', value: data?.todo || 0, fill: 'hsl(var(--status-todo))' },
        { name: 'In Progress', value: data?.in_progress || 0, fill: 'hsl(var(--status-in-progress))' },
        { name: 'Done', value: data?.done || 0, fill: 'hsl(var(--status-done))' },
      ];

      setStatusData(formattedData);
    } catch (error) {
      throw error;
    }
  };

  const handleExport = () => {
    toast.success('Export functionality coming soon!');
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 md:ml-64">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">Track your project performance and insights</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{kpiData.totalProjects}</div>
                <div className="flex items-center mt-2 text-sm">
                  {kpiData.projectsTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-success mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive mr-1" />
                  )}
                  <span className={kpiData.projectsTrend >= 0 ? 'text-success' : 'text-destructive'}>
                    {Math.abs(kpiData.projectsTrend).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{kpiData.totalTasks}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  {kpiData.completionRate.toFixed(0)}% complete
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Project Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{kpiData.avgProjectDuration} days</div>
                <p className="text-sm text-muted-foreground mt-2">
                  across {kpiData.totalProjects} project{kpiData.totalProjects !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-ai-badge/10 to-ai-badge/5 border-ai-badge/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">AI Suggestion Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{kpiData.aiAccuracy.toFixed(0)}%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  tasks accepted without changes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Task Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Task Creation Trends</CardTitle>
                <CardDescription>Tasks created and completed over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={taskTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Created"
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      name="Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Priority Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>Tasks by priority level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Current status of all tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
