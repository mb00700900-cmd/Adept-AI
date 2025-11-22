import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, CheckCircle2, Clock, ListTodo } from 'lucide-react';

interface StatisticsCardsProps {
  totalProjects: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
}

export const StatisticsCards = ({
  totalProjects,
  completedTasks,
  inProgressTasks,
  pendingTasks,
}: StatisticsCardsProps) => {
  const stats = [
    {
      title: 'Total Projects',
      value: totalProjects,
      icon: FolderKanban,
      color: 'text-primary',
    },
    {
      title: 'Completed Tasks',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'text-[hsl(var(--success))]',
    },
    {
      title: 'In Progress',
      value: inProgressTasks,
      icon: Clock,
      color: 'text-[hsl(var(--warning))]',
    },
    {
      title: 'Pending',
      value: pendingTasks,
      icon: ListTodo,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
