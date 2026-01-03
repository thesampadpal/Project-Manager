'use client';

interface NotesProps {
  notes: string;
  setNotes: (value: string | ((prev: string) => string)) => void;
}

export default function Notes({ notes, setNotes }: NotesProps) {
  return (
    <div className="h-full flex flex-col">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write your notes here..."
        className="flex-1 w-full bg-bg border border-border rounded-lg p-3 text-sm text-text placeholder:text-text-muted focus:border-accent transition-colors resize-none"
        style={{ minHeight: '200px' }}
      />
      <div className="mt-2 text-xs text-text-muted text-right">
        {notes.length} characters
      </div>
    </div>
  );
}
