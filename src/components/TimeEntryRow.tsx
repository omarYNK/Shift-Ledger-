"use client";

import { useMemo, useState, useTransition } from "react";
import type { TimeEntryInput } from "@/lib/actions/entry-actions";

type ClientOption = { id: string; name: string; hourlyRate: number };

function computeHoursPreview(startTime: string, endTime: string): number | null {
  const re = /^([0-1]?\d|2[0-3]):([0-5]\d)$/;
  const s = re.exec(startTime);
  const e = re.exec(endTime);
  if (!s || !e) return null;
  const startMin = Number(s[1]) * 60 + Number(s[2]);
  let endMin = Number(e[1]) * 60 + Number(e[2]);
  if (endMin <= startMin) endMin += 24 * 60;
  return Math.round(((endMin - startMin) / 60) * 100) / 100;
}

export function TimeEntryRow({
  dateISO,
  dateLabel,
  clientId,
  clientName,
  startTime,
  endTime,
  hours,
  peopleCount,
  rate,
  amount,
  note,
  invoiced,
  clients,
  employeeName,
  showRateColumn = false,
  onSave,
  onDelete,
}: {
  dateISO: string;
  dateLabel: string;
  clientId: string;
  clientName: string;
  startTime: string;
  endTime: string;
  hours: number;
  peopleCount: number;
  rate: number;
  amount: number;
  note: string | null;
  invoiced: boolean;
  clients: ClientOption[];
  employeeName?: string;
  showRateColumn?: boolean;
  onSave: (input: TimeEntryInput) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [fClientId, setFClientId] = useState(clientId);
  const [fDate, setFDate] = useState(dateISO);
  const [fStart, setFStart] = useState(startTime);
  const [fEnd, setFEnd] = useState(endTime);
  const [fNote, setFNote] = useState(note ?? "");
  const [fPeople, setFPeople] = useState(String(peopleCount));

  const selectedClient = clients.find((c) => c.id === fClientId);
  const preview = useMemo(() => computeHoursPreview(fStart, fEnd), [fStart, fEnd]);
  const peopleNum = Number(fPeople);
  const peopleValid = Number.isInteger(peopleNum) && peopleNum >= 1 && peopleNum <= 100;
  const previewTotalHours = preview !== null && peopleValid ? preview * peopleNum : null;
  // Same client keeps the entry's original rate (matches the server); a new client uses its current rate.
  const previewRate = fClientId === clientId ? rate : selectedClient?.hourlyRate;
  const previewAmount =
    previewTotalHours !== null && previewRate !== undefined ? previewTotalHours * previewRate : null;
  const totalHours = hours * peopleCount;
  const peopleLabel = peopleCount > 1 ? `${peopleCount} people × ${hours.toFixed(2)} hrs` : null;

  function startEdit() {
    setFClientId(clientId);
    setFDate(dateISO);
    setFStart(startTime);
    setFEnd(endTime);
    setFNote(note ?? "");
    setFPeople(String(peopleCount));
    setError(null);
    setEditing(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await onSave({
          clientId: fClientId,
          date: fDate,
          startTime: fStart,
          endTime: fEnd,
          peopleCount: peopleNum,
          note: fNote,
        });
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    startTransition(() => {
      onDelete().catch((err) => alert(err.message));
    });
  }

  if (invoiced) {
    return (
      <tr>
        <td>{dateLabel}</td>
        {employeeName !== undefined && <td>{employeeName}</td>}
        <td>{clientName}</td>
        <td>
          {startTime}–{endTime}
          {peopleLabel && <div className="muted" style={{ fontSize: 12 }}>{peopleLabel}</div>}
          {note && <div className="muted" style={{ fontSize: 12 }}>{note}</div>}
        </td>
        <td className="num">{totalHours.toFixed(2)}</td>
        {showRateColumn && <td className="num">${rate.toFixed(2)}</td>}
        <td className="num">${amount.toFixed(2)}</td>
        <td><span className="badge badge-muted">Invoiced</span></td>
      </tr>
    );
  }

  if (!editing) {
    return (
      <tr>
        <td>{dateLabel}</td>
        {employeeName !== undefined && <td>{employeeName}</td>}
        <td>{clientName}</td>
        <td>
          {startTime}–{endTime}
          {peopleLabel && <div className="muted" style={{ fontSize: 12 }}>{peopleLabel}</div>}
          {note && <div className="muted" style={{ fontSize: 12 }}>{note}</div>}
        </td>
        <td className="num">{totalHours.toFixed(2)}</td>
        {showRateColumn && <td className="num">${rate.toFixed(2)}</td>}
        <td className="num">${amount.toFixed(2)}</td>
        <td style={{ display: "flex", gap: 6 }}>
          <button type="button" className="btn-sm" onClick={startEdit}>Edit</button>
          <button type="button" className="btn-sm btn-danger" onClick={handleDelete} disabled={isPending}>Delete</button>
        </td>
      </tr>
    );
  }

  const colSpanBefore = 1 + (employeeName !== undefined ? 1 : 0);

  return (
    <tr>
      <td colSpan={colSpanBefore}>
        <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} />
      </td>
      <td>
        <select value={fClientId} onChange={(e) => setFClientId(e.target.value)}>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name} (${c.hourlyRate.toFixed(2)}/hr)</option>
          ))}
        </select>
      </td>
      <td>
        <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <input type="time" value={fStart} onChange={(e) => setFStart(e.target.value)} style={{ width: 100 }} />
          <input type="time" value={fEnd} onChange={(e) => setFEnd(e.target.value)} style={{ width: 100 }} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          People
          <input
            type="number"
            min="1"
            max="100"
            step="1"
            value={fPeople}
            onChange={(e) => setFPeople(e.target.value)}
            style={{ width: 70 }}
          />
        </label>
        <input value={fNote} onChange={(e) => setFNote(e.target.value)} placeholder="note (optional)" style={{ width: "100%" }} />
        {error && <div className="error-text">{error}</div>}
      </td>
      <td className="num">{previewTotalHours !== null ? previewTotalHours.toFixed(2) : "—"}</td>
      {showRateColumn && <td className="num">{previewRate !== undefined ? `$${previewRate.toFixed(2)}` : "—"}</td>}
      <td className="num">{previewAmount !== null ? `$${previewAmount.toFixed(2)}` : "—"}</td>
      <td style={{ display: "flex", gap: 6 }}>
        <button type="button" className="btn-sm btn-primary" onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </button>
        <button type="button" className="btn-sm" onClick={() => setEditing(false)} disabled={isPending}>Cancel</button>
      </td>
    </tr>
  );
}
