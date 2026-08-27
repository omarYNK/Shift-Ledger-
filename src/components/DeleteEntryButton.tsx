"use client";

import { useTransition } from "react";
import { deleteOwnTimeEntry } from "@/lib/actions/entry-actions";

export function DeleteEntryButton({ entryId, employeeId }: { entryId: string; employeeId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn-sm btn-danger"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this entry?")) return;
        startTransition(() => {
          deleteOwnTimeEntry(entryId, employeeId).catch((err) => alert(err.message));
        });
      }}
    >
      Delete
    </button>
  );
}
