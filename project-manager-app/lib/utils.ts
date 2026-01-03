export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getRelativeTime(dateString: string): { text: string; isOverdue: boolean } {
  const date = new Date(dateString);
  const now = new Date();

  // Reset time to compare dates only
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = dateOnly.getTime() - nowOnly.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { text: 'Today', isOverdue: false };
  } else if (diffDays === 1) {
    return { text: 'Tomorrow', isOverdue: false };
  } else if (diffDays === -1) {
    return { text: 'Yesterday', isOverdue: true };
  } else if (diffDays > 1 && diffDays <= 7) {
    return { text: `In ${diffDays} days`, isOverdue: false };
  } else if (diffDays < -1) {
    return { text: `${Math.abs(diffDays)} days overdue`, isOverdue: true };
  } else if (diffDays > 7 && diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    return { text: `In ${weeks} week${weeks > 1 ? 's' : ''}`, isOverdue: false };
  } else if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    return { text: `In ${months} month${months > 1 ? 's' : ''}`, isOverdue: false };
  }

  return { text: formatDate(dateString), isOverdue: diffDays < 0 };
}

export function formatDueDate(dateString: string | null): { display: string; isOverdue: boolean } | null {
  if (!dateString) return null;

  const exact = formatDate(dateString);
  const { text: relative, isOverdue } = getRelativeTime(dateString);

  return {
    display: `${exact} (${relative})`,
    isOverdue,
  };
}

export const priorityColors = {
  high: '#ef4444',
  medium: '#eab308',
  low: '#22c55e',
} as const;

export const statusColors = {
  todo: '#fbbf24',
  'in-progress': '#60a5fa',
  complete: '#34d399',
} as const;
