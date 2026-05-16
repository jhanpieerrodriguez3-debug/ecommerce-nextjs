import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

import { CartProvider } from "@/context/CartContext";

import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable:
    "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono =
  Geist_Mono({
    variable:
      "--font-geist-mono",
    subsets: ["latin"],
  });

export const metadata:
  Metadata = {
    title:
      "DigitalMarket",
    description:
      "Marketplace App",
  };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <Navbar />

          {children}
        </CartProvider>
      </body>
    </html>
  );
}