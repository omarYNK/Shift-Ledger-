"use client";

import { useMemo, useState, useTransition } from "react";
import { createTimeEntry } from "@/lib/actions/entry-actions";

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

export function LogForm({
  clients,
  employeeId,
  employeeName,
}: {
  clients: ClientOption[];
  employeeId: string;
  employeeName: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedClient = clients.find((c) => c.id === clientId);
  const preview = useMemo(() => computeHoursPreview(startTime, endTime), [startTime, endTime]);
  const previewAmount = preview !== null && selectedClient ? preview * selectedClient.hourlyRate : null;

  if (clients.length === 0) {
    return (
      <p className="empty-state">
        No clients have a rate set yet. Ask the admin to set an hourly rate before logging hours.
      </p>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await createTimeEntry({
          employeeId,
          employeeName,
          clientId,
          date,
          startTime,
          endTime,
          note,
        });
        setSuccess(`Logged ${result.hours.toFixed(2)}h — $${result.amount.toFixed(2)}`);
        setStartTime("");
        setEndTime("");
        setNote("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-row">
          <label htmlFor="clientId">Client</label>
          <select id="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (${c.hourlyRate.toFixed(2)}/hr)
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="startTime">Start time</label>
          <input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="endTime">End time</label>
          <input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="note">Note (optional)</label>
        <input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. covered for Alex" />
      </div>

      {preview !== null && (
        <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
          {preview.toFixed(2)} hours
          {previewAmount !== null && <> · ${previewAmount.toFixed(2)}</>}
          {endTime && startTime && preview !== null && parseInt(endTime.slice(0, 2)) <= parseInt(startTime.slice(0, 2)) && (
            <span> (crosses midnight)</span>
          )}
        </p>
      )}

      {error && <p className="error-text">{error}</p>}
      {success && <p style={{ color: "var(--success-text)", fontSize: 13, marginBottom: 10 }}>{success}</p>}

      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Logging..." : "Log hours"}
      </button>
    </form>
  );
}
