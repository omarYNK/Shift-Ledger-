export function clientCode(name: string): string {
  const letters = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return (letters.slice(0, 4) || "CLNT").padEnd(4, "X");
}

export function invoiceNumber(clientName: string, periodStart: Date, version: number): string {
  const yyyy = periodStart.getUTCFullYear();
  const mm = String(periodStart.getUTCMonth() + 1).padStart(2, "0");
  const base = `INV-${clientCode(clientName)}-${yyyy}${mm}`;
  return version > 1 ? `${base}-v${version}` : base;
}
