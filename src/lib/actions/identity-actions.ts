"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearIdentity, setIdentity } from "@/lib/identity";

export async function chooseAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password !== process.env.ADMIN_PASSWORD) {
    throw new Error("Incorrect password");
  }
  await setIdentity({ type: "admin" });
  redirect("/admin");
}

export async function chooseEmployee(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Name is required");
  }

  let employee = await prisma.employee.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, archivedAt: null },
  });

  if (!employee) {
    employee = await prisma.employee.create({ data: { name } });
  }

  await setIdentity({ type: "employee", employeeId: employee.id, employeeName: employee.name });
  redirect("/log");
}

export async function switchUser() {
  await clearIdentity();
  redirect("/");
}
