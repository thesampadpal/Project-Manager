'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckSquare, FileText, Loader2, Cloud, CloudOff, ArrowLeft } from 'lucide-react';
import Sidebar from '@/components/Layout/Sidebar';
import KanbanBoard from '@/components/Board/KanbanBoard';
import TodoList from '@/components/TodoList/TodoList';
import Notes from '@/components/Notes/Notes';
import SearchModal from '@/components/Search/SearchModal';
import ProjectDashboard from '@/components/Dashboard/ProjectDashboard';
import QuickCaptureButton from '@/components/QuickCapture/QuickCaptureButton';
import QuickCaptureModal from '@/components/QuickCapture/QuickCaptureModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useProjects, useTasks, useTodos, useTags, useNotes, useAllTasks } from '@/hooks/useDatabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Task, Todo, Tag, Project } from '@/types';

type AppView = 'dashboard' | 'board';

export default function Home() {
  // Navigation state
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [currentProjectId, setCurrentProjectId, projectIdLoaded] = useLocalStorage<string | null>('project-manager-current-project', null);

  // Projects hook (always active)
  const {
    projects: dbProjects,
    isLoading: projectsLoading,
    addProject,
    updateProject,
    deleteProject,
  } = useProjects();

  // All tasks for dashboard stats
  const { tasks: allDbTasks, isLoading: allTasksLoading } = useAllTasks();

  // Project-scoped hooks (only used when viewing a project)
  const {
    tasks: dbTasks,
    isLoading: tasksLoading,
    addTask,
    updateTask,
    deleteTask,
  } = useTasks(currentProjectId);

  const {
    todos: dbTodos,
    isLoading: todosLoading,
    addTodo,
    updateTodo,
    deleteTodo,
  } = useTodos(currentProjectId);

  const {
    tags: dbTags,
    isLoading: tagsLoading,
    addTag,
  } = useTags(currentProjectId);

  const {
    notes: dbNotes,
    isLoading: notesLoading,
    updateNotes,
  } = useNotes(currentProjectId);

  // LocalStorage fallback for projects
  const [localProjects, setLocalProjects, localProjectsLoaded] = useLocalStorage<Project[]>('project-manager-projects', []);
  const [localTasks, setLocalTasks, localTasksLoaded] = useLocalStorage<Task[]>('project-manager-tasks', []);
  const [localTodos, setLocalTodos, localTodosLoaded] = useLocalStorage<Todo[]>('project-manager-todos', []);
  const [localTags, setLocalTags, localTagsLoaded] = useLocalStorage<Tag[]>('project-manager-tags', []);
  const [localNotes, setLocalNotes, localNotesLoaded] = useLocalStorage<Record<string, string>>('project-manager-notes', {});

  // UI state
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftWidth, setLeftWidth, leftWidthLoaded] = useLocalStorage<number>('project-manager-left-width', 288);
  const [rightWidth, setRightWidth, rightWidthLoaded] = useLocalStorage<number>('project-manager-right-width', 288);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  // Determine which data source to use
  const useCloud = isSupabaseConfigured;
  const projects = useCloud ? dbProjects : localProjects;
  const allTasks = useCloud ? allDbTasks : localTasks;
  const tasks = useCloud ? dbTasks : localTasks.filter(t => t.projectId === currentProjectId);
  const todos = useCloud ? dbTodos : localTodos.filter(t => t.projectId === currentProjectId);
  const tags = useCloud ? dbTags : localTags.filter(t => t.projectId === currentProjectId);
  const notes = useCloud ? dbNotes : (currentProjectId ? localNotes[currentProjectId] || '' : '');

  const currentProject = projects.find(p => p.id === currentProjectId);

  const isLoading = useCloud
    ? (projectsLoading || allTasksLoading)
    : !(localProjectsLoaded && localTasksLoaded && projectIdLoaded);

  const isBoardLoading = useCloud
    ? (tasksLoading || todosLoading || tagsLoading || notesLoading)
    : !(localTodosLoaded && localTagsLoaded && localNotesLoaded && leftWidthLoaded && rightWidthLoaded);

  // Navigate to project
  const navigateToProject = useCallback((projectId: string) => {
    setCurrentProjectId(projectId);
    setCurrentView('board');
  }, [setCurrentProjectId]);

  // Navigate back to dashboard
  const navigateToDashboard = useCallback(() => {
    setCurrentView('dashboard');
  }, []);

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
        if (currentView === 'board') setIsSearchOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (e.shiftKey) {
          setIsQuickCaptureOpen(true);
        } else if (currentView === 'board') {
          setIsNewTaskOpen(true);
        }
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNewTaskOpen(false);
        setIsQuickCaptureOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView]);

  // Project handlers
  const handleAddProject = useCallback(async (project: Project) => {
    if (useCloud) {
      await addProject(project);
    } else {
      setLocalProjects(prev => [...prev, project]);
    }
  }, [useCloud, addProject, setLocalProjects]);

  const handleUpdateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    if (useCloud) {
      await updateProject(id, updates);
    } else {
      setLocalProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  }, [useCloud, updateProject, setLocalProjects]);

  const handleDeleteProject = useCallback(async (id: string) => {
    if (useCloud) {
      await deleteProject(id);
    } else {
      setLocalProjects(prev => prev.filter(p => p.id !== id));
      setLocalTasks(prev => prev.filter(t => t.projectId !== id));
      setLocalTodos(prev => prev.filter(t => t.projectId !== id));
      setLocalTags(prev => prev.filter(t => t.projectId !== id));
    }
    if (currentProjectId === id) {
      setCurrentProjectId(null);
      setCurrentView('dashboard');
    }
  }, [useCloud, deleteProject, setLocalProjects, setLocalTasks, setLocalTodos, setLocalTags, currentProjectId, setCurrentProjectId]);

  // Task handlers
  const handleAddTask = useCallback(async (task: Task) => {
    const taskWithProject = { ...task, projectId: currentProjectId! };
    if (useCloud) {
      await addTask(taskWithProject);
    } else {
      setLocalTasks(prev => [...prev, taskWithProject]);
    }
  }, [useCloud, addTask, setLocalTasks, currentProjectId]);

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
  const handleAddTodo = useCallback(async (todo: Todo) => {
    const todoWithProject = { ...todo, projectId: currentProjectId! };
    if (useCloud) {
      await addTodo(todoWithProject);
    } else {
      setLocalTodos(prev => [...prev, todoWithProject]);
    }
  }, [useCloud, addTodo, setLocalTodos, currentProjectId]);

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
  const handleAddTag = useCallback(async (tag: Tag) => {
    const tagWithProject = { ...tag, projectId: currentProjectId! };
    if (useCloud) {
      await addTag(tagWithProject);
    } else {
      setLocalTags(prev => [...prev, tagWithProject]);
    }
  }, [useCloud, addTag, setLocalTags, currentProjectId]);

  // Notes handlers
  const setNotes = useCallback((value: string | ((prev: string) => string)) => {
    const newValue = typeof value === 'function' ? value(notes) : value;
    if (useCloud) {
      updateNotes(newValue);
    } else {
      setLocalNotes(prev => ({ ...prev, [currentProjectId!]: newValue }));
    }
  }, [useCloud, notes, updateNotes, setLocalNotes, currentProjectId]);

  // Promote todo to task
  const handlePromoteToTask = useCallback(async (todo: Todo) => {
    const newTask: Task = {
      id: todo.id,
      projectId: currentProjectId!,
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
  }, [handleAddTask, handleDeleteTodo, currentProjectId]);

  const handleSearchSelect = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  // Quick capture handlers (items already have projectId)
  const handleQuickCaptureTodo = useCallback(async (todo: Todo) => {
    if (useCloud) {
      await addTodo(todo);
    } else {
      setLocalTodos(prev => [...prev, todo]);
    }
  }, [useCloud, addTodo, setLocalTodos]);

  const handleQuickCaptureTask = useCallback(async (task: Task) => {
    if (useCloud) {
      await addTask(task);
    } else {
      setLocalTasks(prev => [...prev, task]);
    }
  }, [useCloud, addTask, setLocalTasks]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-bg">
      {/* Quick Capture Button */}
      <QuickCaptureButton onClick={() => setIsQuickCaptureOpen(true)} />

      {/* Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        projects={projects}
        currentProjectId={currentProjectId}
        onAddTodo={handleQuickCaptureTodo}
        onAddTask={handleQuickCaptureTask}
      />

      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
          useCloud ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {useCloud ? <Cloud size={14} /> : <CloudOff size={14} />}
          {useCloud ? 'Cloud Sync' : 'Offline Mode'}
        </div>
      </div>

      {currentView === 'dashboard' ? (
        /* Dashboard View */
        <ProjectDashboard
          projects={projects}
          allTasks={allTasks}
          onSelectProject={navigateToProject}
          onAddProject={handleAddProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
        />
      ) : (
        /* Board View */
        <>
          {isBoardLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : (
            <>
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
                  currentProjectId={currentProjectId!}
                  onAddTodo={handleAddTodo}
                  onUpdateTodo={handleUpdateTodo}
                  onDeleteTodo={handleDeleteTodo}
                  onPromoteToTask={handlePromoteToTask}
                />
              </Sidebar>

              {/* Center - Kanban Board */}
              <main className="flex-1 overflow-x-auto overflow-y-hidden min-w-0 flex flex-col">
                {/* Project Header */}
                <div className="flex-shrink-0 px-6 py-4 border-b border-border flex items-center gap-4">
                  <button
                    onClick={navigateToDashboard}
                    className="p-2 rounded-lg hover:bg-surface text-text-secondary hover:text-text transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentProject?.color }}
                    />
                    <h1 className="text-lg font-semibold text-text">
                      {currentProject?.name || 'Project'}
                    </h1>
                  </div>
                </div>

                {/* Board */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                  <KanbanBoard
                    tasks={tasks}
                    tags={tags}
                    currentProjectId={currentProjectId!}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onAddTag={handleAddTag}
                    isNewTaskOpen={isNewTaskOpen}
                    setIsNewTaskOpen={setIsNewTaskOpen}
                    onOpenSearch={() => setIsSearchOpen(true)}
                  />
                </div>
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
            </>
          )}

          {/* Search Modal */}
          <SearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            tasks={tasks}
            tags={tags}
            onSelectTask={handleSearchSelect}
          />
        </>
      )}
    </div>
  );
}
