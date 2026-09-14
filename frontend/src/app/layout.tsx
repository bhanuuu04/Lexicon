import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lexicon — Enterprise Password Risk Intelligence Platform",
  description: "Enterprise Password Risk Intelligence Platform for Active Directory credential risk analysis, bounded attack simulation, and AI remediation advisory.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
