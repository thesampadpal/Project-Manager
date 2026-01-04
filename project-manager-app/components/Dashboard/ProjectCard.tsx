'use client';

import { Project, Task } from '@/types';
import { getRelativeTime } from '@/lib/utils';
import { Folder, Calendar, CheckCircle2, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProjectCard({ project, tasks, onSelect, onEdit, onDelete }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'complete').length;

  // Find nearest deadline
  const upcomingTasks = tasks
    .filter(t => t.dueDate && t.status !== 'complete')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  const nearestDeadline = upcomingTasks[0]?.dueDate;
  const deadlineInfo = nearestDeadline ? getRelativeTime(nearestDeadline) : null;

  return (
    <div
      className="relative group bg-surface border border-border rounded-xl overflow-hidden cursor-pointer hover:border-accent/50 transition-all duration-200 hover:shadow-lg hover:shadow-accent/5"
      onClick={onSelect}
    >
      {/* Color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: project.color }}
      />

      {/* Content */}
      <div className="p-5 pl-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${project.color}20` }}
            >
              <Folder size={20} style={{ color: project.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-text text-lg leading-tight">{project.name}</h3>
              {project.description && (
                <p className="text-text-secondary text-sm mt-0.5 line-clamp-1">{project.description}</p>
              )}
            </div>
          </div>

          {/* Menu button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg hover:bg-bg text-text-secondary hover:text-text transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={18} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-text hover:bg-bg flex items-center gap-2"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-bg flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4">
          {/* Task count */}
          <div className="flex items-center gap-2 text-text-secondary">
            <CheckCircle2 size={16} />
            <span className="text-sm">
              {completedTasks}/{totalTasks} tasks
            </span>
          </div>

          {/* Deadline */}
          {deadlineInfo && (
            <div className={`flex items-center gap-2 ${deadlineInfo.isOverdue ? 'text-red-400' : 'text-text-secondary'}`}>
              <Calendar size={16} />
              <span className="text-sm">{deadlineInfo.text}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {totalTasks > 0 && (
          <div className="mt-4">
            <div className="h-1.5 bg-bg rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(completedTasks / totalTasks) * 100}%`,
                  backgroundColor: project.color
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
