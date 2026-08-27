import { prisma } from "@/lib/prisma";
import { createFixedItem } from "@/lib/actions/fixed-item-actions";
import { DeleteFixedItemButton } from "@/components/DeleteFixedItemButton";
import { formatDate } from "@/lib/period";

export default async function FixedChargesPage() {
  const [clients, items] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.fixedItem.findMany({ orderBy: { date: "desc" }, take: 200 }),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="card">
        <h2>Add one-off charge</h2>
        <form action={createFixedItem}>
          <div className="form-grid">
            <div className="form-row">
              <label htmlFor="clientId">Client</label>
              <select id="clientId" name="clientId" required>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="date">Date</label>
              <input id="date" name="date" type="date" defaultValue={today} required />
            </div>
            <div className="form-row">
              <label htmlFor="amount">Amount ($)</label>
              <input id="amount" name="amount" type="number" step="0.01" min="0" required />
            </div>
          </div>
          <div className="form-row">
            <label htmlFor="description">Description</label>
            <input id="description" name="description" placeholder="e.g. Polymailers x500" required />
          </div>
          <button type="submit" className="btn-primary">Add charge</button>
        </form>
      </div>

      <div className="card">
        <h2>Fixed charges</h2>
        {items.length === 0 ? (
          <p className="empty-state">No fixed charges yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Description</th>
                <th>Added by</th>
                <th className="num">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.date)}</td>
                  <td>{item.clientName}</td>
                  <td>{item.description}</td>
                  <td className="muted">{item.employeeName ?? "Admin"}</td>
                  <td className="num">${Number(item.amount).toFixed(2)}</td>
                  <td>
                    {item.invoicedAt ? (
                      <span className="badge badge-muted">Invoiced</span>
                    ) : (
                      <DeleteFixedItemButton id={item.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
