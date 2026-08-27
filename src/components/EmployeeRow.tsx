"use client";

import { useTransition } from "react";
import { setEmployeeArchived } from "@/lib/actions/employee-actions";

export function EmployeeRow({ id, name, archived }: { id: string; name: string; archived: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <tr style={archived ? { opacity: 0.5 } : undefined}>
      <td>{name}</td>
      <td>
        <button
          type="button"
          className="btn-sm"
          disabled={isPending}
          onClick={() => startTransition(() => setEmployeeArchived(id, !archived))}
        >
          {archived ? "Unarchive" : "Archive"}
        </button>
      </td>
    </tr>
  );
}
