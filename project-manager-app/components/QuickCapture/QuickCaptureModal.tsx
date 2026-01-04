'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ListTodo, LayoutGrid, ChevronDown } from 'lucide-react';
import { Project, Task, Todo } from '@/types';
import { generateId } from '@/lib/utils';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentProjectId: string | null;
  onAddTodo: (todo: Todo) => void;
  onAddTask: (task: Task) => void;
}

export default function QuickCaptureModal({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onAddTodo,
  onAddTask,
}: QuickCaptureModalProps) {
  const [text, setText] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set default project when modal opens
  useEffect(() => {
    if (isOpen) {
      setText('');
      setSelectedProjectId(currentProjectId || (projects.length > 0 ? projects[0].id : null));
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, currentProjectId, projects]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleAddAsTodo = () => {
    if (!text.trim() || !selectedProjectId) return;

    const todo: Todo = {
      id: generateId(),
      projectId: selectedProjectId,
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    onAddTodo(todo);
    onClose();
  };

  const handleAddAsTask = () => {
    if (!text.trim() || !selectedProjectId) return;

    const task: Task = {
      id: generateId(),
      projectId: selectedProjectId,
      title: text.trim(),
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      createdAt: new Date().toISOString(),
      tags: [],
      subtasks: [],
    };

    onAddTask(task);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleAddAsTodo();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddAsTask();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">Quick Capture</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg text-text-secondary hover:text-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Project Selector */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Project
            </label>
            <button
              type="button"
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-left flex items-center justify-between hover:border-accent/50 transition-colors"
            >
              {selectedProject ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedProject.color }}
                  />
                  <span className="text-text">{selectedProject.name}</span>
                </div>
              ) : (
                <span className="text-text-secondary">Select a project...</span>
              )}
              <ChevronDown size={16} className="text-text-secondary" />
            </button>

            {showProjectDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl z-10 max-h-48 overflow-auto">
                {projects.length === 0 ? (
                  <div className="px-3 py-2 text-text-secondary text-sm">
                    No projects yet. Create one first!
                  </div>
                ) : (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setShowProjectDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-bg transition-colors ${
                        selectedProjectId === project.id ? 'bg-bg' : ''
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-text">{project.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              What&apos;s on your mind?
            </label>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Capture your idea..."
              className="w-full px-3 py-3 bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent text-lg"
              disabled={projects.length === 0}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddAsTodo}
              disabled={!text.trim() || !selectedProjectId}
              className="flex-1 px-4 py-3 rounded-lg bg-surface border border-border text-text font-medium hover:bg-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <ListTodo size={18} />
              <span>Add as Todo</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-xs bg-bg rounded text-text-secondary">
                Enter
              </kbd>
            </button>
            <button
              onClick={handleAddAsTask}
              disabled={!text.trim() || !selectedProjectId}
              className="flex-1 px-4 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <LayoutGrid size={18} />
              <span>Add as Task</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded">
                Ctrl+Enter
              </kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
