"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createClientRecord(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const rateRaw = String(formData.get("hourlyRate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) throw new Error("Client name is required");

  const hourlyRate = rateRaw === "" ? null : Number(rateRaw);
  if (hourlyRate !== null && (Number.isNaN(hourlyRate) || hourlyRate < 0)) {
    throw new Error("Invalid hourly rate");
  }

  await prisma.client.create({
    data: { name, hourlyRate, notes: notes || null },
  });

  revalidatePath("/admin/clients");
  revalidatePath("/log");
}

export async function updateClientRate(clientId: string, rateRaw: string) {
  const trimmed = rateRaw.trim();
  const hourlyRate = trimmed === "" ? null : Number(trimmed);
  if (hourlyRate !== null && (Number.isNaN(hourlyRate) || hourlyRate < 0)) {
    throw new Error("Invalid hourly rate");
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { hourlyRate },
  });

  revalidatePath("/admin/clients");
  revalidatePath("/log");
}

export async function updateClientNotes(clientId: string, notes: string) {
  await prisma.client.update({
    where: { id: clientId },
    data: { notes: notes.trim() || null },
  });
  revalidatePath("/admin/clients");
}

export async function deleteClientRecord(clientId: string) {
  // Historical time entries / fixed items / invoices keep their client name
  // snapshot and simply lose the link (clientId set null via onDelete: SetNull)
  // so deleting a client never destroys billing history.
  await prisma.client.delete({ where: { id: clientId } });
  revalidatePath("/admin/clients");
  revalidatePath("/admin/entries");
  revalidatePath("/admin/fixed-charges");
  revalidatePath("/admin/invoices");
  revalidatePath("/log");
}
