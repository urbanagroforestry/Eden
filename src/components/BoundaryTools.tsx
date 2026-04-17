"use client";

export function BoundaryTools({ onUndo, onClear }: { onUndo: () => void; onClear: () => void }) {
  return (
    <div className="flex gap-2 text-sm">
      <button onClick={onUndo} className="rounded border px-3 py-1">Undo point</button>
      <button onClick={onClear} className="rounded border px-3 py-1">Clear boundary</button>
      <span className="text-bark/70">Tip: click map to add polygon points in order.</span>
    </div>
  );
}
