'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Task, Todo, Tag, Subtask, Project } from '@/types';

// Database row types (snake_case from Supabase)
interface ProjectRow {
  id: string;
  name: string;
  color: string;
  description: string;
  created_at: string;
}

interface TaskRow {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  tags: string[];
  subtasks: Subtask[];
  created_at: string;
}

interface TodoRow {
  id: string;
  project_id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

interface TagRow {
  id: string;
  project_id: string;
  name: string;
  color: string;
}

interface NotesRow {
  id: string;
  project_id: string;
  content: string;
  updated_at: string;
}

// ============ CONVERTERS ============

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    description: row.description,
    createdAt: row.created_at,
  };
}

function projectToRow(project: Partial<Project>): Partial<ProjectRow> {
  const row: Partial<ProjectRow> = {};
  if (project.id !== undefined) row.id = project.id;
  if (project.name !== undefined) row.name = project.name;
  if (project.color !== undefined) row.color = project.color;
  if (project.description !== undefined) row.description = project.description;
  if (project.createdAt !== undefined) row.created_at = project.createdAt;
  return row;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    dueDate: row.due_date,
    tags: row.tags || [],
    subtasks: row.subtasks || [],
    createdAt: row.created_at,
  };
}

function taskToRow(task: Partial<Task>): Partial<TaskRow> {
  const row: Partial<TaskRow> = {};
  if (task.id !== undefined) row.id = task.id;
  if (task.projectId !== undefined) row.project_id = task.projectId;
  if (task.title !== undefined) row.title = task.title;
  if (task.description !== undefined) row.description = task.description;
  if (task.status !== undefined) row.status = task.status;
  if (task.priority !== undefined) row.priority = task.priority;
  if (task.dueDate !== undefined) row.due_date = task.dueDate;
  if (task.tags !== undefined) row.tags = task.tags;
  if (task.subtasks !== undefined) row.subtasks = task.subtasks;
  if (task.createdAt !== undefined) row.created_at = task.createdAt;
  return row;
}

function rowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    projectId: row.project_id,
    text: row.text,
    completed: row.completed,
    createdAt: row.created_at,
  };
}

function todoToRow(todo: Partial<Todo>): Partial<TodoRow> {
  const row: Partial<TodoRow> = {};
  if (todo.id !== undefined) row.id = todo.id;
  if (todo.projectId !== undefined) row.project_id = todo.projectId;
  if (todo.text !== undefined) row.text = todo.text;
  if (todo.completed !== undefined) row.completed = todo.completed;
  if (todo.createdAt !== undefined) row.created_at = todo.createdAt;
  return row;
}

function rowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    color: row.color,
  };
}

function tagToRow(tag: Partial<Tag>): Partial<TagRow> {
  const row: Partial<TagRow> = {};
  if (tag.id !== undefined) row.id = tag.id;
  if (tag.projectId !== undefined) row.project_id = tag.projectId;
  if (tag.name !== undefined) row.name = tag.name;
  if (tag.color !== undefined) row.color = tag.color;
  return row;
}

