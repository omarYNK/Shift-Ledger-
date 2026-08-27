import { prisma } from "@/lib/prisma";
import { createClientRecord } from "@/lib/actions/client-actions";
import { ClientRow } from "@/components/ClientRow";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <div className="card">
        <h2>Add client</h2>
        <form action={createClientRecord}>
          <div className="form-grid">
            <div className="form-row">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" required />
            </div>
            <div className="form-row">
              <label htmlFor="hourlyRate">Hourly rate</label>
              <input id="hourlyRate" name="hourlyRate" type="number" step="0.01" min="0" placeholder="leave blank if TBD" />
            </div>
          </div>
          <div className="form-row">
            <label htmlFor="notes">Notes</label>
            <input id="notes" name="notes" placeholder="storage / postage / handling / software fee arrangements" />
          </div>
          <button type="submit" className="btn-primary">Add client</button>
        </form>
      </div>

      <div className="card">
        <h2>Clients</h2>
        {clients.length === 0 ? (
          <p className="empty-state">No clients yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Rate ($/hr)</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <ClientRow
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  hourlyRate={c.hourlyRate !== null ? Number(c.hourlyRate) : null}
                  notes={c.notes}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
