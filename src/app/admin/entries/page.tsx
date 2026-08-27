import { prisma } from "@/lib/prisma";
import { monthKey, monthRange, formatDate } from "@/lib/period";
import { formatMonthLabel } from "@/lib/period";

export default async function AllEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; clientId?: string }>;
}) {
  const params = await searchParams;
  const key = params.month || monthKey();
  const clientId = params.clientId || "";
  const { start, end } = monthRange(key);

  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  const entries = await prisma.timeEntry.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(clientId ? { clientId } : {}),
    },
    orderBy: { date: "desc" },
  });

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
  const totalAmount = entries.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="card">
      <h2>All entries — {formatMonthLabel(key)}</h2>
      <form className="inline-form" style={{ marginBottom: 20 }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label htmlFor="month">Month</label>
          <input id="month" name="month" type="month" defaultValue={key} />
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label htmlFor="clientId">Client</label>
          <select id="clientId" name="clientId" defaultValue={clientId}>
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">Filter</button>
      </form>

      {entries.length === 0 ? (
        <p className="empty-state">No entries for this filter.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Client</th>
              <th>Shift</th>
              <th className="num">Hours</th>
              <th className="num">Rate</th>
              <th className="num">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{formatDate(e.date)}</td>
                <td>{e.employeeName}</td>
                <td>{e.clientName}</td>
                <td>{e.startTime}–{e.endTime}</td>
                <td className="num">{Number(e.hours).toFixed(2)}</td>
                <td className="num">${Number(e.rate).toFixed(2)}</td>
                <td className="num">${Number(e.amount).toFixed(2)}</td>
                <td>{e.invoicedAt && <span className="badge badge-muted">Invoiced</span>}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ fontWeight: 600 }}>Total</td>
              <td className="num" style={{ fontWeight: 600 }}>{totalHours.toFixed(2)}</td>
              <td></td>
              <td className="num" style={{ fontWeight: 600 }}>${totalAmount.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
