"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeHours, roundToCents } from "@/lib/hours";

export type TimeEntryInput = {
  clientId: string;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  peopleCount?: number; // how many people worked this shift (default 1)
  note?: string;
};

// existing: when editing, an unchanged client keeps its original rate snapshot
// so adding a headcount to an old entry never silently reprices it.
async function computeEntryFields(
  input: TimeEntryInput,
  existing?: { clientId: string | null; rate: unknown },
) {
  const client = await prisma.client.findUnique({ where: { id: input.clientId } });
  if (!client) throw new Error("Client not found");
  if (client.hourlyRate === null) throw new Error("This client has no rate set yet");

  const peopleCount = input.peopleCount ?? 1;
  if (!Number.isInteger(peopleCount) || peopleCount < 1 || peopleCount > 100) {
    throw new Error("People count must be a whole number from 1 to 100");
  }

  const hours = computeHours(input.startTime, input.endTime);
  const rate =
    existing && existing.clientId === input.clientId ? Number(existing.rate) : Number(client.hourlyRate);
  const amount = roundToCents(hours * peopleCount * rate);

  return {
    clientId: input.clientId,
    clientName: client.name,
    date: new Date(`${input.date}T00:00:00.000Z`),
    startTime: input.startTime,
    endTime: input.endTime,
    hours,
    peopleCount,
    rate,
    amount,
    note: input.note?.trim() || null,
  };
}

export async function createTimeEntry(input: TimeEntryInput & { employeeId: string; employeeName: string }) {
  const fields = await computeEntryFields(input);

  await prisma.timeEntry.create({
    data: {
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      ...fields,
    },
  });

  revalidatePath("/log");
  revalidatePath("/admin/entries");

  return { hours: fields.hours, rate: fields.rate, amount: fields.amount };
}

export async function deleteOwnTimeEntry(entryId: string, employeeId: string) {
  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
  if (!entry) return;
  if (entry.employeeId !== employeeId) throw new Error("Not your entry");
  if (entry.invoicedAt) throw new Error("This entry has already been invoiced and can't be deleted");

  await prisma.timeEntry.delete({ where: { id: entryId } });

  revalidatePath("/log");
  revalidatePath("/admin/entries");
}

export async function updateOwnTimeEntry(entryId: string, employeeId: string, input: TimeEntryInput) {
  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error("Entry not found");
  if (entry.employeeId !== employeeId) throw new Error("Not your entry");
  if (entry.invoicedAt) throw new Error("This entry has already been invoiced and can't be edited");

  const fields = await computeEntryFields(input, entry);
  await prisma.timeEntry.update({ where: { id: entryId }, data: fields });

  revalidatePath("/log");
  revalidatePath("/admin/entries");
}

// --- Admin: can act on any employee's entries, subject to the same
// invoiced-lock rule that keeps generated invoices reproducible. ---

export async function updateTimeEntryAsAdmin(entryId: string, input: TimeEntryInput) {
  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error("Entry not found");
  if (entry.invoicedAt) throw new Error("This entry has already been invoiced and can't be edited");

  const fields = await computeEntryFields(input, entry);
  await prisma.timeEntry.update({ where: { id: entryId }, data: fields });

  revalidatePath("/log");
  revalidatePath("/admin/entries");
}

export async function deleteTimeEntryAsAdmin(entryId: string) {
  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
  if (!entry) return;
  if (entry.invoicedAt) throw new Error("This entry has already been invoiced and can't be deleted");

  await prisma.timeEntry.delete({ where: { id: entryId } });

  revalidatePath("/log");
  revalidatePath("/admin/entries");
}
