import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "St Lawrence CC",
  description: "St Lawrence Cricket Club - Bitchet Green, Sevenoaks, Kent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-white text-gray-800`}>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
