'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Flag, Calendar, Tag as TagIcon, Plus, Check, ListTodo } from 'lucide-react';
import { Task, Priority, Status, Tag, Subtask, TAG_COLORS } from '@/types';
import { priorityColors, generateId } from '@/lib/utils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  tags: Tag[];
  onAddTag: (tag: Tag) => Promise<void> | void;
  onSave: (taskData: Partial<Task>) => void;
  onDelete?: () => void;
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

export default function TaskModal({
  isOpen,
  onClose,
  task,
  tags,
  onAddTag,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('todo');
  const [dueDate, setDueDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<string>(TAG_COLORS[0].value);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setSelectedTags(task.tags || []);
      setSubtasks(task.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDueDate('');
      setSelectedTags([]);
      setSubtasks([]);
    }
    setNewSubtask('');
    setShowNewTag(false);
    setNewTagName('');
    setNewTagColor(TAG_COLORS[0].value);
  }, [task, isOpen]);

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      dueDate: dueDate || null,
      tags: selectedTags,
      subtasks,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    const newTag: Tag = {
      id: generateId(),
      name: newTagName.trim(),
      color: newTagColor,
    };

    await onAddTag(newTag);
    setSelectedTags((prev) => [...prev, newTag.id]);
    setNewTagName('');
    setShowNewTag(false);
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;

    const subtask: Subtask = {
      id: generateId(),
      text: newSubtask.trim(),
      completed: false,
    };

    setSubtasks((prev) => [...prev, subtask]);
    setNewSubtask('');
  };

  const toggleSubtask = (subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s))
    );
  };

  const deleteSubtask = (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-surface border border-border rounded-xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-medium text-text">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text placeholder:text-text-muted focus:border-accent transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={2}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text placeholder:text-text-muted focus:border-accent transition-colors resize-none"
            />
          </div>

          {/* Priority & Due Date Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5 flex items-center gap-1.5">
                <Flag size={14} />
                Priority
              </label>
              <div className="flex gap-1">
                {(Object.keys(priorityLabels) as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`
                      flex-1 py-1.5 px-2 rounded-lg text-xs font-medium
                      transition-all duration-200
                      ${priority === p
                        ? 'text-text'
                        : 'bg-bg text-text-secondary hover:bg-surface-hover'
                      }
                    `}
                    style={{
                      backgroundColor: priority === p ? `${priorityColors[p]}20` : undefined,
                      boxShadow: priority === p ? `0 0 0 2px ${priorityColors[p]}` : undefined,
                    }}
                  >
                    {priorityLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-text-secondary mb-1.5 flex items-center gap-1.5">
              <TagIcon size={14} />
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`
                    px-2 py-1 rounded-lg text-xs font-medium
                    transition-all duration-200 flex items-center gap-1
                  `}
                  style={{
                    backgroundColor: selectedTags.includes(tag.id) ? `${tag.color}30` : 'transparent',
                    color: selectedTags.includes(tag.id) ? tag.color : undefined,
                    border: `1px solid ${selectedTags.includes(tag.id) ? tag.color : 'var(--border)'}`,
                  }}
                >
                  {selectedTags.includes(tag.id) && <Check size={10} />}
                  {tag.name}
                </button>
              ))}
              <button
                onClick={() => setShowNewTag(!showNewTag)}
                className="px-2 py-1 rounded-lg text-xs text-text-muted hover:text-accent hover:bg-surface-hover border border-dashed border-border transition-colors"
              >
                <Plus size={12} className="inline mr-1" />
                New
              </button>
            </div>

            {/* New Tag Form */}
            {showNewTag && (
              <div className="mt-2 p-2 bg-bg rounded-lg border border-border">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Tag name..."
                    className="flex-1 bg-surface border border-border rounded px-2 py-1 text-sm text-text placeholder:text-text-muted"
                    onKeyDown={(e) => e.key === 'Enter' && createTag()}
                  />
                  <button
                    onClick={createTag}
                    disabled={!newTagName.trim()}
                    className="px-2 py-1 rounded bg-accent text-bg text-xs font-medium disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewTagColor(color.value)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        newTagColor === color.value ? 'scale-110 ring-2 ring-white/50' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm text-text-secondary mb-1.5 flex items-center gap-1.5">
              <ListTodo size={14} />
              Subtasks
              {subtasks.length > 0 && (
                <span className="text-xs text-text-muted">
                  ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
                </span>
              )}
            </label>

            {/* Subtask List */}
            {subtasks.length > 0 && (
              <div className="space-y-1 mb-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-surface-hover group"
                  >
                    <button
                      onClick={() => toggleSubtask(subtask.id)}
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                        subtask.completed
                          ? 'bg-accent/20 border-accent'
                          : 'border-border-light hover:border-accent'
                      }`}
                    >
                      {subtask.completed && <Check size={10} className="text-accent" />}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        subtask.completed ? 'text-text-muted line-through' : 'text-text'
                      }`}
                    >
                      {subtask.text}
                    </span>
                    <button
                      onClick={() => deleteSubtask(subtask.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-priority-high/20 text-text-muted hover:text-priority-high transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Subtask */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a subtask..."
                className="flex-1 bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-accent transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
              />
              <button
                onClick={addSubtask}
                disabled={!newSubtask.trim()}
                className="p-1.5 rounded-lg bg-surface border border-border hover:border-accent text-text-muted hover:text-accent transition-colors disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Status (only show when editing) */}
          {task && (
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Status
              </label>
              <div className="flex gap-2">
                {(Object.keys(statusLabels) as Status[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`
                      flex-1 py-2 px-3 rounded-lg text-sm font-medium
                      transition-colors
                      ${status === s
                        ? 'bg-accent text-bg'
                        : 'bg-bg text-text-secondary hover:bg-surface-hover'
                      }
                    `}
                  >
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border flex-shrink-0">
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-priority-high hover:bg-priority-high/10 transition-colors text-sm"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-4 py-2 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
