"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createFixedItem(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const date = String(formData.get("date") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const employeeId = String(formData.get("employeeId") ?? "").trim() || null;
  const employeeName = String(formData.get("employeeName") ?? "").trim() || null;

  if (!clientId) throw new Error("Client is required");
  if (!description) throw new Error("Description is required");

  const amount = Number(amountRaw);
  if (Number.isNaN(amount)) throw new Error("Invalid amount");

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("Client not found");

  await prisma.fixedItem.create({
    data: {
      clientId,
      clientName: client.name,
      employeeId,
      employeeName,
      date: new Date(`${date}T00:00:00.000Z`),
      description,
      amount,
    },
  });

  revalidatePath("/admin/fixed-charges");
  revalidatePath("/admin/entries");
  revalidatePath("/log");
}

export async function deleteFixedItem(id: string) {
  const item = await prisma.fixedItem.findUnique({ where: { id } });
  if (!item) return;
  if (item.invoicedAt) throw new Error("This charge has already been invoiced and can't be deleted");

  await prisma.fixedItem.delete({ where: { id } });

  revalidatePath("/admin/fixed-charges");
  revalidatePath("/admin/entries");
  revalidatePath("/log");
}

export async function deleteOwnFixedItem(id: string, employeeId: string) {
  const item = await prisma.fixedItem.findUnique({ where: { id } });
  if (!item) return;
  if (item.employeeId !== employeeId) throw new Error("Not your charge");
  if (item.invoicedAt) throw new Error("This charge has already been invoiced and can't be deleted");

  await prisma.fixedItem.delete({ where: { id } });

  revalidatePath("/log");
  revalidatePath("/admin/fixed-charges");
  revalidatePath("/admin/entries");
}
