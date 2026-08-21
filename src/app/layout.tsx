import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MailOpen Control Plane | Web Admin",
  description: "Enterprise Mail Server Management & Control Plane for Postfix, Dovecot, OpenLDAP, and OpenDKIM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full w-full overflow-hidden antialiased ${geistSans.variable} ${geistMono.variable}`}>
      <body className="h-full w-full overflow-hidden font-sans bg-[#f8fafc] text-zinc-900 selection:bg-zinc-900 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
