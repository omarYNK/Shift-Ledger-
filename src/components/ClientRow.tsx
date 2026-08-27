"use client";

import { useState, useTransition } from "react";
import { updateClientRate, updateClientNotes, deleteClientRecord } from "@/lib/actions/client-actions";

type ClientRowProps = {
  id: string;
  name: string;
  hourlyRate: number | null;
  notes: string | null;
};

export function ClientRow({ id, name, hourlyRate, notes }: ClientRowProps) {
  const [rate, setRate] = useState(hourlyRate !== null ? String(hourlyRate) : "");
  const [notesValue, setNotesValue] = useState(notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function saveRate() {
    setError(null);
    startTransition(async () => {
      try {
        await updateClientRate(id, rate);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  function saveNotes() {
    startTransition(async () => {
      await updateClientNotes(id, notesValue);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete ${name}? This can't be undone. (Past hours/charges for this client keep their own record — they just won't be linked to a client anymore.)`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteClientRecord(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  }

  return (
    <tr>
      <td>
        {name}
        {hourlyRate === null && <div className="badge badge-warn" style={{ marginTop: 4 }}>needs rate</div>}
      </td>
      <td>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span>$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            style={{ width: 80 }}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="—"
          />
          <button type="button" className="btn-sm" onClick={saveRate} disabled={isPending}>
            Save
          </button>
        </div>
      </td>
      <td>
        <input
          value={notesValue}
          onChange={(e) => setNotesValue(e.target.value)}
          onBlur={saveNotes}
          placeholder="storage / postage / handling notes…"
          style={{ width: "100%", minWidth: 200 }}
        />
      </td>
      <td>
        <button type="button" className="btn-sm btn-danger" onClick={handleDelete} disabled={isPending}>
          Delete
        </button>
        {error && <div className="error-text">{error}</div>}
      </td>
    </tr>
  );
}
