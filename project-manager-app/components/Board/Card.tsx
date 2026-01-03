'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Calendar, CheckSquare } from 'lucide-react';
import { Task, Tag } from '@/types';
import { formatDueDate, priorityColors } from '@/lib/utils';

interface CardProps {
  task: Task;
  tags: Tag[];
  isDragging?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function Card({ task, tags, isDragging = false, onEdit, onDelete }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueInfo = formatDueDate(task.dueDate);
  const borderColor = priorityColors[task.priority];
  const isBeingDragged = isDragging || isSortableDragging;

  const getTagById = (tagId: string) => tags.find((t) => t.id === tagId);
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeftColor: borderColor,
      }}
      className={`
        group relative bg-surface border border-border rounded-lg p-3
        border-l-4 cursor-pointer
        transition-all duration-200
        hover:bg-surface-hover hover:border-border-light
        ${isBeingDragged ? 'opacity-50 shadow-lg scale-[1.02]' : ''}
      `}
      onClick={onEdit}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} className="text-text-muted" />
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-priority-high/20 text-text-muted hover:text-priority-high"
        aria-label="Delete task"
      >
        <Trash2 size={14} />
      </button>

      {/* Content */}
      <div className="pl-3">
        <h4 className="font-medium text-text text-sm pr-6 line-clamp-2">{task.title}</h4>

        {task.description && (
          <p className="text-text-muted text-xs mt-1 line-clamp-2">{task.description}</p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.slice(0, 3).map((tagId) => {
              const tag = getTagById(tagId);
              if (!tag) return null;
              return (
                <span
                  key={tagId}
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </span>
              );
            })}
            {task.tags.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-muted">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: Due Date & Subtasks */}
        {(dueInfo || totalSubtasks > 0) && (
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Subtasks Progress */}
            {totalSubtasks > 0 && (
              <div className={`flex items-center gap-1 text-xs ${completedSubtasks === totalSubtasks ? 'text-status-complete' : 'text-text-muted'}`}>
                <CheckSquare size={12} />
                <span>{completedSubtasks}/{totalSubtasks}</span>
              </div>
            )}

            {/* Due Date */}
            {dueInfo && (
              <div className={`flex items-center gap-1 text-xs ${dueInfo.isOverdue ? 'text-priority-high' : 'text-text-secondary'}`}>
                <Calendar size={12} />
                <span>{dueInfo.display}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
