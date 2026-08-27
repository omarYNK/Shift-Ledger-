import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/identity";
import { SwitchUserLink } from "@/components/SwitchUserLink";
import { AdminTabs } from "@/components/AdminTabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const identity = await getIdentity();
  if (!identity) redirect("/");
  if (identity.type !== "admin") redirect("/log");

  return (
    <div className="page">
      <div className="top-bar">
        <div className="brand">Shift Ledger — Admin</div>
        <SwitchUserLink />
      </div>
      <AdminTabs />
      {children}
    </div>
  );
}
