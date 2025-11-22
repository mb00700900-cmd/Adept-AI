/**
 * TypeScript types for API responses
 */

export interface User {
  id: string;
  email: string;
  username?: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type CreatedBy = 'ai' | 'user';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  effort_estimate: number | null;
  ai_generated: boolean;
  ai_priority_suggestion: TaskPriority | null;
  ai_effort_suggestion: number | null;
  created_by: CreatedBy;
  created_at: string;
  updated_at: string;
}

export type ProjectRole = 'Owner' | 'Editor' | 'Viewer';

export interface ProjectMember {
  id: string;
  user_id: string;
  email: string | null;
  username: string | null;
  role: ProjectRole;
  joined_at: string;
}

export interface ProjectInvitation {
  id: string;
  invited_email: string;
  role: ProjectRole;
  created_at: string;
  expires_at: string;
  invitation_token: string;
}

export interface AITaskSuggestion {
  title: string;
  description: string;
  priority: TaskPriority;
  priority_reasoning: string;
  effort_estimate: number;
  effort_confidence: string;
  effort_reasoning: string;
}

export interface KPIMetrics {
  total_projects: number;
  projects_trend: number;
  total_tasks: number;
  completion_rate: number;
  avg_project_duration: number;
  ai_accuracy: number;
}

