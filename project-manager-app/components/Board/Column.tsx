'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import Card from './Card';
import { Task, ColumnConfig, Tag } from '@/types';

interface ColumnProps {
  column: ColumnConfig;
  tasks: Task[];
  tags: Tag[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function Column({
  column,
  tasks,
  tags,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.dotColor}`} />
          <h3 className="font-medium text-text">{column.title}</h3>
          <span className="text-xs text-text-muted bg-surface px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-accent transition-colors"
          aria-label={`Add task to ${column.title}`}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 overflow-y-auto rounded-lg p-2
          transition-colors duration-200
          ${isOver ? 'bg-surface-hover ring-2 ring-accent/30' : 'bg-surface/50'}
        `}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <Card
                key={task.id}
                task={task}
                tags={tags}
                onEdit={() => onEditTask(task)}
                onDelete={() => onDeleteTask(task.id)}
              />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-24 flex items-center justify-center text-text-muted text-sm">
            No tasks yet
          </div>
        )}
      </div>
    </div>
  );
}
