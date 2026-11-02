import React, { useState } from 'react';
import { X, StickyNote } from 'lucide-react';

export interface WorkspaceSharedNotesStaticComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkspaceSharedNotesStaticComponent({
  isOpen,
  onClose,
}: WorkspaceSharedNotesStaticComponentProps): React.JSX.Element | null {
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  return (
    <aside className="w-80 h-full bg-neutral-900 border-l border-neutral-800 flex flex-col z-30 shadow-2xl">
      {/* Header */}
      <div className="h-10 px-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-neutral-100">Live Scratchpad</span>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-200 p-1 rounded hover:bg-neutral-800 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-3 flex flex-col">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste quick endpoints, JSON snippets, or pairing ideas here..."
          className="w-full flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
        />
        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 px-1">
          <span>Local scratchpad buffer</span>
          <span>{notes.length} chars</span>
        </div>
      </div>
    </aside>
  );
}
