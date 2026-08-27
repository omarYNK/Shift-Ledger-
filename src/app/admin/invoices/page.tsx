import { prisma } from "@/lib/prisma";
import { monthKey, monthRange, formatDate, formatMonthLabel } from "@/lib/period";
import { getInvoiceData } from "@/lib/invoice";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; month?: string }>;
}) {
  const params = await searchParams;
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
  const key = params.month || monthKey();
  const clientId = params.clientId || "";

  let preview: Awaited<ReturnType<typeof getInvoiceData>> | null = null;
  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;

  if (clientId) {
    const range = monthRange(key);
    periodStart = range.start;
    periodEnd = range.end;
    preview = await getInvoiceData(clientId, range.start, range.end);
  }

  const pastInvoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <>
      <div className="card">
        <h2>Generate invoice</h2>
        <form className="inline-form">
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label htmlFor="clientId">Client</label>
            <select id="clientId" name="clientId" defaultValue={clientId} required>
              <option value="" disabled>Select a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label htmlFor="month">Month</label>
            <input id="month" name="month" type="month" defaultValue={key} />
          </div>
          <button type="submit" className="btn-primary">Preview</button>
        </form>
      </div>

      {preview && periodStart && periodEnd && (
        <div className="card">
          <h2>
            {preview.client.name} — {formatMonthLabel(key)}
          </h2>

          {preview.client.hourlyRate === null && (
            <p className="badge badge-warn" style={{ marginBottom: 12 }}>This client has no rate set</p>
          )}

          {preview.laborItems.length === 0 && preview.fixedItems.length === 0 ? (
            <p className="empty-state">No activity for this client in {formatMonthLabel(key)}.</p>
          ) : (
            <>
              {preview.laborItems.length > 0 && (
                <>
                  <h3 style={{ fontSize: 12, textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Labor</h3>
                  <table style={{ marginBottom: 16 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Employee</th>
                        <th>Shift</th>
                        <th className="num">Hours</th>
                        <th className="num">Rate</th>
                        <th className="num">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.laborItems.map((e) => (
                        <tr key={e.id}>
                          <td>{formatDate(e.date)}</td>
                          <td>{e.employeeName}</td>
                          <td>{e.startTime}–{e.endTime}</td>
                          <td className="num">{Number(e.hours).toFixed(2)}</td>
                          <td className="num">${Number(e.rate).toFixed(2)}</td>
                          <td className="num">${Number(e.amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {preview.fixedItems.length > 0 && (
                <>
                  <h3 style={{ fontSize: 12, textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Other charges</h3>
                  <table style={{ marginBottom: 16 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th className="num">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.fixedItems.map((f) => (
                        <tr key={f.id}>
                          <td>{formatDate(f.date)}</td>
                          <td>{f.description}</td>
                          <td className="num">${Number(f.amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <div className="stat-row" style={{ justifyContent: "flex-end", textAlign: "right" }}>
                <div>
                  <div className="muted" style={{ fontSize: 13 }}>Labor subtotal: ${preview.subtotalLabor.toFixed(2)}</div>
                  <div className="muted" style={{ fontSize: 13 }}>Other charges subtotal: ${preview.subtotalFixed.toFixed(2)}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>Total due: ${preview.total.toFixed(2)}</div>
                </div>
              </div>
            </>
          )}

          <form action="/api/invoices/generate" method="post" style={{ marginTop: 16 }}>
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="periodStart" value={toISODate(periodStart)} />
            <input type="hidden" name="periodEnd" value={toISODate(periodEnd)} />
            <button type="submit" className="btn-primary">Download invoice PDF</button>
          </form>
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Downloading locks every entry and charge above onto this invoice. Downloading again for the same
            client and month creates a new version instead of silently duplicating.
          </p>
        </div>
      )}

      <div className="card">
        <h2>Past invoices</h2>
        {pastInvoices.length === 0 ? (
          <p className="empty-state">No invoices generated yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Period</th>
                <th className="num">Total</th>
                <th>Generated</th>
              </tr>
            </thead>
            <tbody>
              {pastInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{inv.clientName}</td>
                  <td>{formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}</td>
                  <td className="num">${Number(inv.total).toFixed(2)}</td>
                  <td>{formatDate(inv.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
