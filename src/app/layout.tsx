import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shift Ledger",
  description: "Labor log and invoicing for warehouse work",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
