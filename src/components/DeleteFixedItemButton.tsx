"use client";

import { useTransition } from "react";
import { deleteFixedItem } from "@/lib/actions/fixed-item-actions";

export function DeleteFixedItemButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn-sm btn-danger"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this charge?")) return;
        startTransition(() => {
          deleteFixedItem(id).catch((err) => alert(err.message));
        });
      }}
    >
      Delete
    </button>
  );
}
