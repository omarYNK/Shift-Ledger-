"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/fixed-charges", label: "Fixed charges" },
  { href: "/admin/entries", label: "All entries" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav className="tabs">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} className={`tab ${pathname.startsWith(tab.href) ? "active" : ""}`}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
