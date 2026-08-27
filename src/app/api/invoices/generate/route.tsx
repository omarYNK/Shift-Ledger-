import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { generateInvoice } from "@/lib/invoice";
import { InvoicePdf } from "@/lib/invoice-pdf";
import { getIdentity } from "@/lib/identity";

export const runtime = "nodejs";

async function handle(clientId: string, periodStartRaw: string, periodEndRaw: string) {
  if (!clientId || !periodStartRaw || !periodEndRaw) {
    return NextResponse.json({ error: "Missing clientId or period" }, { status: 400 });
  }

  const periodStart = new Date(`${periodStartRaw}T00:00:00.000Z`);
  const periodEnd = new Date(`${periodEndRaw}T00:00:00.000Z`);

  const settings = await prisma.businessSettings.findUnique({ where: { id: 1 } });

  const { invoice, client, laborItems, fixedItems, subtotalLabor, subtotalFixed, total } =
    await generateInvoice(clientId, periodStart, periodEnd);

  const pdfBuffer = await renderToBuffer(
    <InvoicePdf
      businessName={settings?.businessName || "Shift Ledger"}
      businessInfo={settings?.businessInfo || ""}
      clientName={client.name}
      clientRate={client.hourlyRate !== null ? Number(client.hourlyRate) : null}
      invoiceNumber={invoice.invoiceNumber}
      invoiceDate={invoice.createdAt}
      periodStart={periodStart}
      periodEnd={periodEnd}
      laborItems={laborItems.map((e) => ({
        date: e.date,
        employeeName: e.employeeName,
        startTime: e.startTime,
        endTime: e.endTime,
        hours: Number(e.hours),
        rate: Number(e.rate),
        amount: Number(e.amount),
      }))}
      fixedItems={fixedItems.map((f) => ({ date: f.date, description: f.description, amount: Number(f.amount) }))}
      subtotalLabor={subtotalLabor}
      subtotalFixed={subtotalFixed}
      total={total}
    />
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}

export async function POST(req: NextRequest) {
  const identity = await getIdentity();
  if (identity?.type !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const formData = await req.formData();
  const clientId = String(formData.get("clientId") ?? "");
  const periodStart = String(formData.get("periodStart") ?? "");
  const periodEnd = String(formData.get("periodEnd") ?? "");
  return handle(clientId, periodStart, periodEnd);
}
