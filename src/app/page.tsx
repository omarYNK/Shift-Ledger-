import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getIdentity } from "@/lib/identity";
import { chooseEmployee } from "@/lib/actions/identity-actions";
import { AdminLoginForm } from "@/components/AdminLoginForm";

export default async function HomePage() {
  const identity = await getIdentity();
  if (identity?.type === "admin") redirect("/admin");
  if (identity?.type === "employee") redirect("/log");

  const employees = await prisma.employee.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <div className="page-narrow">
      <h1 className="brand" style={{ marginBottom: 32, textAlign: "center" }}>
        Shift Ledger
      </h1>

      <div className="identity-choice">
        <form action={chooseEmployee}>
          <button type="button" className="choice-card" style={{ marginBottom: 10, cursor: "default" }}>
            <h3>I&apos;m an employee</h3>
            <p className="muted" style={{ fontSize: 13 }}>Log your hours for a client.</p>
          </button>
          <div className="form-row">
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              name="name"
              list="employee-names"
              placeholder="Start typing your name"
              required
              autoComplete="off"
            />
            <datalist id="employee-names">
              {employees.map((e) => (
                <option key={e.id} value={e.name} />
              ))}
            </datalist>
          </div>
          <button type="submit" className="btn-primary" style={{ width: "100%" }}>
            Continue
          </button>
        </form>

        <hr className="sep" />

        <AdminLoginForm />
      </div>
    </div>
  );
}
