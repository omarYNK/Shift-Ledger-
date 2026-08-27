import { prisma } from "@/lib/prisma";
import { createEmployeeRecord } from "@/lib/actions/employee-actions";
import { EmployeeRow } from "@/components/EmployeeRow";

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({ orderBy: [{ archivedAt: "asc" }, { name: "asc" }] });

  return (
    <>
      <div className="card">
        <h2>Add employee</h2>
        <form action={createEmployeeRecord} className="inline-form">
          <div className="form-row" style={{ marginBottom: 0, flex: 1 }}>
            <label htmlFor="name">Name</label>
            <input id="name" name="name" required />
          </div>
          <button type="submit" className="btn-primary">Add</button>
        </form>
      </div>

      <div className="card">
        <h2>Employees</h2>
        {employees.length === 0 ? (
          <p className="empty-state">No employees yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <EmployeeRow key={e.id} id={e.id} name={e.name} archived={e.archivedAt !== null} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
