// src/app/layout.tsx
'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <SessionProvider>
        <body className={`${inter.className} bg-gray-50`}>
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </SessionProvider>
    </html>
  );
}