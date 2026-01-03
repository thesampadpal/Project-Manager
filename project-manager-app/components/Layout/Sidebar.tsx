'use client';

import { useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

interface SidebarProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  side: 'left' | 'right';
  width: number;
  onWidthChange: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
}

export default function Sidebar({
  title,
  icon,
  children,
  isCollapsed,
  onToggle,
  side,
  width,
  onWidthChange,
  minWidth = 200,
  maxWidth = 480,
}: SidebarProps) {
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const ChevronIcon = side === 'left'
    ? (isCollapsed ? ChevronRight : ChevronLeft)
    : (isCollapsed ? ChevronLeft : ChevronRight);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      const delta = side === 'left'
        ? e.clientX - startX.current
        : startX.current - e.clientX;

      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width, onWidthChange, side, minWidth, maxWidth]);

  return (
    <aside
      className={`
        relative flex flex-col
        bg-surface border-border-light
        transition-[width] duration-200 ease-out
        ${side === 'left' ? 'border-r' : 'border-l'}
      `}
      style={{ width: isCollapsed ? 48 : width }}
    >
      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className={`
            absolute top-0 bottom-0 w-1 z-20
            cursor-col-resize group
            hover:bg-accent/50 active:bg-accent
            transition-colors
            ${side === 'left' ? 'right-0' : 'left-0'}
          `}
        >
          <div className={`
            absolute top-1/2 -translate-y-1/2
            opacity-0 group-hover:opacity-100 transition-opacity
            bg-surface-hover border border-border-light rounded p-0.5
            ${side === 'left' ? '-right-2' : '-left-2'}
          `}>
            <GripVertical size={12} className="text-text-muted" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`
        flex items-center gap-3 p-4 border-b border-border
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}>
        {isCollapsed ? (
          <div className="text-text-secondary">{icon}</div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-text-secondary flex-shrink-0">{icon}</span>
            <h2 className="font-medium text-text truncate">{title}</h2>
          </div>
        )}
        <button
          onClick={onToggle}
          className={`
            p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text
            transition-colors flex-shrink-0
            ${isCollapsed ? 'absolute -right-3 top-4 bg-surface border border-border-light z-10' : ''}
          `}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronIcon size={16} />
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          {children}
        </div>
      )}
    </aside>
  );
}
