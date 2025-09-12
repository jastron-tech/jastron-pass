import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SuiWalletProvider } from "@/context/wallet-adapter";
import { Navigation, Breadcrumb } from "@/components/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jastron Pass",
  description: "A modern event ticketing platform built on Sui blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SuiWalletProvider>
          <div className="min-h-screen bg-background">
            <Navigation />
            <Breadcrumb />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </SuiWalletProvider>
      </body>
    </html>
  );
}