// ============ PROJECTS HOOK ============
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!isSupabaseConfigured || !db) {
      setIsLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        const { data, error } = await db
          .from('projects')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setProjects((data || []).map(rowToProject));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();

    const channel = db
      .channel('projects-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newProject = rowToProject(payload.new as ProjectRow);
            setProjects((prev) =>
              prev.some((p) => p.id === newProject.id) ? prev : [...prev, newProject]
            );
          } else if (payload.eventType === 'UPDATE') {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === (payload.new as ProjectRow).id
                  ? rowToProject(payload.new as ProjectRow)
                  : p
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setProjects((prev) =>
              prev.filter((p) => p.id !== (payload.old as ProjectRow).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, []);

  const addProject = useCallback(async (project: Project) => {
    const db = supabase;
    if (!db) return;
    setProjects((prev) => [...prev, project]);
    const { error } = await db.from('projects').insert(projectToRow(project));
    if (error) {
      console.error('Error adding project:', error);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    }
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const db = supabase;
    if (!db) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    const { error } = await db
      .from('projects')
      .update(projectToRow(updates))
      .eq('id', id);
    if (error) console.error('Error updating project:', error);
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    const db = supabase;
    if (!db) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    const { error } = await db.from('projects').delete().eq('id', id);
    if (error) console.error('Error deleting project:', error);
  }, []);

  return { projects, setProjects, isLoading, error, addProject, updateProject, deleteProject };
}

// ============ TASKS HOOK ============
export function useTasks(projectId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!isSupabaseConfigured || !db || !projectId) {
      setIsLoading(false);
      setTasks([]);
      return;
    }

    const fetchTasks = async () => {
      try {
        const { data, error } = await db
          .from('tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTasks((data || []).map(rowToTask));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();

    const channel = db
      .channel(`tasks-changes-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = rowToTask(payload.new as TaskRow);
            setTasks((prev) =>
              prev.some((t) => t.id === newTask.id) ? prev : [...prev, newTask]
            );
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === (payload.new as TaskRow).id
                  ? rowToTask(payload.new as TaskRow)
                  : t
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) =>
              prev.filter((t) => t.id !== (payload.old as TaskRow).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [projectId]);

  const addTask = useCallback(async (task: Task) => {
    const db = supabase;
    if (!db) return;
    setTasks((prev) => [...prev, task]);
    const { error } = await db.from('tasks').insert(taskToRow(task));
    if (error) {
      console.error('Error adding task:', error);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const db = supabase;
    if (!db) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    const { error } = await db
      .from('tasks')
      .update(taskToRow(updates))
      .eq('id', id);
    if (error) console.error('Error updating task:', error);
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const db = supabase;
    if (!db) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error } = await db.from('tasks').delete().eq('id', id);
    if (error) console.error('Error deleting task:', error);
  }, []);

  return { tasks, setTasks, isLoading, error, addTask, updateTask, deleteTask };
}

// ============ ALL TASKS HOOK (for dashboard stats) ============
export function useAllTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const db = supabase;
    if (!isSupabaseConfigured || !db) {
      setIsLoading(false);
      return;
    }

    const fetchAllTasks = async () => {
      try {
        const { data, error } = await db
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTasks((data || []).map(rowToTask));
      } catch (err) {
        console.error('Failed to fetch all tasks:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTasks();

    const channel = db
      .channel('all-tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = rowToTask(payload.new as TaskRow);
            setTasks((prev) =>
              prev.some((t) => t.id === newTask.id) ? prev : [...prev, newTask]
            );
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === (payload.new as TaskRow).id
                  ? rowToTask(payload.new as TaskRow)
                  : t
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) =>
              prev.filter((t) => t.id !== (payload.old as TaskRow).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, []);

  return { tasks, isLoading };
}

// ============ TODOS HOOK ============
export function useTodos(projectId: string | null) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!isSupabaseConfigured || !db || !projectId) {
      setIsLoading(false);
      setTodos([]);
      return;
    }

    const fetchTodos = async () => {
      try {
        const { data, error } = await db
          .from('todos')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTodos((data || []).map(rowToTodo));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch todos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodos();

    const channel = db
      .channel(`todos-changes-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTodo = rowToTodo(payload.new as TodoRow);
            setTodos((prev) =>
              prev.some((t) => t.id === newTodo.id) ? prev : [...prev, newTodo]
            );
          } else if (payload.eventType === 'UPDATE') {
            setTodos((prev) =>
              prev.map((t) =>
                t.id === (payload.new as TodoRow).id
                  ? rowToTodo(payload.new as TodoRow)
                  : t
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTodos((prev) =>
              prev.filter((t) => t.id !== (payload.old as TodoRow).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [projectId]);

  const addTodo = useCallback(async (todo: Todo) => {
    const db = supabase;
    if (!db) return;
    setTodos((prev) => [...prev, todo]);
    const { error } = await db.from('todos').insert(todoToRow(todo));
    if (error) {
      console.error('Error adding todo:', error);
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    }
  }, []);

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    const db = supabase;
    if (!db) return;
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    const { error } = await db
      .from('todos')
      .update(todoToRow(updates))
      .eq('id', id);
    if (error) console.error('Error updating todo:', error);
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    const db = supabase;
    if (!db) return;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    const { error } = await db.from('todos').delete().eq('id', id);
    if (error) console.error('Error deleting todo:', error);
  }, []);

  return { todos, setTodos, isLoading, error, addTodo, updateTodo, deleteTodo };
}

// ============ TAGS HOOK ============
export function useTags(projectId: string | null) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!isSupabaseConfigured || !db || !projectId) {
      setIsLoading(false);
      setTags([]);
      return;
    }

    const fetchTags = async () => {
      try {
        const { data, error } = await db
          .from('tags')
          .select('*')
          .eq('project_id', projectId)
          .order('name', { ascending: true });

        if (error) throw error;
        setTags((data || []).map(rowToTag));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tags');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();

    const channel = db
      .channel(`tags-changes-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tags', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTag = rowToTag(payload.new as TagRow);
            setTags((prev) =>
              prev.some((t) => t.id === newTag.id) ? prev : [...prev, newTag]
            );
          } else if (payload.eventType === 'UPDATE') {
            setTags((prev) =>
              prev.map((t) =>
                t.id === (payload.new as TagRow).id
                  ? rowToTag(payload.new as TagRow)
                  : t
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTags((prev) =>
              prev.filter((t) => t.id !== (payload.old as TagRow).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [projectId]);

  const addTag = useCallback(async (tag: Tag) => {
    const db = supabase;
    if (!db) return;
    setTags((prev) => [...prev, tag]);
    const { error } = await db.from('tags').insert(tagToRow(tag));
    if (error) {
      console.error('Error adding tag:', error);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
    }
  }, []);

  const deleteTag = useCallback(async (id: string) => {
    const db = supabase;
    if (!db) return;
    setTags((prev) => prev.filter((t) => t.id !== id));
    const { error } = await db.from('tags').delete().eq('id', id);
    if (error) console.error('Error deleting tag:', error);
  }, []);

  return { tags, setTags, isLoading, error, addTag, deleteTag };
}

// ============ NOTES HOOK ============
export function useNotes(projectId: string | null) {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!isSupabaseConfigured || !db || !projectId) {
      setIsLoading(false);
      setNotes('');
      return;
    }

    const fetchNotes = async () => {
      try {
        const { data, error } = await db
          .from('notes')
          .select('*')
          .eq('project_id', projectId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        setNotes(data?.content || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();

    const channel = db
      .channel(`notes-changes-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setNotes((payload.new as NotesRow).content);
          }
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [projectId]);

  const updateNotes = useCallback(async (content: string) => {
    const db = supabase;
    if (!db || !projectId) return;

    // Upsert - insert or update
    const { error } = await db
      .from('notes')
      .upsert({
        id: `notes-${projectId}`,
        project_id: projectId,
        content,
        updated_at: new Date().toISOString()
      });
    if (error) console.error('Error updating notes:', error);
  }, [projectId]);

  return { notes, setNotes, isLoading, error, updateNotes };
}
