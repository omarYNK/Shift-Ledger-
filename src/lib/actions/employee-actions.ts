"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createEmployeeRecord(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Employee name is required");

  const existing = await prisma.employee.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    if (existing.archivedAt) {
      await prisma.employee.update({ where: { id: existing.id }, data: { archivedAt: null } });
    }
  } else {
    await prisma.employee.create({ data: { name } });
  }

  revalidatePath("/admin/employees");
}

export async function setEmployeeArchived(employeeId: string, archived: boolean) {
  await prisma.employee.update({
    where: { id: employeeId },
    data: { archivedAt: archived ? new Date() : null },
  });
  revalidatePath("/admin/employees");
}
