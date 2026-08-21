import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

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
    <html lang="en" className="h-full w-full overflow-hidden bg-[#f6f8fc] antialiased">
      <body className="h-full w-full overflow-hidden font-sans bg-[#f6f8fc] text-[#1f2937]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
