import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Sparkles, Edit2, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  effort_estimate: number | null;
  status: 'todo' | 'in_progress' | 'done';
  ai_generated: boolean;
  ai_priority_suggestion: 'low' | 'medium' | 'high' | null;
  ai_effort_suggestion: number | null;
  created_by: 'ai' | 'user';
}

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

const priorityColors = {
  high: 'bg-priority-high text-priority-high-foreground',
  medium: 'bg-priority-medium text-priority-medium-foreground',
  low: 'bg-priority-low text-priority-low-foreground'
};

const statusColors = {
  todo: 'bg-status-todo text-status-todo-foreground',
  in_progress: 'bg-status-in-progress text-status-in-progress-foreground',
  done: 'bg-status-done text-status-done-foreground'
};

export const TaskCard = ({ task, onUpdate, onDelete }: TaskCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedEffort, setEditedEffort] = useState(task.effort_estimate?.toString() || '');

  const handleSave = () => {
    onUpdate(task.id, {
      title: editedTitle.trim(),
      description: editedDescription.trim() || null,
      effort_estimate: editedEffort ? parseInt(editedEffort) : null
    });
    setIsEditing(false);
  };

  const wasModified = task.ai_generated && (
    task.priority !== task.ai_priority_suggestion ||
    task.effort_estimate !== task.ai_effort_suggestion
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="flex-1"
            />
          ) : (
            <CardTitle className="text-base">{task.title}</CardTitle>
          )}
          <div className="flex gap-1">
            {task.ai_generated && (
              <Badge variant="secondary" className={wasModified ? "bg-user-badge text-user-badge-foreground" : "bg-ai-badge text-ai-badge-foreground"}>
                {wasModified ? (
                  <>
                    <Edit2 className="h-3 w-3 mr-1" />
                    Modified
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>

        {isEditing ? (
          <Textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            placeholder="Description..."
            rows={2}
          />
        ) : (
          task.description && <CardDescription>{task.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select
            value={task.status}
            onValueChange={(value) => onUpdate(task.id, { status: value as Task['status'] })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Priority:</span>
          <Select
            value={task.priority}
            onValueChange={(value) => onUpdate(task.id, { priority: value as Task['priority'] })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {isEditing ? (
            <Input
              type="number"
              value={editedEffort}
              onChange={(e) => setEditedEffort(e.target.value)}
              placeholder="Hours"
              className="w-[140px]"
              min="0"
            />
          ) : (
            <span className="text-sm">
              {task.effort_estimate ? `${task.effort_estimate}h` : 'No estimate'}
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} size="sm" className="flex-1">
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)} size="sm" variant="outline" className="flex-1">
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="flex-1">
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this task? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(task.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
