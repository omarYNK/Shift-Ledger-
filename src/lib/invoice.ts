import { prisma } from "@/lib/prisma";
import { roundToCents } from "@/lib/hours";
import { invoiceNumber } from "@/lib/invoice-number";

export async function getInvoiceData(clientId: string, periodStart: Date, periodEnd: Date) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("Client not found");

  const [laborItems, fixedItems] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { clientId, date: { gte: periodStart, lte: periodEnd } },
      orderBy: { date: "asc" },
    }),
    prisma.fixedItem.findMany({
      where: { clientId, date: { gte: periodStart, lte: periodEnd } },
      orderBy: { date: "asc" },
    }),
  ]);

  const subtotalLabor = roundToCents(laborItems.reduce((sum, e) => sum + Number(e.amount), 0));
  const subtotalFixed = roundToCents(fixedItems.reduce((sum, f) => sum + Number(f.amount), 0));
  const total = roundToCents(subtotalLabor + subtotalFixed);

  return { client, laborItems, fixedItems, subtotalLabor, subtotalFixed, total };
}

/**
 * Generates (or re-generates) an invoice for a client/period: locks every
 * included time entry / fixed item by stamping invoicedAt, and writes a new
 * versioned Invoice record. Past invoice versions are kept for audit rather
 * than overwritten, per the "reproducible historical invoices" requirement.
 */
export async function generateInvoice(clientId: string, periodStart: Date, periodEnd: Date) {
  const data = await getInvoiceData(clientId, periodStart, periodEnd);

  const existing = await prisma.invoice.findMany({
    where: { clientId, periodStart, periodEnd },
    orderBy: { version: "desc" },
    take: 1,
  });
  const nextVersion = (existing[0]?.version ?? 0) + 1;
  const number = invoiceNumber(data.client.name, periodStart, nextVersion);
  const now = new Date();

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        clientId,
        clientName: data.client.name,
        periodStart,
        periodEnd,
        invoiceNumber: number,
        version: nextVersion,
        subtotalLabor: data.subtotalLabor,
        subtotalFixed: data.subtotalFixed,
        total: data.total,
      },
    });

    if (data.laborItems.length > 0) {
      await tx.timeEntry.updateMany({
        where: { id: { in: data.laborItems.map((e) => e.id) } },
        data: { invoicedAt: now },
      });
    }
    if (data.fixedItems.length > 0) {
      await tx.fixedItem.updateMany({
        where: { id: { in: data.fixedItems.map((f) => f.id) } },
        data: { invoicedAt: now },
      });
    }

    return created;
  });

  return { invoice, ...data };
}
