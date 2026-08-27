import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getIdentity } from "@/lib/identity";
import { monthKey, monthRange, formatDate, formatMonthLabel } from "@/lib/period";
import { SwitchUserLink } from "@/components/SwitchUserLink";
import { LogForm } from "@/components/LogForm";
import { DeleteEntryButton } from "@/components/DeleteEntryButton";
import { DeleteOwnFixedItemButton } from "@/components/DeleteOwnFixedItemButton";
import { createFixedItem } from "@/lib/actions/fixed-item-actions";

export default async function LogPage() {
  const identity = await getIdentity();
  if (!identity) redirect("/");
  if (identity.type !== "employee") redirect("/admin");

  const clients = await prisma.client.findMany({
    where: { hourlyRate: { not: null } },
    orderBy: { name: "asc" },
  });
  const allClients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  const key = monthKey();
  const { start, end } = monthRange(key);

  const [entries, fixedItems] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { employeeId: identity.employeeId, date: { gte: start, lte: end } },
      orderBy: { date: "desc" },
    }),
    prisma.fixedItem.findMany({
      where: { employeeId: identity.employeeId, date: { gte: start, lte: end } },
      orderBy: { date: "desc" },
    }),
  ]);

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
  const totalPay = entries.reduce((sum, e) => sum + Number(e.amount), 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <div className="brand">Shift Ledger</div>
          <div className="muted" style={{ fontSize: 13 }}>Logged in as {identity.employeeName}</div>
        </div>
        <SwitchUserLink />
      </div>

      <div className="card">
        <h2>Log hours</h2>
        <LogForm clients={clients.map((c) => ({ id: c.id, name: c.name, hourlyRate: Number(c.hourlyRate) }))} employeeId={identity.employeeId} employeeName={identity.employeeName} />
      </div>

      <div className="card">
        <h2>{formatMonthLabel(key)} — your entries</h2>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{totalHours.toFixed(2)}</div>
            <div className="label">Hours</div>
          </div>
          <div className="stat">
            <div className="value">${totalPay.toFixed(2)}</div>
            <div className="label">Pay</div>
          </div>
        </div>

        {entries.length === 0 ? (
          <p className="empty-state">No entries yet this month.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Shift</th>
                <th className="num">Hours</th>
                <th className="num">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.date)}</td>
                  <td>{e.clientName}</td>
                  <td>
                    {e.startTime}–{e.endTime}
                    {e.note && <div className="muted" style={{ fontSize: 12 }}>{e.note}</div>}
                  </td>
                  <td className="num">{Number(e.hours).toFixed(2)}</td>
                  <td className="num">${Number(e.amount).toFixed(2)}</td>
                  <td>
                    {e.invoicedAt ? (
                      <span className="badge badge-muted">Invoiced</span>
                    ) : (
                      <DeleteEntryButton entryId={e.id} employeeId={identity.employeeId} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Add a fixed charge</h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
          For one-off, non-hourly items billed to a client — e.g. materials or packaging used on a job.
        </p>
        <form action={createFixedItem}>
          <input type="hidden" name="employeeId" value={identity.employeeId} />
          <input type="hidden" name="employeeName" value={identity.employeeName} />
          <div className="form-grid">
            <div className="form-row">
              <label htmlFor="fi-clientId">Client</label>
              <select id="fi-clientId" name="clientId" required>
                {allClients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="fi-date">Date</label>
              <input id="fi-date" name="date" type="date" defaultValue={today} required />
            </div>
            <div className="form-row">
              <label htmlFor="fi-amount">Amount ($)</label>
              <input id="fi-amount" name="amount" type="number" step="0.01" min="0" required />
            </div>
          </div>
          <div className="form-row">
            <label htmlFor="fi-description">Description</label>
            <input id="fi-description" name="description" placeholder="e.g. Polymailers x500" required />
          </div>
          <button type="submit" className="btn-primary">Add charge</button>
        </form>
      </div>

      <div className="card">
        <h2>{formatMonthLabel(key)} — your fixed charges</h2>
        {fixedItems.length === 0 ? (
          <p className="empty-state">No fixed charges logged yet this month.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Description</th>
                <th className="num">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fixedItems.map((f) => (
                <tr key={f.id}>
                  <td>{formatDate(f.date)}</td>
                  <td>{f.clientName}</td>
                  <td>{f.description}</td>
                  <td className="num">${Number(f.amount).toFixed(2)}</td>
                  <td>
                    {f.invoicedAt ? (
                      <span className="badge badge-muted">Invoiced</span>
                    ) : (
                      <DeleteOwnFixedItemButton id={f.id} employeeId={identity.employeeId} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
