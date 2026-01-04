'use client';

import { useState } from 'react';
import { Plus, Check, Trash2, ArrowUpRight } from 'lucide-react';
import { Todo } from '@/types';
import { generateId } from '@/lib/utils';

interface TodoListProps {
  todos: Todo[];
  currentProjectId: string;
  onAddTodo: (todo: Todo) => Promise<void> | void;
  onUpdateTodo: (id: string, updates: Partial<Todo>) => Promise<void> | void;
  onDeleteTodo: (id: string) => Promise<void> | void;
  onPromoteToTask: (todo: Todo) => Promise<void> | void;
}

export default function TodoList({
  todos,
  currentProjectId,
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
  onPromoteToTask,
}: TodoListProps) {
  const [newTodo, setNewTodo] = useState('');

  const incompleteTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;

    const todo: Todo = {
      id: generateId(),
      projectId: currentProjectId,
      text: newTodo.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    await onAddTodo(todo);
    setNewTodo('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };

  const toggleTodo = async (id: string, currentCompleted: boolean) => {
    await onUpdateTodo(id, { completed: !currentCompleted });
  };

  const deleteTodo = async (id: string) => {
    await onDeleteTodo(id);
  };

  const handlePromote = async (todo: Todo) => {
    await onPromoteToTask(todo);
  };

  return (
    <div className="space-y-4">
      {/* Add Todo Input */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a quick task..."
          className="flex-1 min-w-0 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent transition-colors"
        />
        <button
          onClick={handleAddTodo}
          disabled={!newTodo.trim()}
          className="flex-shrink-0 p-2 rounded-lg bg-accent text-bg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Incomplete Todos */}
      <div className="space-y-2">
        {incompleteTodos.map((todo) => (
          <div
            key={todo.id}
            className="group flex items-start gap-2 p-2 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <button
              onClick={() => toggleTodo(todo.id, todo.completed)}
              className="mt-0.5 w-4 h-4 rounded border border-border-light hover:border-accent transition-colors flex-shrink-0"
            />
            <span className="flex-1 text-sm text-text break-words">{todo.text}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handlePromote(todo)}
                className="p-1 rounded hover:bg-accent/20 text-text-muted hover:text-accent transition-colors"
                title="Promote to board task"
              >
                <ArrowUpRight size={14} />
              </button>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="p-1 rounded hover:bg-priority-high/20 text-text-muted hover:text-priority-high transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Completed Section */}
      {completedTodos.length > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-text-muted">Completed</span>
            <span className="text-xs bg-surface px-1.5 py-0.5 rounded text-text-muted">
              {completedTodos.length}
            </span>
          </div>
          <div className="space-y-1">
            {completedTodos.map((todo) => (
              <div
                key={todo.id}
                className="group flex items-start gap-2 p-2 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  className="mt-0.5 w-4 h-4 rounded bg-accent/20 border border-accent flex items-center justify-center flex-shrink-0"
                >
                  <Check size={10} className="text-accent" />
                </button>
                <span className="flex-1 text-sm text-text-muted line-through break-words">
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-1 rounded hover:bg-priority-high/20 text-text-muted hover:text-priority-high transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {todos.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm">
          No quick tasks yet
        </div>
      )}
    </div>
  );
}
