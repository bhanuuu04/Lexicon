import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lexicon — Enterprise Password Risk Intelligence",
  description: "Enterprise Password Risk Intelligence Platform for Active Directory credential risk analysis, bounded attack simulation, and AI remediation advisory.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen antialiased selection:bg-[#0071E3]/20 selection:text-[#0071E3] font-sans">
        {children}
      </body>
    </html>
  );
}
