'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Search } from 'lucide-react';
import Column from './Column';
import Card from './Card';
import TaskModal from './TaskModal';
import { Task, Status, ColumnConfig, Tag } from '@/types';
import { generateId } from '@/lib/utils';

const columns: ColumnConfig[] = [
  { id: 'todo', title: 'To Do', color: '#fbbf24', dotColor: 'bg-amber-400' },
  { id: 'in-progress', title: 'In Progress', color: '#60a5fa', dotColor: 'bg-blue-400' },
  { id: 'complete', title: 'Complete', color: '#34d399', dotColor: 'bg-emerald-400' },
];

interface KanbanBoardProps {
  tasks: Task[];
  tags: Tag[];
  onAddTask: (task: Task) => Promise<void> | void;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void> | void;
  onDeleteTask: (id: string) => Promise<void> | void;
  onAddTag: (tag: Tag) => Promise<void> | void;
  isNewTaskOpen: boolean;
  setIsNewTaskOpen: (value: boolean) => void;
  onOpenSearch: () => void;
}

export default function KanbanBoard({
  tasks,
  tags,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddTag,
  isNewTaskOpen,
  setIsNewTaskOpen,
  onOpenSearch,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<Status | null>(null);

  // Handle new task from keyboard shortcut
  useEffect(() => {
    if (isNewTaskOpen) {
      setNewTaskStatus('todo');
      setEditingTask(null);
      setIsModalOpen(true);
      setIsNewTaskOpen(false);
    }
  }, [isNewTaskOpen, setIsNewTaskOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTaskItem = tasks.find((t) => t.id === active.id);
    if (!activeTaskItem) return;

    const overId = over.id as string;

    // Check if dropped over a column
    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn && activeTaskItem.status !== overColumn.id) {
      onUpdateTask(activeTaskItem.id, { status: overColumn.id });
      return;
    }

    // Check if dropped over another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && activeTaskItem.status !== overTask.status) {
      onUpdateTask(activeTaskItem.id, { status: overTask.status });
    }
  };

  const handleDragEnd = () => {
    setActiveTask(null);
  };

  const handleAddTaskToColumn = (status: Status) => {
    setNewTaskStatus(status);
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskStatus(null);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (editingTask) {
      // Update existing task
      await onUpdateTask(editingTask.id, taskData);
    } else if (newTaskStatus) {
      // Create new task
      const newTask: Task = {
        id: generateId(),
        title: taskData.title || '',
        description: taskData.description || '',
        status: newTaskStatus,
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || null,
        createdAt: new Date().toISOString(),
        tags: taskData.tags || [],
        subtasks: taskData.subtasks || [],
      };
      await onAddTask(newTask);
    }
    setIsModalOpen(false);
    setEditingTask(null);
    setNewTaskStatus(null);
  };

  const handleDeleteTaskClick = async (taskId: string) => {
    await onDeleteTask(taskId);
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const getTasksByStatus = (status: Status) => {
    return tasks.filter((t) => t.status === status);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Project Board
        </h1>

        {/* Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-border-light transition-colors text-text-muted hover:text-text"
        >
          <Search size={16} />
          <span className="text-sm">Search</span>
          <kbd className="text-xs bg-surface-hover px-1.5 py-0.5 rounded ml-2">Ctrl+K</kbd>
        </button>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 px-6 pb-6 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.id)}
                tags={tags}
                onAddTask={() => handleAddTaskToColumn(column.id)}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTaskClick}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <Card task={activeTask} tags={tags} isDragging onEdit={() => {}} onDelete={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
          setNewTaskStatus(null);
        }}
        task={editingTask}
        tags={tags}
        onAddTag={onAddTag}
        onSave={handleSaveTask}
        onDelete={editingTask ? () => handleDeleteTaskClick(editingTask.id) : undefined}
      />
    </div>
  );
}
