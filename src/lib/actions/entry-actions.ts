"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeHours, roundToCents } from "@/lib/hours";

export async function createTimeEntry(input: {
  employeeId: string;
  employeeName: string;
  clientId: string;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  note?: string;
}) {
  const client = await prisma.client.findUnique({ where: { id: input.clientId } });
  if (!client) throw new Error("Client not found");
  if (client.hourlyRate === null) throw new Error("This client has no rate set yet");

  const hours = computeHours(input.startTime, input.endTime);
  const rate = Number(client.hourlyRate);
  const amount = roundToCents(hours * rate);

  await prisma.timeEntry.create({
    data: {
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      clientId: input.clientId,
      clientName: client.name,
      date: new Date(`${input.date}T00:00:00.000Z`),
      startTime: input.startTime,
      endTime: input.endTime,
      hours,
      rate,
      amount,
      note: input.note?.trim() || null,
    },
  });

  revalidatePath("/log");
  revalidatePath("/admin/entries");

  return { hours, rate, amount };
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
