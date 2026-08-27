"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateSettings(formData: FormData) {
  const businessName = String(formData.get("businessName") ?? "").trim();
  const businessInfo = String(formData.get("businessInfo") ?? "").trim();

  await prisma.businessSettings.upsert({
    where: { id: 1 },
    create: { id: 1, businessName, businessInfo },
    update: { businessName, businessInfo },
  });

  revalidatePath("/admin/settings");
}
