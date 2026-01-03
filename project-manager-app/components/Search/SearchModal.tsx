'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X, Filter, Calendar, Flag } from 'lucide-react';
import { Task, Tag, Priority, Status } from '@/types';
import { formatDueDate, priorityColors } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  tags: Tag[];
  onSelectTask: (task: Task) => void;
}

const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const statusLabels: Record<Status, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  complete: 'Complete',
};

export default function SearchModal({
  isOpen,
  onClose,
  tasks,
  tags,
  onSelectTask,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [filterTag, setFilterTag] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setFilterPriority('all');
      setFilterStatus('all');
      setFilterTag('all');
    }
  }, [isOpen]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Text search
      const searchText = query.toLowerCase();
      const matchesQuery =
        !query ||
        task.title.toLowerCase().includes(searchText) ||
        task.description.toLowerCase().includes(searchText);

      // Priority filter
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

      // Status filter
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;

      // Tag filter
      const matchesTag = filterTag === 'all' || task.tags.includes(filterTag);

      return matchesQuery && matchesPriority && matchesStatus && matchesTag;
    });
  }, [tasks, query, filterPriority, filterStatus, filterTag]);

  const getTagById = (tagId: string) => tags.find((t) => t.id === tagId);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={20} className="text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 bg-transparent text-text placeholder:text-text-muted outline-none text-lg"
            autoFocus
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-accent/20 text-accent' : 'hover:bg-surface-hover text-text-muted'
            }`}
          >
            <Filter size={18} />
          </button>
          <div className="text-xs text-text-muted bg-surface-hover px-2 py-1 rounded">
            ESC
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-border bg-bg/50 flex flex-wrap gap-3">
            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <Flag size={14} className="text-text-muted" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
                className="bg-surface border border-border rounded-lg px-2 py-1 text-sm text-text"
              >
                <option value="all">All Priorities</option>
                {Object.entries(priorityLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-text-muted" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
                className="bg-surface border border-border rounded-lg px-2 py-1 text-sm text-text"
              >
                <option value="all">All Statuses</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            {tags.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="bg-surface border border-border rounded-lg px-2 py-1 text-sm text-text"
                >
                  <option value="all">All Tags</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-text-muted">
              {query || filterPriority !== 'all' || filterStatus !== 'all' || filterTag !== 'all'
                ? 'No tasks match your search'
                : 'Start typing to search tasks'}
            </div>
          ) : (
            <div className="py-2">
              {filteredTasks.map((task) => {
                const dueInfo = formatDueDate(task.dueDate);
                return (
                  <button
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-surface-hover transition-colors text-left"
                  >
                    {/* Priority indicator */}
                    <div
                      className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: priorityColors[task.priority] }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text truncate">{task.title}</span>
                        <span className="text-xs text-text-muted bg-surface px-1.5 py-0.5 rounded">
                          {statusLabels[task.status]}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-sm text-text-muted mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {/* Tags */}
                        {task.tags.map((tagId) => {
                          const tag = getTagById(tagId);
                          if (!tag) return null;
                          return (
                            <span
                              key={tagId}
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                              }}
                            >
                              {tag.name}
                            </span>
                          );
                        })}

                        {/* Due date */}
                        {dueInfo && (
                          <span className={`flex items-center gap-1 text-xs ${dueInfo.isOverdue ? 'text-priority-high' : 'text-text-muted'}`}>
                            <Calendar size={12} />
                            {dueInfo.display}
                          </span>
                        )}

                        {/* Subtasks */}
                        {task.subtasks.length > 0 && (
                          <span className="text-xs text-text-muted">
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-bg/50 flex items-center justify-between text-xs text-text-muted">
          <span>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-surface rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-surface rounded">K</kbd> to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
