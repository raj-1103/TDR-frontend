import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TDR Chain — Surat Municipal Corporation",
  description: "Blockchain-backed Transfer of Development Rights management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
