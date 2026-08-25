import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenMail | Modern Mail Server & Webmail",
  description: "Autonomous Self-Hosted Mail Server Control Plane & Webmail client for Postfix, Dovecot, OpenLDAP, and OpenDKIM",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full w-full overflow-hidden antialiased ${geistSans.variable} ${geistMono.variable}`}>
      <body className="h-full w-full overflow-hidden font-sans bg-[#f8fafc] text-zinc-900 selection:bg-zinc-900 selection:text-white">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
