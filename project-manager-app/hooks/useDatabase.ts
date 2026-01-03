'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Task, Todo, Tag, Subtask } from '@/types';

// Database row types (snake_case from Supabase)
interface TaskRow {
  id: string;
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
  text: string;
  completed: boolean;
  created_at: string;
}

interface TagRow {
  id: string;
  name: string;
  color: string;
}

interface NotesRow {
  id: number;
  content: string;
  updated_at: string;
}

// Convert database row to app type
function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
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
    text: row.text,
    completed: row.completed,
    createdAt: row.created_at,
  };
}

function todoToRow(todo: Partial<Todo>): Partial<TodoRow> {
  const row: Partial<TodoRow> = {};
  if (todo.id !== undefined) row.id = todo.id;
  if (todo.text !== undefined) row.text = todo.text;
  if (todo.completed !== undefined) row.completed = todo.completed;
  if (todo.createdAt !== undefined) row.created_at = todo.createdAt;
  return row;
}

// ============ TASKS HOOK ============
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    const db = supabase;
    if (!isSupabaseConfigured || !db) {
      setIsLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        const { data, error } = await db
          .from('tasks')
          .select('*')
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

    // Real-time subscription
    const channel = db
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [...prev, rowToTask(payload.new as TaskRow)]);
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

  const addTask = useCallback(async (task: Task) => {
    const db = supabase;
    if (!db) return;
    const { error } = await db.from('tasks').insert(taskToRow(task));
    if (error) console.error('Error adding task:', error);
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const db = supabase;
    if (!db) return;
    const { error } = await db
      .from('tasks')
      .update(taskToRow(updates))
      .eq('id', id);
    if (error) console.error('Error updating task:', error);
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const db = supabase;
    if (!db) return;
    const { error } = await db.from('tasks').delete().eq('id', id);
    if (error) console.error('Error deleting task:', error);
  }, []);

  return { tasks, setTasks, isLoading, error, addTask, updateTask, deleteTask };
}

// ============ TODOS HOOK ============
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!isSupabaseConfigured || !db) {
      setIsLoading(false);
      return;
    }

    const fetchTodos = async () => {
      try {
        const { data, error } = await db
          .from('todos')
          .select('*')
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
      .channel('todos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTodos((prev) => [...prev, rowToTodo(payload.new as TodoRow)]);
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
  }, []);

  const addTodo = useCallback(async (todo: Todo) => {
    const db = supabase;
    if (!db) return;
    const { error } = await db.from('todos').insert(todoToRow(todo));
    if (error) console.error('Error adding todo:', error);
  }, []);

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    const db = supabase;
    if (!db) return;
    const { error } = await db
      .from('todos')
      .update(todoToRow(updates))
      .eq('id', id);
    if (error) console.error('Error updating todo:', error);
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    const db = supabase;
    if (!db) return;
    const { error } = await db.from('todos').delete().eq('id', id);
    if (error) console.error('Error deleting todo:', error);
  }, []);

  return { todos, setTodos, isLoading, error, addTodo, updateTodo, deleteTodo };
}

// ============ TAGS HOOK ============
export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!isSupabaseConfigured || !db) {
      setIsLoading(false);
      return;
    }

    const fetchTags = async () => {
      try {
        const { data, error } = await db
          .from('tags')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setTags(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tags');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();

    const channel = db
      .channel('tags-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tags' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTags((prev) => [...prev, payload.new as Tag]);
          } else if (payload.eventType === 'UPDATE') {
            setTags((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Tag).id ? (payload.new as Tag) : t
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
  }, []);

  const addTag = useCallback(async (tag: Tag) => {
    const db = supabase;
    if (!db) return;
    const { error } = await db.from('tags').insert(tag);
    if (error) console.error('Error adding tag:', error);
  }, []);

  const deleteTag = useCallback(async (id: string) => {
    const db = supabase;
    if (!db) return;
    const { error } = await db.from('tags').delete().eq('id', id);
    if (error) console.error('Error deleting tag:', error);
  }, []);

  return { tags, setTags, isLoading, error, addTag, deleteTag };
}

// ============ NOTES HOOK ============
export function useNotes() {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!isSupabaseConfigured || !db) {
      setIsLoading(false);
      return;
    }

    const fetchNotes = async () => {
      try {
        const { data, error } = await db
          .from('notes')
          .select('*')
          .eq('id', 1)
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
      .channel('notes-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notes' },
        (payload) => {
          setNotes((payload.new as NotesRow).content);
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, []);

  const updateNotes = useCallback(async (content: string) => {
    const db = supabase;
    if (!db) return;
    const { error } = await db
      .from('notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) console.error('Error updating notes:', error);
  }, []);

  return { notes, setNotes, isLoading, error, updateNotes };
}
