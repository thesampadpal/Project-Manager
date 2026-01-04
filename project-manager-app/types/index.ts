export type Priority = 'low' | 'medium' | 'high';
export type Status = 'todo' | 'in-progress' | 'complete';

export interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Tag {
  id: string;
  projectId: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
  tags: string[]; // Tag IDs
  subtasks: Subtask[];
}

export interface Todo {
  id: string;
  projectId: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface ColumnConfig {
  id: Status;
  title: string;
  color: string;
  dotColor: string;
}

// Predefined colors for tags and projects
export const TAG_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
] as const;
