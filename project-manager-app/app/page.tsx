'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckSquare, FileText, Loader2, Cloud, CloudOff } from 'lucide-react';
import Sidebar from '@/components/Layout/Sidebar';
import KanbanBoard from '@/components/Board/KanbanBoard';
import TodoList from '@/components/TodoList/TodoList';
import Notes from '@/components/Notes/Notes';
import SearchModal from '@/components/Search/SearchModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTasks, useTodos, useTags, useNotes } from '@/hooks/useDatabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Task, Todo, Tag } from '@/types';

// Default tags for localStorage fallback
const DEFAULT_TAGS: Tag[] = [
  { id: 'bug', name: 'Bug', color: '#ef4444' },
  { id: 'feature', name: 'Feature', color: '#3b82f6' },
  { id: 'urgent', name: 'Urgent', color: '#f97316' },
  { id: 'improvement', name: 'Improvement', color: '#22c55e' },
];

export default function Home() {
  // Supabase hooks
  const {
    tasks: dbTasks,
    isLoading: tasksLoading,
    addTask,
    updateTask,
    deleteTask,
  } = useTasks();

  const {
    todos: dbTodos,
    isLoading: todosLoading,
    addTodo,
    updateTodo,
    deleteTodo,
  } = useTodos();

  const {
    tags: dbTags,
    isLoading: tagsLoading,
    addTag,
  } = useTags();

  const {
    notes: dbNotes,
    isLoading: notesLoading,
    updateNotes,
  } = useNotes();

  // LocalStorage fallback hooks
  const [localTasks, setLocalTasks, localTasksLoaded] = useLocalStorage<Task[]>('project-manager-tasks', []);
  const [localTodos, setLocalTodos, localTodosLoaded] = useLocalStorage<Todo[]>('project-manager-todos', []);
  const [localTags, setLocalTags, localTagsLoaded] = useLocalStorage<Tag[]>('project-manager-tags', DEFAULT_TAGS);
  const [localNotes, setLocalNotes, localNotesLoaded] = useLocalStorage<string>('project-manager-notes', '');

  // UI state
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftWidth, setLeftWidth, leftWidthLoaded] = useLocalStorage<number>('project-manager-left-width', 288);
  const [rightWidth, setRightWidth, rightWidthLoaded] = useLocalStorage<number>('project-manager-right-width', 288);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // Determine which data source to use
  const useCloud = isSupabaseConfigured;
  const tasks = useCloud ? dbTasks : localTasks;
  const todos = useCloud ? dbTodos : localTodos;
  const tags = useCloud ? dbTags : localTags;
  const notes = useCloud ? dbNotes : localNotes;

  const isLoading = useCloud
    ? (tasksLoading || todosLoading || tagsLoading || notesLoading)
    : !(localTasksLoaded && localTodosLoaded && localTagsLoaded && localNotesLoaded && leftWidthLoaded && rightWidthLoaded);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') target.blur();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsNewTaskOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNewTaskOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Task handlers
  const setTasks = useCallback((value: Task[] | ((prev: Task[]) => Task[])) => {
    if (useCloud) {
      // For cloud, we handle individual operations
      // This is called for bulk operations, which we need to handle differently
      const newTasks = typeof value === 'function' ? value(tasks) : value;
      // Sync to local storage as cache
      setLocalTasks(newTasks);
    } else {
      setLocalTasks(value);
    }
  }, [useCloud, tasks, setLocalTasks]);

  const handleAddTask = useCallback(async (task: Task) => {
    if (useCloud) {
      await addTask(task);
    } else {
      setLocalTasks(prev => [...prev, task]);
    }
  }, [useCloud, addTask, setLocalTasks]);

  const handleUpdateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (useCloud) {
      await updateTask(id, updates);
    } else {
      setLocalTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
  }, [useCloud, updateTask, setLocalTasks]);

  const handleDeleteTask = useCallback(async (id: string) => {
    if (useCloud) {
      await deleteTask(id);
    } else {
      setLocalTasks(prev => prev.filter(t => t.id !== id));
    }
  }, [useCloud, deleteTask, setLocalTasks]);

  // Todo handlers
  const setTodos = useCallback((value: Todo[] | ((prev: Todo[]) => Todo[])) => {
    if (!useCloud) {
      setLocalTodos(value);
    }
  }, [useCloud, setLocalTodos]);

  const handleAddTodo = useCallback(async (todo: Todo) => {
    if (useCloud) {
      await addTodo(todo);
    } else {
      setLocalTodos(prev => [...prev, todo]);
    }
  }, [useCloud, addTodo, setLocalTodos]);

  const handleUpdateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    if (useCloud) {
      await updateTodo(id, updates);
    } else {
      setLocalTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
  }, [useCloud, updateTodo, setLocalTodos]);

  const handleDeleteTodo = useCallback(async (id: string) => {
    if (useCloud) {
      await deleteTodo(id);
    } else {
      setLocalTodos(prev => prev.filter(t => t.id !== id));
    }
  }, [useCloud, deleteTodo, setLocalTodos]);

  // Tag handlers
  const setTags = useCallback((value: Tag[] | ((prev: Tag[]) => Tag[])) => {
    if (!useCloud) {
      setLocalTags(value);
    }
  }, [useCloud, setLocalTags]);

  const handleAddTag = useCallback(async (tag: Tag) => {
    if (useCloud) {
      await addTag(tag);
    } else {
      setLocalTags(prev => [...prev, tag]);
    }
  }, [useCloud, addTag, setLocalTags]);

  // Notes handlers
  const setNotes = useCallback((value: string | ((prev: string) => string)) => {
    const newValue = typeof value === 'function' ? value(notes) : value;
    if (useCloud) {
      updateNotes(newValue);
    } else {
      setLocalNotes(newValue);
    }
  }, [useCloud, notes, updateNotes, setLocalNotes]);

  // Promote todo to task
  const handlePromoteToTask = useCallback(async (todo: Todo) => {
    const newTask: Task = {
      id: todo.id,
      title: todo.text,
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      createdAt: todo.createdAt,
      tags: [],
      subtasks: [],
    };

    await handleAddTask(newTask);
    await handleDeleteTodo(todo.id);
  }, [handleAddTask, handleDeleteTodo]);

  const handleSearchSelect = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-bg">
      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
          useCloud ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {useCloud ? <Cloud size={14} /> : <CloudOff size={14} />}
          {useCloud ? 'Cloud Sync' : 'Offline Mode'}
        </div>
      </div>

      {/* Left Sidebar - Quick Tasks */}
      <Sidebar
        title="Quick Tasks"
        icon={<CheckSquare size={18} />}
        isCollapsed={leftCollapsed}
        onToggle={() => setLeftCollapsed(!leftCollapsed)}
        side="left"
        width={leftWidth}
        onWidthChange={setLeftWidth}
      >
        <TodoList
          todos={todos}
          onAddTodo={handleAddTodo}
          onUpdateTodo={handleUpdateTodo}
          onDeleteTodo={handleDeleteTodo}
          onPromoteToTask={handlePromoteToTask}
        />
      </Sidebar>

      {/* Center - Kanban Board */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden min-w-0">
        <KanbanBoard
          tasks={tasks}
          tags={tags}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onAddTag={handleAddTag}
          isNewTaskOpen={isNewTaskOpen}
          setIsNewTaskOpen={setIsNewTaskOpen}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      </main>

      {/* Right Sidebar - Notes */}
      <Sidebar
        title="Notes"
        icon={<FileText size={18} />}
        isCollapsed={rightCollapsed}
        onToggle={() => setRightCollapsed(!rightCollapsed)}
        side="right"
        width={rightWidth}
        onWidthChange={setRightWidth}
      >
        <Notes notes={notes} setNotes={setNotes} />
      </Sidebar>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        tasks={tasks}
        tags={tags}
        onSelectTask={handleSearchSelect}
      />
    </div>
  );
}
